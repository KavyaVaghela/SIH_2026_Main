"use client";

import * as React from "react";
import { AlertCircle, ShieldAlert, CheckCircle2, XCircle, MapPin, Clock, Wrench } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";

export interface EmergencyOpportunity {
  id: string; // dispatch record id
  incident_id: string;
  emergency_id: string;
  category_name: string;
  emergency_type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  location: string;
  description: string;
  required_role: string;
  matched_skills: string[];
  status: "DISPATCHED" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "WITHDRAWN";
  offered_at: string;
}

export interface EmergencyOpportunitiesCardProps {
  workerId?: string;
  onResponseSuccess?: () => void;
}

export function EmergencyOpportunitiesCard({
  workerId,
  onResponseSuccess,
}: EmergencyOpportunitiesCardProps) {
  const [opportunities, setOpportunities] = React.useState<EmergencyOpportunity[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [actingDispatchId, setActingDispatchId] = React.useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = React.useState<{
    type: "success" | "error" | "conflict";
    text: string;
  } | null>(null);

  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const fetchOpportunities = React.useCallback(async (showLoading = true) => {
    if (!workerId) return;
    try {
      if (showLoading && opportunities.length === 0) setIsLoading(true);
      const res = await fetch(`/api/emergency/dispatch?workerId=${workerId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.dispatches)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: EmergencyOpportunity[] = data.dispatches.map((d: any) => ({
          id: d.id,
          incident_id: d.incident_id,
          emergency_id: d.emergency_incidents?.emergency_id || "EMG-2026",
          category_name: d.emergency_incidents?.category_name || "Emergency Service",
          emergency_type: d.emergency_incidents?.emergency_type || "Incident",
          severity: d.emergency_incidents?.severity || "HIGH",
          location: d.emergency_incidents?.location || "Ahmedabad Area",
          description: d.emergency_incidents?.description || "",
          required_role: d.required_role,
          matched_skills: d.matched_skills || [],
          status: d.status,
          offered_at: d.offered_at,
        }));
        setOpportunities(mapped.filter((o) => o.status === "DISPATCHED"));
      }
    } catch (err) {
      console.warn("Emergency opportunities fetch notice:", err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [workerId]);

  React.useEffect(() => {
    fetchOpportunities(true);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [fetchOpportunities]);

  const handleRealtimeDispatch = React.useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchOpportunities(false);
    }, 150);
  }, [fetchOpportunities]);

  // Live real-time link: Worker receives dispatched opportunities immediately
  useRealtimeSubscription({
    table: "emergency_dispatch_pool",
    enabled: !!workerId,
    onPayload: handleRealtimeDispatch,
  });

  const handleRespond = async (dispatchId: string, action: "ACCEPT" | "DECLINE") => {
    setActingDispatchId(dispatchId);
    setFeedbackMessage(null);
    try {
      const res = await fetch(`/api/emergency/dispatch/${dispatchId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: action }),
      });

      const data = await res.json();

      if (res.status === 200 && data.success) {
        setFeedbackMessage({
          type: "success",
          text:
            action === "ACCEPT"
              ? data.team_formed
                ? "Accepted! Emergency response team has formed. You are an active team member."
                : "Accepted! Slot secured. Awaiting remaining response team members."
              : "Opportunity declined.",
        });
        await fetchOpportunities();
        if (onResponseSuccess) onResponseSuccess();
      } else if (res.status === 409) {
        setFeedbackMessage({
          type: "conflict",
          text: data.error || "Capacity fulfilled: All slots have already been accepted by other workers.",
        });
        await fetchOpportunities();
      } else {
        setFeedbackMessage({
          type: "error",
          text: data.error || "Failed to process emergency response.",
        });
      }
    } catch (err: unknown) {
      setFeedbackMessage({
        type: "error",
        text: (err as Error)?.message || "Network error while submitting response.",
      });
    } finally {
      setActingDispatchId(null);
    }
  };

  // If no opportunities and not loading, do not render card
  if (!isLoading && opportunities.length === 0) {
    return null;
  }

  return (
    <Card className="border-red-500/40 bg-gradient-to-br from-red-500/5 via-background to-amber-500/5 shadow-md shadow-red-500/5 overflow-hidden">
      <CardHeader className="p-4 sm:p-5 border-b border-red-500/20 bg-red-500/10 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-red-600 text-white shadow-sm animate-pulse">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base sm:text-lg font-bold text-red-900 dark:text-red-300">
                Active Emergency Dispatches
              </CardTitle>
              <Badge variant="destructive" className="animate-pulse text-[11px] font-bold">
                {opportunities.length} ACTION REQUIRED
              </Badge>
            </div>
            <p className="text-xs text-red-700/80 dark:text-red-400">
              Cooperative Emergency Response Network — Immediate availability requested
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {feedbackMessage && (
          <div
            className={`p-3 rounded-md text-xs font-medium flex items-center gap-2 ${
              feedbackMessage.type === "success"
                ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/30"
                : feedbackMessage.type === "conflict"
                ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-500/30"
                : "bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-300 border border-red-500/30"
            }`}
          >
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {opportunities.map((opp) => {
          const isActing = actingDispatchId === opp.id;
          return (
            <div
              key={opp.id}
              className="p-4 rounded-xl border border-red-200 dark:border-red-950/60 bg-card/60 backdrop-blur-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-red-700 dark:text-red-400">
                      {opp.emergency_id}
                    </span>
                    <Badge variant="outline" className="border-red-500/40 text-red-800 dark:text-red-300 text-[10px]">
                      {opp.category_name}
                    </Badge>
                    <Badge
                      className={`text-[10px] uppercase font-bold ${
                        opp.severity === "CRITICAL"
                          ? "bg-red-700 text-white"
                          : "bg-amber-600 text-white"
                      }`}
                    >
                      {opp.severity} Severity
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-base text-foreground mt-1">
                    {opp.emergency_type}
                  </h4>
                </div>

                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-red-500" />
                  <span>Offered {new Date(opp.offered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {opp.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {opp.description}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  <span className="truncate">{opp.location}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Wrench className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>
                    Required Role: <strong className="text-foreground">{opp.required_role}</strong>
                  </span>
                </div>
              </div>

              {opp.matched_skills && opp.matched_skills.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center pt-1">
                  <span className="text-[11px] text-muted-foreground mr-1">Skills:</span>
                  {opp.matched_skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isActing}
                  onClick={() => handleRespond(opp.id, "DECLINE")}
                  className="border-border text-muted-foreground hover:bg-muted text-xs h-8"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  Decline
                </Button>

                <Button
                  size="sm"
                  disabled={isActing}
                  onClick={() => handleRespond(opp.id, "ACCEPT")}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold h-8 shadow-sm"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  {isActing ? "Submitting..." : "Accept Emergency Role"}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
