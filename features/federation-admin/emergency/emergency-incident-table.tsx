"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  ShieldAlert,
  AlertTriangle,
  ChevronRight,
  MapPin,
  Clock,
  CheckCircle2,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Archive, Loader2, XCircle } from "lucide-react";
import { FederationIncidentSummary } from "@/lib/emergency/control-center-store";

interface EmergencyIncidentTableProps {
  incidents: FederationIncidentSummary[];
  onSearchChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onSeverityChange: (val: string) => void;
  onShortageToggle: (val: boolean) => void;
  onIncidentArchived?: () => void;
  onIncidentCancelled?: () => void;
  searchValue: string;
  statusFilter: string;
  severityFilter: string;
  shortageFilter: boolean;
}

export function EmergencyIncidentTable({
  incidents,
  onSearchChange,
  onStatusChange,
  onSeverityChange,
  onShortageToggle,
  onIncidentArchived,
  onIncidentCancelled,
  searchValue,
  statusFilter,
  severityFilter,
  shortageFilter,
}: EmergencyIncidentTableProps) {
  const [archivingId, setArchivingId] = React.useState<string | null>(null);
  const [cancellingId, setCancellingId] = React.useState<string | null>(null);

  const handleCancelIncident = async (incidentId: string, emergencyId: string) => {
    const reason = window.prompt(
      `Enter operational justification reason to cancel emergency ${emergencyId}:`,
      "Resolved/cancelled by Federation Administration"
    );
    if (!reason || !reason.trim()) return;

    try {
      setCancellingId(incidentId);
      const res = await fetch(`/api/emergency/incidents/${incidentId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (onIncidentCancelled) onIncidentCancelled();
      } else {
        alert(data.error || "Failed to cancel incident.");
      }
    } catch {
      alert("Network error cancelling incident.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleArchive = async (incidentId: string) => {
    const confirmed = window.confirm(
      "Archive this completed incident? It will be removed from the active control center list while preserving all historical audit information."
    );
    if (!confirmed) return;

    try {
      setArchivingId(incidentId);
      const res = await fetch(`/api/emergency/incidents/${incidentId}/archive`, {
        method: "POST",
      });
      if (res.ok) {
        if (onIncidentArchived) onIncidentArchived();
      } else {
        const json = await res.json();
        alert(json.error || "Failed to archive incident.");
      }
    } catch {
      alert("Network error archiving incident.");
    } finally {
      setArchivingId(null);
    }
  };
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Federation Emergency Incidents
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live operational supervision of reported incidents within this cooperative federation
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search ID, type, location..."
                className="h-8 text-xs pl-8"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>

            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium"
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              aria-label="Filter by incident status"
            >
              <option value="ALL">All Statuses</option>
              <option value="AWAITING_RESPONSE">Awaiting Response</option>
              <option value="DISPATCHING">Dispatching</option>
              <option value="TEAM_FORMING">Team Forming</option>
              <option value="ACTIVE">Active Operation</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="ARCHIVED">Archived Incidents</option>
            </select>

            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium"
              value={severityFilter}
              onChange={(e) => onSeverityChange(e.target.value)}
              aria-label="Filter by incident severity"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <Button
              variant={shortageFilter ? "destructive" : "outline"}
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={() => onShortageToggle(!shortageFilter)}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Shortage Only
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {incidents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground mb-3">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">No Emergency Incidents Match Filter</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              There are currently no active emergency incidents matching your selected search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60 overflow-x-auto">
            {incidents.map((inc) => {
              const formattedDate = new Date(inc.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                day: "numeric",
                month: "short",
              });

              return (
                <div
                  key={inc.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                >
                  {/* Left Column: Identifiers & Type */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-foreground">
                        {inc.emergency_id}
                      </span>
                      {inc.severity === "CRITICAL" && (
                        <Badge variant="destructive" className="text-[10px] font-mono uppercase font-bold py-0">
                          Critical
                        </Badge>
                      )}
                      {inc.severity === "HIGH" && (
                        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px] font-mono uppercase font-semibold py-0">
                          High
                        </Badge>
                      )}
                      {inc.severity === "MEDIUM" && (
                        <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-[10px] font-mono uppercase py-0">
                          Medium
                        </Badge>
                      )}
                      {inc.severity === "LOW" && (
                        <Badge variant="secondary" className="text-[10px] font-mono uppercase py-0">
                          Low
                        </Badge>
                      )}

                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold py-0 ${
                          inc.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : inc.status === "TEAM_FORMING"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                            : inc.status === "AWAITING_RESPONSE"
                            ? "bg-amber-500/15 text-amber-500 border-amber-500/40 font-bold"
                            : inc.status === "STAFFING_SHORTAGE"
                            ? "bg-red-500/10 text-red-400 border-red-500/30"
                            : inc.status === "CANCELLED"
                            ? "bg-rose-500/15 text-rose-500 border-rose-500/40 font-bold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {inc.status.replace(/_/g, " ")}
                      </Badge>
                      {inc.is_archived && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono uppercase bg-slate-500/10 text-slate-400 border-slate-500/30 py-0"
                        >
                          Archived
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground truncate">{inc.emergency_type}</h4>
                      <span className="text-xs text-muted-foreground">• {inc.category_name}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1 truncate max-w-xs">
                        <MapPin className="h-3 w-3 shrink-0" /> {inc.location}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3 shrink-0" /> {formattedDate}
                      </span>
                    </div>
                  </div>

                  {/* Middle Column: Staffing & Progress */}
                  <div className="flex items-center gap-6 shrink-0">
                    {/* Staffing Status */}
                    <div className="text-left md:text-right space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Response Staffing</div>
                      {inc.has_shortage ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>
                            {inc.accepted_worker_count}/{inc.required_worker_count} Staffed (Missing {inc.shortage_count})
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>
                            {inc.accepted_worker_count}/{inc.required_worker_count} Fully Staffed
                          </span>
                        </div>
                      )}
                      {inc.team_lead_name && (
                        <div className="text-[11px] text-muted-foreground flex items-center md:justify-end gap-1">
                          👑 Lead: <span className="text-foreground font-medium">{inc.team_lead_name}</span>
                        </div>
                      )}
                      {inc.pending_requests_count > 0 && (
                        <div className="text-[10px] font-semibold text-red-400">
                          ⚠️ {inc.pending_requests_count} Support Request Pending
                        </div>
                      )}
                    </div>

                    {/* Task Progress */}
                    {inc.task_progress && (
                      <div className="hidden lg:block text-right space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Task Completion</div>
                        <div className="font-mono text-xs font-bold text-foreground">
                          {inc.task_progress.completed}/{inc.task_progress.total} ({inc.task_progress.percentage}%)
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      {(inc.status === "CLOSED" || inc.status === "RESOLVED" || inc.status === "CANCELLED") && !inc.is_archived && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={archivingId === inc.id}
                          onClick={() => handleArchive(inc.id)}
                          className="h-8 gap-1 font-semibold text-xs border-border text-muted-foreground hover:text-foreground"
                          title="Archive completed emergency and remove from active list"
                        >
                          {archivingId === inc.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Archive className="h-3.5 w-3.5" />
                          )}
                          Archive
                        </Button>
                      )}

                      {inc.status !== "CLOSED" && inc.status !== "RESOLVED" && inc.status !== "CANCELLED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={cancellingId === inc.id}
                          onClick={() => handleCancelIncident(inc.id, inc.emergency_id)}
                          className="h-8 gap-1 font-semibold text-xs border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:text-rose-400"
                          title="Cancel emergency incident"
                        >
                          {cancellingId === inc.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          Cancel
                        </Button>
                      )}

                      <Link href={`/federation-admin/emergency/${inc.id}`}>
                        <Button size="sm" className="h-8 gap-1 font-semibold text-xs ml-1">
                          Inspect & Control
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
