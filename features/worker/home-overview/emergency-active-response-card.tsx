"use client";

import * as React from "react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  QrCode,
  Check,
  RefreshCw,
  FileCheck,
  Send,
  Users,
  ChevronDown,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";

export interface EmergencyActiveResponseCardProps {
  workerId?: string;
  onRefresh?: () => void;
}

export function EmergencyActiveResponseCard({
  workerId,
  onRefresh,
}: EmergencyActiveResponseCardProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [team, setTeam] = React.useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [incident, setIncident] = React.useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // Verification state
  const [verifyCode, setVerifyCode] = React.useState<string>("");
  const [isVerifying, setIsVerifying] = React.useState<boolean>(false);
  const [isCheckedIn, setIsCheckedIn] = React.useState<boolean>(false);
  const [isCheckingIn, setIsCheckingIn] = React.useState<boolean>(false);

  // Resolution modal
  const [showResolveModal, setShowResolveModal] = React.useState<boolean>(false);
  const [resolutionSummary, setResolutionSummary] = React.useState<string>("");
  const [completedWork, setCompletedWork] = React.useState<string>("");
  const [remainingConcerns, setRemainingConcerns] = React.useState<string>("");
  const [isSubmittingResolve, setIsSubmittingResolve] = React.useState<boolean>(false);

  // Feedback message
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const fetchActiveAssignment = React.useCallback(async (showLoading = true) => {
    if (!workerId) return;
    try {
      if (showLoading && !team) setIsLoading(true);
      const res = await fetch(`/api/emergency/teams?workerId=${workerId}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.team) {
        if (json.team.status === "DISBANDED") {
          setTeam(null);
          setIncident(null);
          return;
        }

        // Fetch incident details and check-in status in parallel
        const [incRes, checkInRes] = await Promise.all([
          fetch(`/api/emergency/incidents/${json.team.incident_id}`),
          fetch(`/api/emergency/check-in?incidentId=${json.team.incident_id}`),
        ]);

        if (incRes.ok) {
          const incJson = await incRes.json();
          if (incJson.success) {
            if (["CLOSED", "RESOLVED", "CANCELLED"].includes(incJson.incident?.status)) {
              setTeam(null);
              setIncident(null);
              return;
            }
            setIncident(incJson.incident);
            setTasks(incJson.tasks || []);
          }
        }

        const member = (json.team.members || []).find((m: any) => m.worker_id === workerId);
        if (!member || member.status === "RELEASED" || member.status === "NO_SHOW") {
          setTeam(null);
          setIncident(null);
          return;
        }

        setTeam(json.team);

        if (checkInRes.ok) {
          const cJson = await checkInRes.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const found = (cJson.checkIns || []).some((c: any) => c.worker_id === workerId);
          setIsCheckedIn(found);
        }
      } else {
        setTeam(null);
        setIncident(null);
      }
    } catch {
      // Quiet
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [workerId]);

  React.useEffect(() => {
    fetchActiveAssignment(true);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [fetchActiveAssignment]);

  const handleRealtimeUpdate = React.useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchActiveAssignment(false);
    }, 150);
  }, [fetchActiveAssignment]);

  useRealtimeSubscription({
    table: "emergency_response_teams",
    enabled: !!workerId,
    onPayload: handleRealtimeUpdate,
  });

  useRealtimeSubscription({
    table: "emergency_incidents",
    enabled: !!workerId,
    onPayload: handleRealtimeUpdate,
  });

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode.trim() || !incident) return;
    setIsVerifying(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/emergency/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentId: incident.id,
          tokenOrCode: verifyCode.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setFeedback({ type: "success", text: "Arrival verified! Field response started." });
        setVerifyCode("");
        setIsCheckedIn(true);
        await fetchActiveAssignment();
        if (onRefresh) onRefresh();
      } else {
        setFeedback({ type: "error", text: json.error || "Verification failed." });
      }
    } catch {
      setFeedback({ type: "error", text: "Verification network failure." });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCheckIn = async () => {
    if (!incident || !team) return;
    setIsCheckingIn(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/emergency/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentId: incident.id,
          teamId: team.id,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setIsCheckedIn(true);
        setFeedback({ type: "success", text: "Check-in confirmed on scene." });
        await fetchActiveAssignment();
        if (onRefresh) onRefresh();
      } else {
        setFeedback({ type: "error", text: json.error || "Check-in failed." });
      }
    } catch {
      setFeedback({ type: "error", text: "Check-in network failure." });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleUpdateFieldStatus = async (newStatus: string) => {
    if (!team) return;
    try {
      const res = await fetch(`/api/emergency/teams/${team.id}/field-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldStatus: newStatus }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setFeedback({ type: "success", text: `Team field status: ${newStatus}` });
        await fetchActiveAssignment();
        if (onRefresh) onRefresh();
      } else {
        setFeedback({ type: "error", text: json.error || "Status update failed." });
      }
    } catch {
      setFeedback({ type: "error", text: "Status update failed." });
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/emergency/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "COMPLETE", completionNotes: "Task completed on scene." }),
      });
      if (res.ok) {
        setFeedback({ type: "success", text: "Task marked completed." });
        await fetchActiveAssignment();
        if (onRefresh) onRefresh();
      }
    } catch {
      // Quiet
    }
  };

  const handleRequestResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident || !resolutionSummary.trim() || !completedWork.trim()) return;
    setIsSubmittingResolve(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/emergency/incidents/${incident.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolutionSummary: resolutionSummary.trim(),
          completedWork: completedWork.trim(),
          remainingConcerns: remainingConcerns.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setShowResolveModal(false);
        setFeedback({ type: "success", text: "Resolution requested! Submitted to Federation Admin for closure." });
        await fetchActiveAssignment();
        if (onRefresh) onRefresh();
      } else {
        setFeedback({ type: "error", text: json.error || "Resolution request failed." });
      }
    } catch {
      setFeedback({ type: "error", text: "Resolution request failed." });
    } finally {
      setIsSubmittingResolve(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentMember = team ? (team.members || []).find((m: any) => m.worker_id === workerId) : null;

  if (
    (isLoading && !team) ||
    !team ||
    !incident ||
    ["CLOSED", "RESOLVED", "CANCELLED"].includes(incident.status) ||
    team.status === "DISBANDED" ||
    !currentMember ||
    currentMember.status === "RELEASED" ||
    currentMember.status === "NO_SHOW"
  ) {
    return null;
  }

  const isTeamLead = team.team_lead_worker_id === workerId || currentMember?.is_team_lead;
  const isVerified = incident.isVerified;

  return (
    <Card className="border-2 border-rose-600 bg-white dark:bg-slate-900 shadow-xl rounded-2xl p-5 md:p-6 space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-100 dark:border-rose-900/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black shadow-md shadow-rose-600/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-black text-rose-600 dark:text-rose-400">
                {incident.emergencyId}
              </span>
              <Badge className="bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 font-extrabold text-[10px]">
                {incident.severity}
              </Badge>
              {isTeamLead && (
                <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-black text-[10px]">
                  Team Lead
                </Badge>
              )}
            </div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">
              {incident.emergencyType}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge variant="outline" className="text-xs font-bold border-slate-300">
            Field: {team.field_status || "DISPATCHED"}
          </Badge>
        </div>
      </div>

      {feedback && (
        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${feedback.type === "success" ? "bg-emerald-50 text-emerald-900 border border-emerald-300" : "bg-rose-50 text-rose-900 border border-rose-300"}`}>
          {feedback.type === "success" ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
          <span className="font-semibold">{feedback.text}</span>
        </div>
      )}

      {/* Location */}
      <div className="text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-2">
        <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        <span className="font-semibold text-slate-800 dark:text-slate-200">{incident.location}</span>
      </div>

      {/* One-Time Verification & Check-In Box */}
      <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-rose-600" />
            Arrival Verification & Check-In
          </span>
          {isVerified ? (
            <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> Verified
            </span>
          ) : (
            <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold">
              Verification Required on Scene
            </span>
          )}
        </div>

        {!isVerified ? (
          <form onSubmit={handleVerify} className="flex gap-2">
            <Input
              placeholder="Enter Customer's Code (e.g. EMG-4892)"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              className="text-xs font-mono uppercase bg-white dark:bg-slate-900"
            />
            <Button
              type="submit"
              disabled={isVerifying || !verifyCode.trim()}
              className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-4 shrink-0"
            >
              {isVerifying ? "Verifying..." : "Verify Arrival"}
            </Button>
          </form>
        ) : !isCheckedIn ? (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Arrival verified for team. Check in to record your active attendance.
            </p>
            <Button
              size="sm"
              onClick={handleCheckIn}
              disabled={isCheckingIn}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
            >
              {isCheckingIn ? "Checking in..." : "Check In Now"}
            </Button>
          </div>
        ) : (
          <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            You are checked in and active on scene.
          </p>
        )}
      </div>

      {/* Team Lead Controls: Advance Field Status & Request Resolution */}
      {isTeamLead && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
            Team Lead Field Coordination
          </span>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-600 dark:text-slate-400">Field Phase:</span>
            {["ARRIVING", "ON_SITE", "WORK_IN_PROGRESS", "AWAITING_SUPPORT"].map((status) => (
              <Button
                key={status}
                size="sm"
                variant={team.field_status === status ? "default" : "outline"}
                className={`text-[11px] h-7 ${team.field_status === status ? "bg-slate-900 text-white" : ""}`}
                onClick={() => handleUpdateFieldStatus(status)}
              >
                {status.replace(/_/g, " ")}
              </Button>
            ))}

            <div className="ml-auto">
              <Button
                size="sm"
                onClick={() => setShowResolveModal(true)}
                disabled={incident.status === "RESOLVED" || incident.status === "CLOSED"}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs gap-1.5"
              >
                <FileCheck className="w-3.5 h-3.5" />
                {incident.status === "RESOLVED" ? "Resolution Submitted" : "Request Incident Resolution"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Incident Tasks Checklist */}
      {tasks.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
            Operational Response Tasks ({tasks.filter((t) => t.status === "COMPLETED").length}/{tasks.length})
          </span>
          <div className="space-y-2">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <span className={`font-bold block ${t.status === "COMPLETED" ? "line-through text-slate-400" : "text-slate-900 dark:text-slate-100"}`}>
                    {t.title}
                  </span>
                  <p className="text-[11px] text-slate-500">{t.description}</p>
                </div>
                {t.status !== "COMPLETED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[11px] h-7 font-bold border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => handleCompleteTask(t.id)}
                  >
                    Mark Done
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolution Request Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
              Request Emergency Incident Resolution
            </h3>
            <p className="text-xs text-slate-500">
              Submit completion summary to the Federation Admin for operational review and formal closure.
            </p>

            <form onSubmit={handleRequestResolution} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Resolution Summary *
                </label>
                <textarea
                  required
                  rows={2}
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  placeholder="e.g. Society main riser isolated and auxiliary pump sealed. Flooding contained."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-950"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Completed Work Report *
                </label>
                <textarea
                  required
                  rows={3}
                  value={completedWork}
                  onChange={(e) => setCompletedWork(e.target.value)}
                  placeholder="Detailed breakdown of repairs, valve replacements, and safety measures executed."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-950"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Remaining Concerns (Optional)
                </label>
                <input
                  type="text"
                  value={remainingConcerns}
                  onChange={(e) => setRemainingConcerns(e.target.value)}
                  placeholder="Any follow-up recommendations for society maintenance"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-950"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResolveModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingResolve}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs"
                >
                  {isSubmittingResolve ? "Submitting..." : "Submit Resolution"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}
