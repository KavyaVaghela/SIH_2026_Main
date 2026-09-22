"use client";

import * as React from "react";
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  Play,
  UserCheck,
  Users,
  AlertTriangle,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";

export interface EmergencyTaskItem {
  id: string;
  incident_id: string;
  task_order: number;
  title: string;
  instruction: string;
  required_role: string | null;
  assigned_worker_id: string | null;
  status: "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  started_at: string | null;
  completed_at: string | null;
  completion_notes: string | null;
  assigned_worker_name?: string;
}

export interface AdditionalWorkerRequestItem {
  id: string;
  skill: string;
  count: number;
  reason: string;
  status: "PENDING_FEDERATION_REVIEW" | "APPROVED" | "REJECTED" | "CANCELLED";
  created_at: string;
}

export interface EmergencyTeamInfo {
  id: string;
  incident_id: string;
  team_lead_worker_id: string | null;
  status: string;
  required_worker_count: number;
  accepted_worker_count: number;
  members: {
    id: string;
    worker_id: string;
    role: string;
    is_team_lead: boolean;
    status: string;
    worker_name?: string;
    profession?: string;
  }[];
}

export interface EmergencyTasksCardProps {
  workerId?: string;
  onRefresh?: () => void;
}

export function EmergencyTasksCard({ workerId, onRefresh }: EmergencyTasksCardProps) {
  const [team, setTeam] = React.useState<EmergencyTeamInfo | null>(null);
  const [incidentInfo, setIncidentInfo] = React.useState<{
    emergencyId: string;
    type: string;
    category: string;
    severity: string;
    location: string;
    status: string;
  } | null>(null);
  const [tasks, setTasks] = React.useState<EmergencyTaskItem[]>([]);
  const [progress, setProgress] = React.useState<{
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    completionPercentage: number;
  } | null>(null);
  const [additionalRequests, setAdditionalRequests] = React.useState<AdditionalWorkerRequestItem[]>([]);
  
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [actingTaskId, setActingTaskId] = React.useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = React.useState<Record<string, string>>({});
  const [selectedAssignee, setSelectedAssignee] = React.useState<Record<string, string>>({});
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Additional worker request form state
  const [showRequestForm, setShowRequestForm] = React.useState<boolean>(false);
  const [reqSkill, setReqSkill] = React.useState<string>("");
  const [reqCount, setReqCount] = React.useState<number>(1);
  const [reqReason, setReqReason] = React.useState<string>("");
  const [isSubmittingReq, setIsSubmittingReq] = React.useState<boolean>(false);

  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const fetchActiveTeamAndTasks = React.useCallback(async (showLoading = true) => {
    if (!workerId) return;
    try {
      if (showLoading && !team) setIsLoading(true);
      // 1. Fetch active team for this worker
      const teamRes = await fetch(`/api/emergency/teams?workerId=${workerId}`);
      if (!teamRes.ok) return;
      const teamData = await teamRes.json();

      if (!teamData.success || !teamData.team || teamData.team.status === "DISBANDED") {
        setTeam(null);
        setTasks([]);
        setProgress(null);
        setIncidentInfo(null);
        return;
      }

      const activeTeam = teamData.team;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const member = (activeTeam.members || []).find((m: any) => m.worker_id === workerId);
      if (!member || member.status === "RELEASED" || member.status === "NO_SHOW") {
        setTeam(null);
        setTasks([]);
        setProgress(null);
        setIncidentInfo(null);
        return;
      }

      // 2. Fetch Incident Details, Tasks, and Additional Worker Requests in parallel
      const [incRes, tasksRes, reqRes] = await Promise.all([
        fetch(`/api/emergency/incidents/${activeTeam.incident_id}`),
        fetch(`/api/emergency/tasks?incidentId=${activeTeam.incident_id}`),
        fetch(`/api/emergency/requests/additional-workers?incidentId=${activeTeam.incident_id}`),
      ]);

      if (incRes.ok) {
        const incData = await incRes.json();
        if (incData.success && incData.incident) {
          if (["CLOSED", "RESOLVED", "CANCELLED"].includes(incData.incident.status)) {
            setTeam(null);
            setTasks([]);
            setProgress(null);
            setIncidentInfo(null);
            return;
          }
          setIncidentInfo({
            emergencyId: incData.incident.emergencyId,
            type: incData.incident.emergencyType,
            category: incData.incident.categoryName,
            severity: incData.incident.severity,
            location: incData.incident.location,
            status: incData.incident.status,
          });
        }
      }

      setTeam(activeTeam);

      if (tasksRes.ok) {
        const taskData = await tasksRes.json();
        if (taskData.success) {
          setTasks(taskData.tasks || []);
          setProgress(taskData.progress || null);
        }
      }

      if (reqRes.ok) {
        const reqData = await reqRes.json();
        if (reqData.success) {
          setAdditionalRequests(reqData.requests || []);
        }
      }
    } catch (err) {
      console.warn("EmergencyTasksCard live sync note:", err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [workerId]);

  React.useEffect(() => {
    fetchActiveTeamAndTasks(true);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [fetchActiveTeamAndTasks]);

  const handleRealtimeUpdate = React.useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchActiveTeamAndTasks(false);
    }, 150);
  }, [fetchActiveTeamAndTasks]);

  useRealtimeSubscription({
    table: "emergency_incident_tasks",
    enabled: !!workerId,
    onPayload: handleRealtimeUpdate,
  });

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

  // Determine if current worker is Team Lead
  const isTeamLead = team?.team_lead_worker_id === workerId;

  // Handle task actions: START, COMPLETE, ASSIGN
  const handleTaskAction = async (
    taskId: string,
    action: "START" | "COMPLETE" | "ASSIGN",
    payload?: { assignedWorkerId?: string; completionNotes?: string }
  ) => {
    try {
      setActingTaskId(taskId);
      setFeedback(null);

      const body: Record<string, unknown> = { action };
      if (action === "ASSIGN") {
        body.assignedWorkerId = payload?.assignedWorkerId;
      } else if (action === "COMPLETE") {
        body.completionNotes = payload?.completionNotes || "";
      }

      const res = await fetch(`/api/emergency/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          text: `Task successfully ${action.toLowerCase()}ed.`,
        });
        await fetchActiveTeamAndTasks();
        if (onRefresh) onRefresh();
      } else {
        setFeedback({
          type: "error",
          text: data.error || `Failed to ${action.toLowerCase()} task.`,
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: (err as Error)?.message || "Action failed.",
      });
    } finally {
      setActingTaskId(null);
    }
  };

  // Handle submitting additional worker request
  const handleSubmitAdditionalWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !reqSkill || !reqReason) return;

    try {
      setIsSubmittingReq(true);
      setFeedback(null);

      const res = await fetch("/api/emergency/requests/additional-workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentId: team.incident_id,
          skill: reqSkill,
          count: Number(reqCount) || 1,
          reason: reqReason,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          text: "Support request logged (Status: PENDING_FEDERATION_REVIEW). Federation Control Center notified.",
        });
        setReqSkill("");
        setReqReason("");
        setReqCount(1);
        setShowRequestForm(false);
        await fetchActiveTeamAndTasks();
      } else {
        setFeedback({
          type: "error",
          text: data.error || "Failed to submit request.",
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: (err as Error)?.message || "Failed to submit request.",
      });
    } finally {
      setIsSubmittingReq(false);
    }
  };

  // If no active team assignment or incident is terminal, don't show card
  if (
    (!isLoading && (!team || tasks.length === 0)) ||
    team?.status === "DISBANDED" ||
    (incidentInfo && ["CLOSED", "RESOLVED", "CANCELLED"].includes(incidentInfo.status))
  ) {
    return null;
  }

  return (
    <Card className="border-red-500/40 bg-gradient-to-br from-red-950/20 via-background to-background shadow-lg">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                  Active Emergency Response Operations
                </CardTitle>
                <Badge variant="destructive" className="font-mono text-xs uppercase animate-pulse">
                  Live Response
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Incident Ref: <span className="font-mono font-semibold text-foreground">{incidentInfo?.emergencyId || team?.incident_id}</span> • {incidentInfo?.type || "Emergency Task Force"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isTeamLead ? (
              <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/40 font-medium px-2.5 py-1">
                👑 Team Lead
              </Badge>
            ) : (
              <Badge variant="secondary" className="font-medium px-2.5 py-1">
                👷 Response Team Member
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-5">
        {/* Progress & Operational Status */}
        {progress && (
          <div className="bg-muted/40 p-3.5 rounded-lg border border-border/50 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground">Incident Task Progress</span>
              <span className="font-mono text-foreground font-semibold">
                {progress.completedTasks} / {progress.totalTasks} Done ({progress.completionPercentage}%)
              </span>
            </div>
            <Progress value={progress.completionPercentage} className="h-2" />
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
              <span>Pending: <strong className="text-foreground">{progress.pendingTasks}</strong></span>
              <span>In Progress: <strong className="text-amber-500">{progress.inProgressTasks}</strong></span>
              <span>Completed: <strong className="text-emerald-500">{progress.completedTasks}</strong></span>
            </div>
          </div>
        )}

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-md text-xs font-medium border flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Task List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Response Tasks Checklist
            </h4>
            <span className="text-xs text-muted-foreground font-mono">
              Team Staffing: {team?.accepted_worker_count || 0}/{team?.required_worker_count || 0}
            </span>
          </div>

          <div className="divide-y divide-border/40 border border-border/40 rounded-lg overflow-hidden bg-background">
            {tasks.map((task) => {
              const isAssignedToMe = task.assigned_worker_id === workerId;
              const isActing = actingTaskId === task.id;

              return (
                <div key={task.id} className="p-3.5 space-y-2 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs font-mono font-bold text-muted-foreground shrink-0 mt-0.5">
                        {task.task_order}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-sm font-semibold text-foreground leading-tight">
                            {task.title}
                          </h5>
                          {task.status === "COMPLETED" && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] py-0">
                              Completed
                            </Badge>
                          )}
                          {task.status === "IN_PROGRESS" && (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] py-0">
                              In Progress
                            </Badge>
                          )}
                          {task.status === "ASSIGNED" && (
                            <Badge variant="outline" className="text-[10px] py-0">
                              Assigned
                            </Badge>
                          )}
                          {task.status === "PENDING" && (
                            <Badge variant="secondary" className="text-[10px] py-0">
                              Unassigned
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {task.instruction}
                        </p>
                      </div>
                    </div>

                    {/* Assigned Worker Tag */}
                    <div className="text-right shrink-0">
                      {isAssignedToMe ? (
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-[11px]">
                          Assigned to You
                        </Badge>
                      ) : task.assigned_worker_name ? (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5" />
                          {task.assigned_worker_name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/60 italic">Unassigned</span>
                      )}
                    </div>
                  </div>

                  {/* Task Completion Note (if any) */}
                  {task.completion_notes && (
                    <div className="text-xs text-muted-foreground bg-muted/40 p-2 rounded border border-border/40 font-mono">
                      Notes: {task.completion_notes}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="pt-1.5 flex items-center justify-between gap-2 flex-wrap border-t border-border/20">
                    {/* Team Lead Assignment Controls */}
                    {isTeamLead && task.status !== "COMPLETED" && (
                      <div className="flex items-center gap-2 text-xs">
                        <select
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                          value={selectedAssignee[task.id] || task.assigned_worker_id || ""}
                          onChange={(e) =>
                            setSelectedAssignee((prev) => ({ ...prev, [task.id]: e.target.value }))
                          }
                          aria-label={`Assign member for ${task.title}`}
                        >
                          <option value="">Select Team Member</option>
                          {team?.members.map((m) => (
                            <option key={m.worker_id} value={m.worker_id}>
                              {m.worker_name || "Worker"} ({m.role}) {m.is_team_lead ? "👑" : ""}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          disabled={!selectedAssignee[task.id] || isActing}
                          onClick={() =>
                            handleTaskAction(task.id, "ASSIGN", {
                              assignedWorkerId: selectedAssignee[task.id],
                            })
                          }
                        >
                          {task.assigned_worker_id ? "Reassign" : "Assign"}
                        </Button>
                      </div>
                    )}

                    {/* Worker Execution Controls */}
                    {(isAssignedToMe || isTeamLead) && task.status === "ASSIGNED" && (
                      <Button
                        size="sm"
                        className="h-8 text-xs gap-1 ml-auto"
                        disabled={isActing}
                        onClick={() => handleTaskAction(task.id, "START")}
                      >
                        {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                        Start Task
                      </Button>
                    )}

                    {(isAssignedToMe || isTeamLead) && task.status === "IN_PROGRESS" && (
                      <div className="flex items-center gap-2 ml-auto">
                        <Input
                          placeholder="Optional completion notes..."
                          className="h-8 text-xs w-48"
                          value={completionNotes[task.id] || ""}
                          onChange={(e) =>
                            setCompletionNotes((prev) => ({ ...prev, [task.id]: e.target.value }))
                          }
                        />
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={isActing}
                          onClick={() =>
                            handleTaskAction(task.id, "COMPLETE", {
                              completionNotes: completionNotes[task.id] || "",
                            })
                          }
                        >
                          {isActing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          Complete
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Lead: Request Additional Worker Support Section */}
        {isTeamLead && (
          <div className="border border-border/50 rounded-lg p-3.5 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-500" />
                <h5 className="text-xs font-semibold text-foreground">
                  Additional Worker Support Requests
                </h5>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setShowRequestForm(!showRequestForm)}
              >
                {showRequestForm ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {showRequestForm ? "Cancel" : "Request More Workers"}
              </Button>
            </div>

            {showRequestForm && (
              <form onSubmit={handleSubmitAdditionalWorker} className="space-y-2.5 pt-2 border-t border-border/30">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                      Required Skill
                    </label>
                    <Input
                      placeholder="e.g. Electrician, Gas Specialist"
                      className="h-8 text-xs"
                      value={reqSkill}
                      onChange={(e) => setReqSkill(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                      Worker Count
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      className="h-8 text-xs"
                      value={reqCount}
                      onChange={(e) => setReqCount(parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Operational Justification
                  </label>
                  <Input
                    placeholder="Reason additional hands or specialized skills are required..."
                    className="h-8 text-xs"
                    value={reqReason}
                    onChange={(e) => setReqReason(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-muted-foreground italic">
                    Requires Federation Review prior to any dispatching.
                  </p>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 text-xs gap-1"
                    disabled={isSubmittingReq || !reqSkill || !reqReason}
                  >
                    {isSubmittingReq ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                    Submit for Federation Review
                  </Button>
                </div>
              </form>
            )}

            {/* List of Previous Requests */}
            {additionalRequests.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {additionalRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between text-xs p-2 rounded bg-background/60 border border-border/30"
                  >
                    <div>
                      <span className="font-semibold text-foreground">{req.count}x {req.skill}</span>
                      <span className="text-muted-foreground ml-2 text-[11px]">({req.reason})</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30">
                      {req.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
