"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldAlert, RefreshCw, Loader2, AlertTriangle, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmergencyKpiSummary } from "@/features/federation-admin/emergency/emergency-kpi-summary";
import { EmergencyIncidentTable } from "@/features/federation-admin/emergency/emergency-incident-table";
import { FederationIncidentSummary } from "@/lib/emergency/control-center-store";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";

interface LiveAlertInfo {
  id: string;
  emergencyId: string;
  type: string;
  severity: string;
  location: string;
}

export default function FederationEmergencyDashboardPage() {
  const [incidents, setIncidents] = React.useState<FederationIncidentSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [searchValue, setSearchValue] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = React.useState<string>("ALL");
  const [shortageFilter, setShortageFilter] = React.useState<boolean>(false);
  const [liveAlert, setLiveAlert] = React.useState<LiveAlertInfo | null>(null);

  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const fetchIncidents = React.useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (severityFilter !== "ALL") params.append("severity", severityFilter);
      if (searchValue) params.append("search", searchValue);
      if (shortageFilter) params.append("hasShortage", "true");

      const res = await fetch(`/api/emergency/federation/incidents?${params.toString()}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.incidents)) {
        setIncidents(json.incidents);
      }
    } catch (err) {
      console.warn("Notice: failed to load federation incidents", err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [statusFilter, severityFilter, searchValue, shortageFilter]);

  React.useEffect(() => {
    fetchIncidents(true);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [fetchIncidents]);

  const triggerDebouncedFetch = React.useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchIncidents(false);
    }, 150);
  }, [fetchIncidents]);

  // Realtime updates & live alert handling
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleIncidentPayload = React.useCallback((payload: any) => {
    triggerDebouncedFetch();

    if (payload?.eventType === "INSERT" && payload?.new) {
      const row = payload.new;
      setLiveAlert({
        id: row.id,
        emergencyId: row.emergency_id || "NEW-EMG",
        type: row.emergency_type || "Emergency Incident",
        severity: row.severity || "HIGH",
        location: row.location || "Location provided",
      });
    }
  }, [triggerDebouncedFetch]);

  const { status: realtimeStatus } = useRealtimeSubscription({
    table: "emergency_incidents",
    onPayload: handleIncidentPayload,
  });

  useRealtimeSubscription({
    table: "emergency_response_teams",
    onPayload: triggerDebouncedFetch,
  });

  useRealtimeSubscription({
    table: "emergency_additional_worker_requests",
    onPayload: triggerDebouncedFetch,
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-500" />
            Federation Emergency Control Center
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Operational oversight, rapid response deployment, staffing shortage control, and field supervision
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Realtime Status Diagnostic Indicator */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border bg-muted/40">
            <span
              className={`h-2 w-2 rounded-full ${
                realtimeStatus === "SUBSCRIBED"
                  ? "bg-emerald-500 animate-pulse"
                  : realtimeStatus === "CONNECTING"
                  ? "bg-amber-500 animate-ping"
                  : "bg-muted-foreground"
              }`}
            />
            <span className="text-muted-foreground">
              {realtimeStatus === "SUBSCRIBED"
                ? "Realtime Live"
                : realtimeStatus === "CONNECTING"
                ? "Connecting Live Feed..."
                : "Realtime Standby"}
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 shrink-0"
            onClick={() => fetchIncidents()}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Live Feeds
          </Button>
        </div>
      </div>

      {/* Lightweight Live Alert Notification Banner */}
      {liveAlert && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start sm:items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold uppercase tracking-wide text-rose-500">
                  🚨 New Emergency Reported
                </span>
                <span className="font-mono text-xs font-bold text-foreground bg-background/80 px-2 py-0.5 rounded border">
                  {liveAlert.emergencyId}
                </span>
                <Badge variant="destructive" className="text-[10px] py-0">
                  {liveAlert.severity}
                </Badge>
              </div>
              <p className="text-xs font-medium text-foreground mt-0.5">
                {liveAlert.type} • <span className="text-muted-foreground">{liveAlert.location}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <Link href={`/federation-admin/emergency/${liveAlert.id}`}>
              <Button size="sm" className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5">
                Open Incident <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setLiveAlert(null)}
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* KPI Summary Cards */}
      <EmergencyKpiSummary incidents={incidents} />

      {/* Incidents Table with Operational Filters */}
      {isLoading && incidents.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center space-y-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading federation emergency feeds...</p>
        </div>
      ) : (
        <EmergencyIncidentTable
          incidents={incidents}
          searchValue={searchValue}
          statusFilter={statusFilter}
          severityFilter={severityFilter}
          shortageFilter={shortageFilter}
          onSearchChange={setSearchValue}
          onStatusChange={setStatusFilter}
          onSeverityChange={setSeverityFilter}
          onShortageToggle={setShortageFilter}
        />
      )}
    </div>
  );
}
