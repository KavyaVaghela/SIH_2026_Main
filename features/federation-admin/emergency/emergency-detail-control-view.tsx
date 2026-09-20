"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ArrowLeft,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User,
  Plus,
  RefreshCw,
  Edit3,
  XCircle,
  FileText,
  Loader2,
  UserCheck,
  Send,
  Building,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";

interface EmergencyDetailControlViewProps {
  incidentId: string;
}

export function EmergencyDetailControlView({ incidentId }: EmergencyDetailControlViewProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals & Action States
  const [isChangingSeverity, setIsChangingSeverity] = React.useState<boolean>(false);
  const [newSeverity, setNewSeverity] = React.useState<string>("CRITICAL");
  const [severityReason, setSeverityReason] = React.useState<string>("");

  const [isAddingWorker, setIsAddingWorker] = React.useState<boolean>(false);
  const [selectedWorkerId, setSelectedWorkerId] = React.useState<string>("");
  const [workerRole, setWorkerRole] = React.useState<string>("");

  const [isReplacingWorker, setIsReplacingWorker] = React.useState<boolean>(false);
  const [targetExistingWorkerId, setTargetExistingWorkerId] = React.useState<string>("");
  const [replacementWorkerId, setReplacementWorkerId] = React.useState<string>("");
  const [replaceReason, setReplaceReason] = React.useState<string>("");

  const [isRejectingRequestId, setIsRejectingRequestId] = React.useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState<string>("");

  const [isAddingTask, setIsAddingTask] = React.useState<boolean>(false);
  const [taskTitle, setTaskTitle] = React.useState<string>("");
  const [taskInstruction, setTaskInstruction] = React.useState<string>("");
  const [taskRole, setTaskRole] = React.useState<string>("");

  const [isCreatingSupportRequest, setIsCreatingSupportRequest] = React.useState<boolean>(false);
  const [supportType, setSupportType] = React.useState<"ADDITIONAL_TEAM" | "EXTERNAL_FEDERATION_SUPPORT" | "SPECIALIZED_UNIT">("ADDITIONAL_TEAM");
  const [supportRoles, setSupportRoles] = React.useState<string>("");
  const [supportCount, setSupportCount] = React.useState<number>(1);
  const [supportReason, setSupportReason] = React.useState<string>("");

  // Resolution & Closure Review States
  const [isClosingIncident, setIsClosingIncident] = React.useState<boolean>(false);
  const [closureAction, setClosureAction] = React.useState<"APPROVE" | "REOPEN">("APPROVE");
  const [closureNotes, setClosureNotes] = React.useState<string>("");

  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const handleReviewClosure = async (action: "APPROVE" | "REOPEN") => {
    try {
      setIsSubmitting(true);
      setFeedback(null);
      const res = await fetch(`/api/emergency/incidents/${incidentId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, closureNotes }),
      });
      const resJson = await res.json();
      if (res.ok && resJson.success) {
        setFeedback({
          type: "success",
          text:
            action === "APPROVE"
              ? "Emergency incident resolution approved and closed."
              : "Emergency incident reopened for further field response.",
        });
        setIsClosingIncident(false);
        setClosureNotes("");
        await fetchDetail();
      } else {
        setFeedback({ type: "error", text: resJson.error || "Failed to review closure." });
      }
    } catch (err) {
      setFeedback({ type: "error", text: (err as Error)?.message || "Action failed." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch Incident Control Packet
  const fetchDetail = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/emergency/federation/incidents/${incidentId}`);
      if (!res.ok) {
        setFeedback({ type: "error", text: "Failed to load incident detail. Verify administrative authority." });
        return;
      }
      const json = await res.json();
      if (json.success) {
        setData(json);
        setNewSeverity(json.incident.severity);
      }
    } catch (err) {
      setFeedback({ type: "error", text: (err as Error)?.message || "Failed to load incident." });
    } finally {
      setIsLoading(false);
    }
  }, [incidentId]);

  React.useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Realtime updates on all relevant emergency tables
  useRealtimeSubscription({
    table: "emergency_incidents",
    enabled: !!incidentId,
    onPayload: () => fetchDetail(),
  });

  useRealtimeSubscription({
    table: "emergency_response_teams",
    enabled: !!incidentId,
    onPayload: () => fetchDetail(),
  });

  useRealtimeSubscription({
    table: "emergency_incident_tasks",
    enabled: !!incidentId,
    onPayload: () => fetchDetail(),
  });

  useRealtimeSubscription({
    table: "emergency_additional_worker_requests",
    enabled: !!incidentId,
    onPayload: () => fetchDetail(),
  });

  useRealtimeSubscription({
    table: "emergency_audit_logs",
    enabled: !!incidentId,
    onPayload: () => fetchDetail(),
  });

  // Action: Change Severity
  const handleSaveSeverity = async () => {
    try {
      setIsSubmitting(true);
      setFeedback(null);
      const res = await fetch(`/api/emergency/federation/incidents/${incidentId}/severity`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ severity: newSeverity, reason: severityReason }),
      });
      const resJson = await res.json();
      if (res.ok && resJson.success) {
        setFeedback({ type: "success", text: "Emergency severity updated." });
        setIsChangingSeverity(false);
        setSeverityReason("");
        await fetchDetail();
      } else {
        setFeedback({ type: "error", text: resJson.error || "Failed to update severity." });
      }
    } catch (err) {
      setFeedback({ type: "error", text: (err as Error)?.message || "Action failed." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Add Worker
  const handleAddWorker = async () => {
    if (!selectedWorkerId || !workerRole) return;
    try {
      setIsSubmitting(true);
      setFeedback(null);
      const res = await fetch(`/api/emergency/federation/incidents/${incidentId}/workers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ADD", workerId: selectedWorkerId, role: workerRole }),
      });
      const resJson = await res.json();
      if (res.ok && resJson.success) {
        setFeedback({ type: "success", text: "Worker added to emergency response team." });
        setIsAddingWorker(false);
        setSelectedWorkerId("");
        setWorkerRole("");
        await fetchDetail();
      } else {
        setFeedback({ type: "error", text: resJson.error || "Failed to add worker." });
      }
    } catch (err) {
      setFeedback({ type: "error", text: (err as Error)?.message || "Action failed." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Replace Worker
  const handleReplaceWorker = async () => {
    if (!targetExistingWorkerId || !replacementWorkerId || !replaceReason) return;
    try {
      setIsSubmitting(true);
      setFeedback(null);
      const res = await fetch(`/api/emergency/federation/incidents/${incidentId}/workers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REPLACE",
          existingWorkerId: targetExistingWorkerId,
          replacementWorkerId,
          reason: replaceReason,
        }),
      });
      const resJson = await res.json();
      if (res.ok && resJson.success) {
        setFeedback({ type: "success", text: "Worker successfully replaced on emergency response team." });
        setIsReplacingWorker(false);
        setTargetExistingWorkerId("");
        setReplacementWorkerId("");
        setReplaceReason("");
        await fetchDetail();
      } else {
        setFeedback({ type: "error", text: resJson.error || "Failed to replace worker." });
      }
    } catch (err) {
      setFeedback({ type: "error", text: (err as Error)?.message || "Action failed." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Review Additional Worker Request
  const handleReviewRequest = async (requestId: string, action: "APPROVE" | "REJECT", reason?: string) => {
    try {
      setIsSubmitting(true);
      setFeedback(null);
      const res = await fetch(`/api/emergency/requests/additional-workers/${requestId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const resJson = await res.json();
      if (res.ok && resJson.success) {
        setFeedback({
          type: "success",
          text: `Support request ${action.toLowerCase()}ed. (Status: ${action === "APPROVE" ? "APPROVED" : "REJECTED"})`,
        });
        setIsRejectingRequestId(null);
        setRejectionReason("");
        await fetchDetail();
      } else {
        setFeedback({ type: "error", text: resJson.error || "Failed to review request." });
      }
    } catch (err) {
      setFeedback({ type: "error", text: (err as Error)?.message || "Action failed." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Add Custom Task
  const handleAddTask = async () => {
    if (!taskTitle) return;
    try {
      setIsSubmitting(true);
      setFeedback(null);
      const res = await fetch(`/api/emergency/federation/incidents/${incidentId}/response-plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_TASK",
          payload: { title: taskTitle, description: taskInstruction, assignedRole: taskRole },
        }),
      });
      const resJson = await res.json();
      if (res.ok && resJson.success) {
        setFeedback({ type: "success", text: "Operational task added to response plan." });
        setIsAddingTask(false);
        setTaskTitle("");
        setTaskInstruction("");
        setTaskRole("");
        await fetchDetail();
      } else {
        setFeedback({ type: "error", text: resJson.error || "Failed to add task." });
      }
    } catch (err) {
      setFeedback({ type: "error", text: (err as Error)?.message || "Action failed." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Cancel Task
  const handleCancelTask = async (taskId: string) => {
    try {
      setIsSubmitting(true);
      setFeedback(null);
      const res = await fetch(`/api/emergency/federation/incidents/${incidentId}/response-plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CANCEL_TASK",
          payload: { taskId, reason: "Cancelled by Federation Administrator" },
        }),
      });
      const resJson = await res.json();
      if (res.ok && resJson.success) {
        setFeedback({ type: "success", text: "Task marked as cancelled." });
        await fetchDetail();
      } else {
        setFeedback({ type: "error", text: resJson.error || "Failed to cancel task." });
      }
    } catch (err) {
      setFeedback({ type: "error", text: (err as Error)?.message || "Action failed." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Create Support Request
  const handleCreateSupportRequest = async () => {
    if (!supportReason) return;
    try {
      setIsSubmitting(true);
      setFeedback(null);
      const rolesArr = supportRoles
        ? supportRoles.split(",").map((r) => r.trim()).filter(Boolean)
        : [];
      const res = await fetch(`/api/emergency/federation/incidents/${incidentId}/support-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: supportType,
          requestedRoles: rolesArr,
          requestedWorkerCount: supportCount,
          reason: supportReason,
        }),
      });
      const resJson = await res.json();
      if (res.ok && resJson.success) {
        setFeedback({
          type: "success",
          text: "Emergency support request logged (Status: PENDING_REVIEW).",
        });
        setIsCreatingSupportRequest(false);
        setSupportRoles("");
        setSupportCount(1);
        setSupportReason("");
        await fetchDetail();
      } else {
        setFeedback({ type: "error", text: resJson.error || "Failed to submit request." });
      }
    } catch (err) {
      setFeedback({ type: "error", text: (err as Error)?.message || "Action failed." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading Federation Emergency Control Center...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center space-y-3">
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
        <h3 className="text-base font-bold text-foreground">Emergency Incident Not Found</h3>
        <p className="text-xs text-muted-foreground">This incident does not exist or belongs to another federation.</p>
        <Link href="/federation-admin/emergency">
          <Button size="sm" variant="outline">
            Back to Emergency Control
          </Button>
        </Link>
      </div>
    );
  }

  const { incident, responseMatrix, team, tasks, taskProgress, shortage, additionalRequests, supportRequests, eligibleWorkers, auditLogs } = data;

  return (
    <div className="space-y-6 pb-16">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/federation-admin/emergency">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Emergencies
            </Button>
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            Control Center: <span className="font-mono">{incident.emergency_id}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1"
            onClick={() => fetchDetail()}
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1 border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
            onClick={() => setIsChangingSeverity(true)}
          >
            <Edit3 className="h-3 w-3" /> Modify Severity
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-md text-xs font-medium border flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Shortage Warning Banner */}
      {shortage.hasShortage && (
        <div className="p-4 rounded-lg bg-amber-950/30 border border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-400">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">Emergency Staffing Shortage Detected</h4>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Current response team has only <strong>{shortage.accepted}</strong> of <strong>{shortage.required}</strong> required workers. <strong>{shortage.missing}</strong> additional personnel required.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1"
              onClick={() => setIsAddingWorker(true)}
            >
              <Plus className="h-3.5 w-3.5" /> Add Worker
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-amber-500/40 text-amber-300 gap-1"
              onClick={() => setIsCreatingSupportRequest(true)}
            >
              <Building className="h-3.5 w-3.5" /> Request Support
            </Button>
          </div>
        </div>
      )}

      {/* Resolution Review Banner */}
      {(incident.status === "RESOLVED" || incident.resolution_summary) && (
        <div className="p-5 rounded-xl bg-emerald-950/40 border-2 border-emerald-500 flex flex-col gap-4 text-emerald-300 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/30 pb-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-base font-bold text-foreground">
                  {incident.status === "CLOSED"
                    ? "Emergency Closed & Resolution Approved"
                    : "Field Resolution Submitted for Administrative Review"}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Team Lead reported on-scene operational completion. Review work summary and approve formal incident closure.
                </p>
              </div>
            </div>
            {incident.status !== "CLOSED" && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
                  onClick={() => {
                    setClosureAction("APPROVE");
                    setIsClosingIncident(true);
                  }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Close Incident
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-500 text-amber-400 hover:bg-amber-500/10 font-bold text-xs gap-1.5"
                  onClick={() => {
                    setClosureAction("REOPEN");
                    setIsClosingIncident(true);
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Request Further Work
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {incident.resolution_summary && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Resolution Summary
                </span>
                <p className="bg-background/80 p-3 rounded-lg border border-border text-foreground font-medium">
                  {incident.resolution_summary}
                </p>
              </div>
            )}
            {incident.completed_work && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Completed Work Report
                </span>
                <p className="bg-background/80 p-3 rounded-lg border border-border text-foreground font-medium">
                  {incident.completed_work}
                </p>
              </div>
            )}
          </div>

          {incident.closed_at && (
            <div className="text-[11px] text-muted-foreground flex items-center gap-2 pt-1 border-t border-emerald-500/20">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span>Closed on {new Date(incident.closed_at).toLocaleString()}</span>
              {incident.closure_notes && (
                <span className="text-foreground font-medium">— {incident.closure_notes}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Hero Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Incident Specifications */}
        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-foreground">Incident Specifications</CardTitle>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold py-0 ${
                    incident.status === "ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "text-muted-foreground"
                  }`}
                >
                  {incident.status}
                </Badge>
              </div>
              <Badge
                variant={incident.severity === "CRITICAL" ? "destructive" : "outline"}
                className="font-mono text-xs uppercase font-bold"
              >
                {incident.severity} SEVERITY
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground">{incident.emergency_type}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Category: {incident.category_name}</p>
            </div>

            <p className="text-xs text-foreground/90 bg-muted/30 p-3 rounded border border-border/40 leading-relaxed">
              {incident.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">{incident.location}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span>{new Date(incident.created_at).toLocaleString()}</span>
              </div>
              {incident.approx_people_affected && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4 text-primary shrink-0" />
                  <span>People Affected: <strong>{incident.approx_people_affected}</strong></span>
                </div>
              )}
              {incident.immediate_danger && (
                <div className="flex items-center gap-2 text-red-400 font-semibold">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Immediate Hazard Reported</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Reporting Customer & Hazard Evidence */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base font-bold text-foreground">Reporter & Evidence</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="space-y-1 bg-muted/20 p-3 rounded border border-border/40">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{incident.customerName}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span>{incident.customerPhone}</span>
              </div>
            </div>

            {incident.evidence_photos && incident.evidence_photos.length > 0 ? (
              <div className="space-y-2">
                <span className="font-semibold text-foreground text-[11px] block">Field Photos / Evidence</span>
                <div className="grid grid-cols-2 gap-2">
                  {incident.evidence_photos.map((photo: string, idx: number) => (
                    <a
                      key={idx}
                      href={photo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block h-20 rounded border border-border overflow-hidden bg-black/40 hover:opacity-80 transition"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground italic text-[11px]">No photographic evidence uploaded.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Staffing & Response Team Control */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Response Team & Staffing Control
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage deployed cooperative workers, assign roles, review Team Lead support requests
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => setIsAddingWorker(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Add Worker
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1"
                onClick={() => setIsCreatingSupportRequest(true)}
              >
                <Building className="h-3.5 w-3.5" /> Request Support
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-5">
          {/* Staffing Progress Status */}
          <div className="bg-muted/30 p-3.5 rounded-lg border border-border/50 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Staffing Fulfilment</span>
              <span className="font-mono">
                {shortage.accepted} / {shortage.required} Workers Assigned
              </span>
            </div>
            <Progress
              value={Math.round((shortage.accepted / shortage.required) * 100)}
              className="h-2"
            />
          </div>

          {/* Members Table */}
          <div className="border border-border/50 rounded-lg overflow-hidden">
            <div className="bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground grid grid-cols-12 gap-2 border-b border-border/50">
              <span className="col-span-4 sm:col-span-3">Worker</span>
              <span className="col-span-3 sm:col-span-3">Role</span>
              <span className="col-span-3 sm:col-span-2">Status</span>
              <span className="col-span-2 sm:col-span-2 hidden sm:block">Contact</span>
              <span className="col-span-2 sm:col-span-2 text-right">Actions</span>
            </div>

            {team?.members && team.members.length > 0 ? (
              <div className="divide-y divide-border/40 bg-background text-xs">
                {team.members.map((m: any) => (
                  <div key={m.id} className="px-3 py-2.5 grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4 sm:col-span-3 flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-foreground truncate">
                        {m.worker_name || "Cooperative Worker"}
                      </span>
                      {m.is_team_lead && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] py-0 shrink-0">
                          👑 Lead
                        </Badge>
                      )}
                    </div>
                    <div className="col-span-3 sm:col-span-3 text-muted-foreground truncate">
                      {m.role}
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] py-0 ${
                          m.status === "ACTIVE" || m.status === "ASSIGNED"
                            ? "text-emerald-400 border-emerald-500/30"
                            : "text-muted-foreground"
                        }`}
                      >
                        {m.status}
                      </Badge>
                    </div>
                    <div className="col-span-2 sm:col-span-2 hidden sm:block text-muted-foreground font-mono truncate">
                      {m.worker_phone || "N/A"}
                    </div>
                    <div className="col-span-2 sm:col-span-2 text-right">
                      {m.status !== "RELEASED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 px-2"
                          onClick={() => {
                            setTargetExistingWorkerId(m.worker_id);
                            setIsReplacingWorker(true);
                          }}
                        >
                          Replace
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No workers currently confirmed on response team.
              </div>
            )}
          </div>

          {/* Additional Worker Requests Section */}
          {additionalRequests && additionalRequests.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Team Lead Additional Worker Requests
              </h4>
              <div className="space-y-2">
                {additionalRequests.map((req: any) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-lg border border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">
                          {req.requested_worker_count || req.count}x {req.requested_role || req.skill}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] py-0 ${
                            req.status === "APPROVED"
                              ? "text-emerald-400 border-emerald-500/30"
                              : req.status === "REJECTED"
                              ? "text-red-400 border-red-500/30"
                              : "text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {req.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        Reason: {req.reason}
                      </p>
                    </div>

                    {req.status === "PENDING_FEDERATION_REVIEW" && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={isSubmitting}
                          onClick={() => handleReviewRequest(req.id, "APPROVE")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10"
                          disabled={isSubmitting}
                          onClick={() => setIsRejectingRequestId(req.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Plan & Tasks Section */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Operational Tasks & Response Plan
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Standard matrix sequence and custom field tasks for this incident
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1"
              onClick={() => setIsAddingTask(true)}
            >
              <Plus className="h-3.5 w-3.5" /> Add Task
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {taskProgress && (
            <div className="bg-muted/30 p-3 rounded border border-border/50 flex items-center justify-between text-xs font-semibold">
              <span>Overall Task Completion</span>
              <span className="font-mono">
                {taskProgress.completed} / {taskProgress.total} Done ({taskProgress.percentage}%)
              </span>
            </div>
          )}

          <div className="divide-y divide-border/40 border border-border/40 rounded-lg overflow-hidden bg-background">
            {tasks && tasks.length > 0 ? (
              tasks.map((task: any) => (
                <div key={task.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center font-mono font-bold text-muted-foreground shrink-0 mt-0.5">
                      {task.task_order}
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-semibold text-foreground">{task.title}</h5>
                        <Badge
                          variant="outline"
                          className={`text-[10px] py-0 ${
                            task.status === "COMPLETED"
                              ? "text-emerald-400 border-emerald-500/30"
                              : task.status === "IN_PROGRESS"
                              ? "text-amber-400 border-amber-500/30"
                              : task.status === "CANCELLED"
                              ? "text-red-400 border-red-500/30 line-through"
                              : "text-muted-foreground"
                          }`}
                        >
                          {task.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{task.description}</p>
                      {task.completion_notes && (
                        <div className="text-[11px] text-muted-foreground bg-muted/40 p-1.5 rounded font-mono">
                          Notes: {task.completion_notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-muted-foreground text-[11px]">
                      {task.assigned_worker_name ? (
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <UserCheck className="h-3 w-3" /> {task.assigned_worker_name}
                        </span>
                      ) : (
                        "Unassigned"
                      )}
                    </span>
                    {task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-red-400 hover:bg-red-500/10 px-2"
                        onClick={() => handleCancelTask(task.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No operational tasks currently configured for this incident.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audit Trail Timeline */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-base font-bold text-foreground">
            Administrative Audit Trail
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Chronological log of all federation actions taken on this emergency incident
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3 text-xs">
            {auditLogs && auditLogs.length > 0 ? (
              auditLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg border border-border/40 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px] font-bold">
                        {log.action_type}
                      </Badge>
                      <span className="text-foreground font-semibold">{log.actor_name || "Federation Administrator"}</span>
                    </div>
                    {log.notes && <p className="text-muted-foreground">{log.notes}</p>}
                  </div>
                  <div className="text-muted-foreground font-mono text-[11px] shrink-0">
                    {new Date(log.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground italic text-center py-4">No audit events recorded yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* --- MODALS --- */}

      {/* 1. Modify Severity Modal */}
      {isChangingSeverity && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-border bg-card shadow-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Modify Incident Severity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2 text-xs">
              <div>
                <label className="font-medium text-foreground block mb-1">New Severity Level</label>
                <select
                  className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
              <div>
                <label className="font-medium text-foreground block mb-1">Operational Justification</label>
                <Input
                  placeholder="Reason for modifying emergency severity..."
                  className="h-8 text-xs"
                  value={severityReason}
                  onChange={(e) => setSeverityReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setIsChangingSeverity(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="h-8 text-xs" disabled={isSubmitting} onClick={handleSaveSeverity}>
                  {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save Severity"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. Add Worker Modal */}
      {isAddingWorker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-border bg-card shadow-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Add Worker to Response Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2 text-xs">
              <div>
                <label className="font-medium text-foreground block mb-1">Select Eligible Worker</label>
                <select
                  className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                  value={selectedWorkerId}
                  onChange={(e) => {
                    const wid = e.target.value;
                    setSelectedWorkerId(wid);
                    if (wid && !workerRole) {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const found = (eligibleWorkers || []).find((w: any) => w.id === wid);
                      if (found?.profession) {
                        setWorkerRole(found.profession);
                      }
                    }
                  }}
                >
                  <option value="">Select an available cooperative worker</option>
                  {(eligibleWorkers || []).map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.full_name} ({w.profession}) — {w.availability_status}
                    </option>
                  ))}
                </select>
                {(!eligibleWorkers || eligibleWorkers.length === 0) && (
                  <p className="text-[11px] text-amber-500 mt-1">
                    No available verified workers matching the required emergency skills currently found in this federation.
                  </p>
                )}
              </div>
              <div>
                <label className="font-medium text-foreground block mb-1">Assigned Operational Role</label>
                <Input
                  placeholder="e.g. Primary Plumber, Safety Electrician"
                  className="h-8 text-xs"
                  value={workerRole}
                  onChange={(e) => setWorkerRole(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setIsAddingWorker(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="h-8 text-xs" disabled={isSubmitting || !selectedWorkerId || !workerRole} onClick={handleAddWorker}>
                  {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Deploy Worker"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. Replace Worker Modal */}
      {isReplacingWorker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-border bg-card shadow-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Replace Team Member</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2 text-xs">
              <div>
                <label className="font-medium text-foreground block mb-1">Select Replacement Worker</label>
                <select
                  className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                  value={replacementWorkerId}
                  onChange={(e) => setReplacementWorkerId(e.target.value)}
                >
                  <option value="">Select an available replacement worker</option>
                  {eligibleWorkers.map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.full_name} ({w.profession}) — {w.availability_status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-medium text-foreground block mb-1">Replacement Reason</label>
                <Input
                  placeholder="e.g. Worker injured on site, technical escalation required"
                  className="h-8 text-xs"
                  value={replaceReason}
                  onChange={(e) => setReplaceReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setIsReplacingWorker(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white" disabled={isSubmitting || !replacementWorkerId || !replaceReason} onClick={handleReplaceWorker}>
                  {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm Replacement"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. Reject Request Reason Modal */}
      {isRejectingRequestId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-border bg-card shadow-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Reject Support Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2 text-xs">
              <div>
                <label className="font-medium text-foreground block mb-1">Mandatory Rejection Reason</label>
                <Input
                  placeholder="Reason for declining Team Lead request..."
                  className="h-8 text-xs"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setIsRejectingRequestId(null)}>
                  Cancel
                </Button>
                <Button size="sm" variant="destructive" className="h-8 text-xs" disabled={isSubmitting || !rejectionReason} onClick={() => handleReviewRequest(isRejectingRequestId, "REJECT", rejectionReason)}>
                  {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reject Request"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 5. Add Custom Task Modal */}
      {isAddingTask && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-border bg-card shadow-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Add Custom Field Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2 text-xs">
              <div>
                <label className="font-medium text-foreground block mb-1">Task Title</label>
                <Input
                  placeholder="e.g. Inspect Gas Manifold Pressure"
                  className="h-8 text-xs"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="font-medium text-foreground block mb-1">Instruction Details</label>
                <Input
                  placeholder="Detailed instructions for the response team..."
                  className="h-8 text-xs"
                  value={taskInstruction}
                  onChange={(e) => setTaskInstruction(e.target.value)}
                />
              </div>
              <div>
                <label className="font-medium text-foreground block mb-1">Required Role (Optional)</label>
                <Input
                  placeholder="e.g. Plumber, Electrician"
                  className="h-8 text-xs"
                  value={taskRole}
                  onChange={(e) => setTaskRole(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setIsAddingTask(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="h-8 text-xs" disabled={isSubmitting || !taskTitle} onClick={handleAddTask}>
                  {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add Task"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 6. Request Support Modal */}
      {isCreatingSupportRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-border bg-card shadow-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Request Emergency Support / Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2 text-xs">
              <div>
                <label className="font-medium text-foreground block mb-1">Support Type</label>
                <select
                  className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                  value={supportType}
                  onChange={(e: any) => setSupportType(e.target.value)}
                >
                  <option value="ADDITIONAL_TEAM">Additional Response Team</option>
                  <option value="EXTERNAL_FEDERATION_SUPPORT">External Federation Support</option>
                  <option value="SPECIALIZED_UNIT">Specialized Hazardous Unit</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-medium text-foreground block mb-1">Required Roles (comma-separated)</label>
                  <Input
                    placeholder="e.g. Electrician, Gas Specialist"
                    className="h-8 text-xs"
                    value={supportRoles}
                    onChange={(e) => setSupportRoles(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">Worker Count</label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    className="h-8 text-xs"
                    value={supportCount}
                    onChange={(e) => setSupportCount(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
              <div>
                <label className="font-medium text-foreground block mb-1">Justification Reason</label>
                <Input
                  placeholder="Explain why this emergency requires additional team or external support..."
                  className="h-8 text-xs"
                  value={supportReason}
                  onChange={(e) => setSupportReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setIsCreatingSupportRequest(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="h-8 text-xs" disabled={isSubmitting || !supportReason} onClick={handleCreateSupportRequest}>
                  {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Log Support Request"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Closure Review Modal */}
      {isClosingIncident && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-border bg-card shadow-2xl">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-bold text-foreground">
                {closureAction === "APPROVE" ? "Approve Incident Closure" : "Request Further Field Work"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <p className="text-muted-foreground">
                {closureAction === "APPROVE"
                  ? "Confirm that emergency containment is verified. The incident status will be set to CLOSED and recorded in the audit registry."
                  : "Return the emergency incident to ACTIVE status so responders can address remaining items."}
              </p>
              <div>
                <label className="font-medium text-foreground block mb-1">Administrative Notes</label>
                <textarea
                  rows={3}
                  className="w-full p-2.5 rounded border border-border text-xs bg-background text-foreground"
                  placeholder={
                    closureAction === "APPROVE"
                      ? "e.g. Verified structural safety and auxiliary water pump isolation."
                      : "Specify what additional work or testing is required before closure."
                  }
                  value={closureNotes}
                  onChange={(e) => setClosureNotes(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setIsClosingIncident(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className={`h-8 text-xs font-bold text-white ${closureAction === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"}`}
                  disabled={isSubmitting}
                  onClick={() => handleReviewClosure(closureAction)}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : closureAction === "APPROVE" ? (
                    "Confirm & Close Incident"
                  ) : (
                    "Reopen Incident"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
