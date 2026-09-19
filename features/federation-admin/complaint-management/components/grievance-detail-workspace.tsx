"use client";

import * as React from "react";
import {
  ShieldAlert,
  AlertCircle,
  Clock,
  User,
  Building,
  CheckCircle2,
  Send,
  Lock,
  ArrowUpRight,
  FileText,
  Calendar,
  AlertTriangle,
  Receipt,
  MessageSquare,
  History,
  X,
  ExternalLink,
  HardHat,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type {
  GrievanceCase,
  GrievanceLifecycleStatus,
  GrievancePriority,
  GrievancePartyRole,
  GrievanceResolution,
} from "@/types/complaints/v2";

interface GrievanceDetailWorkspaceProps {
  grievance: GrievanceCase | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  currentUserId?: string;
  currentUserName?: string;
}

export function GrievanceDetailWorkspace({
  grievance,
  isOpen,
  onClose,
  onRefresh,
  currentUserId = "fed-admin-1",
  currentUserName = "Federation Grievance Officer",
}: GrievanceDetailWorkspaceProps) {
  const [activeTab, setActiveTab] = React.useState<"overview" | "timeline" | "audit">("overview");

  // Dialog states for case actions
  const [isNoteOpen, setIsNoteOpen] = React.useState(false);
  const [noteText, setNoteText] = React.useState("");
  const [noteType, setNoteType] = React.useState<"INTERNAL_NOTE" | "PUBLIC_UPDATE">("INTERNAL_NOTE");

  const [isRequestResponseOpen, setIsRequestResponseOpen] = React.useState(false);
  const [requestTarget, setRequestTarget] = React.useState<GrievancePartyRole>("WORKER");
  const [requestMessage, setRequestMessage] = React.useState("");

  const [isPriorityOpen, setIsPriorityOpen] = React.useState(false);
  const [selectedPriority, setSelectedPriority] = React.useState<GrievancePriority>("MEDIUM");
  const [priorityReason, setPriorityReason] = React.useState("");

  const [isStatusOpen, setIsStatusOpen] = React.useState(false);
  const [targetStatus, setTargetStatus] = React.useState<GrievanceLifecycleStatus>("UNDER_REVIEW");
  const [statusReason, setStatusReason] = React.useState("");

  const [isResolveOpen, setIsResolveOpen] = React.useState(false);
  const [resolutionType, setResolutionType] = React.useState<GrievanceResolution["resolutionType"]>("CONCILIATION");
  const [resolutionSummary, setResolutionSummary] = React.useState("");
  const [actionTaken, setActionTaken] = React.useState("");
  const [compensationRef, setCompensationRef] = React.useState("");
  const [followUp, setFollowUp] = React.useState(false);

  const [isRejectOpen, setIsRejectOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");

  const [isCloseOpen, setIsCloseOpen] = React.useState(false);
  const [closeNotes, setCloseNotes] = React.useState("");

  const [isEscalateOpen, setIsEscalateOpen] = React.useState(false);
  const [escalationReason, setEscalateReason] = React.useState("");

  const [previewImageUrl, setPreviewImageUrl] = React.useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  if (!isOpen || !grievance) return null;

  const isCustomerVsWorker =
    grievance.raisedByRole === "CUSTOMER" &&
    (grievance.targetRole === "WORKER" || !!grievance.targetProfileId || !!grievance.targetWorkerId);

  const isFederationOriginated = grievance.raisedByRole === "FEDERATION_ADMIN";
  const isEscalated = grievance.status === "ESCALATED";
  const isWorkerResponseSubmitted = !!grievance.responseRequests?.workerSubmitted;
  const isWorkerGateBlocking = isCustomerVsWorker && !isWorkerResponseSubmitted;
  const isTerminal = grievance.status === "REJECTED" || grievance.status === "CLOSED";

  const workerResponseTimelineEvent = grievance.timeline?.find(
    (item) => item.type === "RESPONSE_SUBMISSION" && (item.actorRole === "WORKER" || item.actorId === grievance.targetProfileId)
  );

  const workerStatement = workerResponseTimelineEvent?.message;
  const workerEvidence = workerResponseTimelineEvent?.evidenceUrls || [];
  const workerSubmittedAt =
    grievance.responseRequests?.workerSubmittedAt || workerResponseTimelineEvent?.timestamp;

  const handlePostNote = async () => {
    if (!noteText.trim()) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/complaints/${grievance.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: noteType,
          message: noteText.trim(),
          actorId: currentUserId,
          actorRole: "FEDERATION_ADMIN",
          actorName: currentUserName,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to post note");
      setNoteText("");
      setIsNoteOpen(false);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestResponse = async () => {
    if (!requestMessage.trim()) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/complaints/${grievance.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "RESPONSE_REQUEST",
          targetParty: requestTarget,
          message: requestMessage.trim(),
          actorId: currentUserId,
          actorRole: "FEDERATION_ADMIN",
          actorName: currentUserName,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to request response");
      setRequestMessage("");
      setIsRequestResponseOpen(false);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustPriority = async () => {
    if (!priorityReason.trim()) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/complaints/${grievance.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjust_priority",
          priority: selectedPriority,
          reason: priorityReason.trim(),
          actorId: currentUserId,
          actorRole: "FEDERATION_ADMIN",
          actorName: currentUserName,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to adjust priority");
      setPriorityReason("");
      setIsPriorityOpen(false);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async () => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/complaints/${grievance.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          newStatus: targetStatus,
          reason: statusReason.trim() || undefined,
          actorId: currentUserId,
          actorRole: "FEDERATION_ADMIN",
          actorName: currentUserName,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to update status");
      setStatusReason("");
      setIsStatusOpen(false);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (!resolutionSummary.trim() || !actionTaken.trim()) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/complaints/${grievance.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resolve",
          resolution: {
            resolutionType,
            summary: resolutionSummary.trim(),
            actionTaken: actionTaken.trim(),
            compensationReference: compensationRef.trim() || undefined,
            followUpRequired: followUp,
            resolvedBy: currentUserId,
            resolvedByName: currentUserName,
            resolvedAt: new Date().toISOString(),
          },
          actorId: currentUserId,
          actorRole: "FEDERATION_ADMIN",
          actorName: currentUserName,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to resolve complaint");
      setIsResolveOpen(false);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/complaints/${grievance.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          reason: rejectReason.trim(),
          actorId: currentUserId,
          actorRole: "FEDERATION_ADMIN",
          actorName: currentUserName,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to reject complaint");
      setRejectReason("");
      setIsRejectOpen(false);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseCase = async () => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/complaints/${grievance.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "close",
          notes: closeNotes.trim(),
          actorId: currentUserId,
          actorRole: "FEDERATION_ADMIN",
          actorName: currentUserName,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to close complaint");
      setCloseNotes("");
      setIsCloseOpen(false);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEscalate = async () => {
    if (!escalationReason.trim()) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/complaints/${grievance.id}/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: escalationReason.trim(),
          actorId: currentUserId,
          actorRole: "FEDERATION_ADMIN",
          actorName: currentUserName,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to escalate case");
      setEscalateReason("");
      setIsEscalateOpen(false);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadgeClass = (p: GrievancePriority) => {
    switch (p) {
      case "CRITICAL":
        return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300";
      case "MEDIUM":
        return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const getStatusBadgeClass = (s: GrievanceLifecycleStatus) => {
    switch (s) {
      case "OPEN":
        return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300";
      case "UNDER_REVIEW":
        return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300";
      case "ACTION_REQUIRED":
        return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300";
      case "RESOLVED":
        return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300";
      case "REJECTED":
        return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300";
      case "ESCALATED":
        return "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 animate-pulse";
      case "CLOSED":
        return "bg-slate-200 text-slate-800 border-slate-400 dark:bg-slate-800 dark:text-slate-400";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 border-0 shadow-2xl rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        {/* Section 1: Complaint Info & Header Banner */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                  {grievance.complaintNumber}
                </span>
                <Badge variant="outline" className={`font-bold text-xs ${getStatusBadgeClass(grievance.status)}`}>
                  {grievance.status.replace(/_/g, " ")}
                </Badge>
                <Badge variant="outline" className={`font-bold text-xs ${getPriorityBadgeClass(grievance.priority)}`}>
                  {grievance.priority} PRIORITY
                </Badge>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {grievance.subject}
              </h2>
              <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                <span>Category: <strong>{grievance.category}</strong></span>
                {grievance.subcategory && <span>• Subcategory: {grievance.subcategory}</span>}
                <span>
                  • Filed:{" "}
                  {new Date(grievance.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </p>
            </div>

            {/* Quick Action Toolbar (hidden if terminal or escalated) */}
            {isEscalated ? (
              <div className="flex items-center gap-2">
                <Badge className="bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 font-mono text-xs px-3 py-1.5 flex items-center gap-1.5 border border-red-300 dark:border-red-800 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  ESCALATED TO SUPER ADMIN (UNDER CENTRAL REVIEW)
                </Badge>
              </div>
            ) : !isTerminal ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedPriority(grievance.priority);
                    setIsPriorityOpen(true);
                  }}
                  className="text-xs font-semibold"
                >
                  Adjust Priority
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTargetStatus(grievance.status === "OPEN" ? "UNDER_REVIEW" : "ACTION_REQUIRED");
                    setIsStatusOpen(true);
                  }}
                  className="text-xs font-semibold"
                >
                  Change Status
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsResolveOpen(true)}
                  disabled={isWorkerGateBlocking}
                  title={isWorkerGateBlocking ? "Worker response required before resolution" : "Resolve Dispute"}
                  className={`text-xs font-bold gap-1.5 shadow-sm ${
                    isWorkerGateBlocking
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                      : "bg-emerald-700 hover:bg-emerald-800 text-white"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Resolve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEscalateOpen(true)}
                  className="border-rose-300 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 text-xs font-bold gap-1"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Escalate
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs px-3 py-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  TERMINATED ({grievance.status})
                </Badge>
              </div>
            )}
          </div>

          {/* Smart Triage Recommendation Banner */}
          <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-start gap-3 text-xs">
            <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-900 dark:text-blue-200">System Smart Triage:</span>
                <span className="font-bold text-blue-700 dark:text-blue-300">Suggested Priority: {grievance.suggestedPriority}</span>
                {grievance.suggestedQueue && (
                  <span className="text-blue-600 dark:text-blue-400 font-medium">({grievance.suggestedQueue})</span>
                )}
              </div>
              <p className="text-blue-800 dark:text-blue-300">{grievance.triageReason || "Standard dispute pattern evaluation."}</p>
            </div>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex gap-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Review Workspace (7-Point Layout)
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "timeline"
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Timeline & Communications ({grievance.timeline?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "audit"
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Immutable Audit Trail ({grievance.auditTrail?.length || 0})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 space-y-6">
          {actionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{actionError}</span>
            </div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Escalated to Super Admin Notice Banner */}
              {isEscalated && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 flex items-start gap-3 text-xs text-red-900 dark:text-red-200 shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-red-900 dark:text-red-100">
                      Case Escalated to Super Admin — Central Investigation Active
                    </h4>
                    <p className="leading-relaxed">
                      This complaint has been formally escalated to Super Admin and cannot be modified by Federation Admin. Resolution, rejection, status transitions, and priority adjustments can only be performed by the central platform administrator. Full audit history is preserved.
                    </p>
                  </div>
                </div>
              )}

              {/* Section 2 & 3: Parties Grid (Customer Complainant & Worker Subject) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Section 2: Complainant */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      2. Complainant
                    </span>
                    <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border-emerald-300">
                      Role: {grievance.raisedByRole === "FEDERATION_ADMIN" ? "Federation Admin" : grievance.raisedByRole}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      {grievance.raisedByName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{grievance.raisedByName}</h4>
                      {grievance.raisedByPhone && (
                        <p className="text-xs text-slate-500 font-mono">{grievance.raisedByPhone}</p>
                      )}
                      {isFederationOriginated && (
                        <p className="text-[11px] text-slate-500 font-medium">
                          Federation: {grievance.federationName || "Current Cooperative Federation"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 3: Subject / Target */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      3. {isFederationOriginated ? "Recipient (Platform Authority)" : "Subject of Complaint (Worker)"}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-semibold bg-blue-50 text-blue-800 border-blue-300">
                      Role: {isFederationOriginated ? "SUPER_ADMIN" : (grievance.targetRole || "WORKER")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                      {(isFederationOriginated ? "S" : (grievance.targetName || "W")).charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {isFederationOriginated
                          ? "Super Admin / Central Platform Authority"
                          : (grievance.targetName || "Assigned Worker")}
                      </h4>
                      {!isFederationOriginated ? (
                        <>
                          <p className="text-xs text-slate-500 font-mono">
                            ID: {grievance.targetWorkerId || grievance.targetProfileId || "N/A"}
                            {grievance.category && ` • Trade: ${grievance.category}`}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium">
                            Federation: {grievance.federationName || "State Cooperative Federation"}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-slate-500 font-medium">
                          Platform Administration & Compliance Directorate
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grievance Statement */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Complainant Grievance Statement
                </span>
                <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {grievance.description}
                </p>
              </div>

              {/* Section 4: Service / Booking Details */}
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/40 pb-2">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5" />
                    4. Service / Booking Details
                  </span>
                  <Badge variant="outline" className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border-emerald-300 text-[10px] font-bold">
                    Status: {grievance.bookingContext?.bookingStatus || "LINKED"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Booking ID / Ref</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {grievance.bookingContext?.bookingNumber || grievance.bookingId || "None"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Service Name</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {grievance.bookingContext?.serviceTitle || grievance.category || "Trade Service"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Scheduled Date</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {grievance.bookingContext?.scheduledStartAt
                        ? new Date(grievance.bookingContext.scheduledStartAt).toLocaleDateString("en-IN")
                        : "As scheduled"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Total / Bill</span>
                    <span className="font-mono font-extrabold text-emerald-800 dark:text-emerald-300">
                      ₹{grievance.bookingContext?.finalBill ?? grievance.bookingContext?.systemEstimate ?? "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 5: Evidence */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    5. Evidence Submitted by Complainant ({grievance.evidenceUrls?.length || 0} files)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Uploaded: {new Date(grievance.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>

                {grievance.evidenceUrls && grievance.evidenceUrls.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {grievance.evidenceUrls.map((url, index) => (
                      <div
                        key={index}
                        onClick={() => setPreviewImageUrl(url)}
                        className="group relative cursor-pointer overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1 w-24 h-24 hover:border-emerald-500 transition-all shadow-xs"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Evidence #${index + 1}`}
                          className="w-full h-full object-cover rounded group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                          Click to View
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No evidence files attached by complainant.</p>
                )}
              </div>

              {/* Section 6: Worker Response Section */}
              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  isWorkerResponseSubmitted
                    ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20"
                    : isCustomerVsWorker
                    ? "border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider block text-slate-700 dark:text-slate-300">
                    6. Worker Official Statement & Counter-Evidence
                  </span>
                  {isWorkerResponseSubmitted ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-bold gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Response Received
                    </Badge>
                  ) : isCustomerVsWorker ? (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs font-bold gap-1">
                      <Clock className="w-3 h-3" />
                      Awaiting Worker Response
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Not Applicable
                    </Badge>
                  )}
                </div>

                {isWorkerResponseSubmitted ? (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 font-mono">
                      Submitted on:{" "}
                      {workerSubmittedAt
                        ? new Date(workerSubmittedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Recorded"}
                      {" • by "}
                      {grievance.targetName} ({grievance.targetWorkerId || grievance.targetProfileId || "Worker"})
                    </p>
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                      {workerStatement || "Worker submitted response statement."}
                    </div>

                    {workerEvidence && workerEvidence.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Worker Supporting Evidence:</span>
                        <div className="flex flex-wrap gap-2.5">
                          {workerEvidence.map((url, i) => (
                            <div
                              key={i}
                              onClick={() => setPreviewImageUrl(url)}
                              className="group relative cursor-pointer overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1 w-20 h-20 hover:border-emerald-500 transition-all"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt={`Worker Evidence #${i + 1}`}
                                className="w-full h-full object-cover rounded group-hover:scale-105 transition-transform"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : isCustomerVsWorker ? (
                  <div className="space-y-2">
                    <p className="text-xs text-amber-900 dark:text-amber-200">
                      Worker has not yet submitted an official statement.
                    </p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                      Worker must submit a response before this complaint can be resolved or closed.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRequestTarget("WORKER");
                        setIsRequestResponseOpen(true);
                      }}
                      className="text-xs font-semibold border-amber-400 text-amber-900 hover:bg-amber-100 gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Request Worker Response
                    </Button>
                  </div>
                ) : isFederationOriginated ? (
                  <p className="text-xs text-muted-foreground italic">
                    Not applicable. This complaint was submitted by Federation Admin directly to Super Admin.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    This complaint is not against a worker. Worker response gate does not apply.
                  </p>
                )}
              </div>

              {/* Section 7: Federation Decision */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    7. Federation Decision & Conciliation
                  </span>
                  {isEscalated ? (
                    <Badge variant="outline" className="text-xs font-bold border-red-300 text-red-800 dark:text-red-300 bg-red-50">
                      Escalated to Super Admin
                    </Badge>
                  ) : isFederationOriginated ? (
                    <Badge variant="outline" className="text-xs font-bold border-indigo-300 text-indigo-800 dark:text-indigo-300 bg-indigo-50">
                      Awaiting Central Action
                    </Badge>
                  ) : isTerminal ? (
                    <Badge variant="outline" className="text-xs font-bold border-rose-400 text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40">
                      Case Terminated
                    </Badge>
                  ) : isWorkerGateBlocking ? (
                    <Badge variant="outline" className="text-xs font-bold border-amber-300 text-amber-800 dark:text-amber-300 bg-amber-50">
                      Final Decision Gated
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs font-bold border-emerald-300 text-emerald-800 dark:text-emerald-300 bg-emerald-50">
                      Ready for Final Decision
                    </Badge>
                  )}
                </div>

                {isEscalated ? (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <h4 className="font-bold text-sm text-red-900 dark:text-red-100">
                        Dispute Escalated to Super Admin
                      </h4>
                    </div>
                    <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
                      This complaint has been escalated to Super Admin and cannot be modified by Federation Admin. Resolution, rejection, or closure can only be performed by the central Super Admin authority.
                    </p>
                  </div>
                ) : isFederationOriginated ? (
                  <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-100">
                        Under Super Admin Determination
                      </h4>
                    </div>
                    <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
                      This complaint was raised by your federation directly to Super Admin. Final conciliation, policy remedies, and closure will be recorded centrally by Super Admin.
                    </p>
                  </div>
                ) : isTerminal ? (
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 space-y-2">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                        Complaint Terminated — {grievance.status} on{" "}
                        {grievance.status === "REJECTED"
                          ? (grievance.rejectedAt ? new Date(grievance.rejectedAt).toLocaleDateString("en-IN") : "Recorded Date")
                          : (grievance.closedAt ? new Date(grievance.closedAt).toLocaleDateString("en-IN") : "Recorded Date")}
                        {" by "}
                        {grievance.status === "REJECTED" ? (grievance.rejectedBy || "Federation Admin") : (grievance.closedBy || "Federation Admin")}
                      </h4>
                    </div>
                    {grievance.status === "REJECTED" && grievance.rejectionReason && (
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        <strong>Rejection Reason:</strong> {grievance.rejectionReason}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-500 italic">
                      This complaint has reached a terminal state. No further edits, notes, status changes, or re-openings are permitted. Full case file remains preserved for audit.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {isWorkerGateBlocking && (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 font-medium">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Worker response required before final decision (Resolve, Reject, Close) can be taken.</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2.5">
                      <Button
                        size="sm"
                        onClick={() => setIsResolveOpen(true)}
                        disabled={isWorkerGateBlocking}
                        title={isWorkerGateBlocking ? "Worker response required before final decision" : "Resolve Complaint"}
                        className={`text-xs font-bold gap-1.5 shadow-sm ${
                          isWorkerGateBlocking
                            ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300"
                            : "bg-emerald-700 hover:bg-emerald-800 text-white"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Resolve Complaint
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsRejectOpen(true)}
                        disabled={isWorkerGateBlocking}
                        title={isWorkerGateBlocking ? "Worker response required before final decision" : "Reject Complaint"}
                        className={`text-xs font-bold gap-1.5 ${
                          isWorkerGateBlocking
                            ? "text-slate-400 border-slate-200 cursor-not-allowed"
                            : "border-rose-300 text-rose-700 dark:text-rose-400 hover:bg-rose-50"
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject Complaint
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsCloseOpen(true)}
                        disabled={isWorkerGateBlocking}
                        title={isWorkerGateBlocking ? "Worker response required before final decision" : "Close Complaint"}
                        className={`text-xs font-bold gap-1.5 ${
                          isWorkerGateBlocking
                            ? "text-slate-400 border-slate-200 cursor-not-allowed"
                            : "border-slate-400 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Close Complaint (Administrative)
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-6">
              {/* Timeline Action Bar (hidden if terminal or escalated) */}
              {!isTerminal && !isEscalated && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Communications & Updates ({grievance.timeline?.length || 0} items)
                  </span>
                  <div className="flex items-center gap-2">
                    {!isFederationOriginated && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setNoteType("INTERNAL_NOTE");
                          setIsNoteOpen(true);
                        }}
                        className="text-xs gap-1.5 border-amber-300 text-amber-800 dark:text-amber-300 hover:bg-amber-50"
                      >
                        <Lock className="w-3 h-3 text-amber-600" />
                        Add Internal Note
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNoteType("PUBLIC_UPDATE");
                        setIsNoteOpen(true);
                      }}
                      className="text-xs gap-1.5"
                    >
                      <Send className="w-3 h-3 text-emerald-600" />
                      {isFederationOriginated ? "Add Information Update" : "Add Public Update"}
                    </Button>
                    {!isFederationOriginated && (
                      <Button
                        size="sm"
                        onClick={() => setIsRequestResponseOpen(true)}
                        className="text-xs gap-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Request Party Response
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Chronological Timeline List */}
              <div className="space-y-4">
                {grievance.timeline?.map((item) => {
                  const isInternal = item.visibility === "INTERNAL";
                  const isRequest = item.type === "RESPONSE_REQUEST";
                  const isResponse = item.type === "RESPONSE_SUBMISSION";
                  const isResolution = item.type === "RESOLUTION";

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-colors ${
                        isInternal
                          ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60"
                          : isResolution
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                          : isRequest
                          ? "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {item.actorName} ({item.actorRole})
                          </span>
                          {isInternal ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold">
                              <Lock className="w-2.5 h-2.5 mr-1" /> Internal Memo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] font-bold">
                              {item.type.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(item.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} • {new Date(item.timestamp).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {item.message}
                      </p>
                      {item.evidenceUrls && item.evidenceUrls.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.evidenceUrls.map((url, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setPreviewImageUrl(url)}
                              className="text-[11px] text-emerald-700 dark:text-emerald-400 underline flex items-center gap-1 hover:text-emerald-900"
                            >
                              <FileText className="w-3 h-3" /> Attached Evidence #{i + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                Immutable, append-only history of all grievance modifications, state changes, priority adjustments, and conciliation actions.
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {grievance.auditTrail?.map((entry) => (
                  <div key={entry.id} className="p-3 bg-white dark:bg-slate-900 text-xs flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{entry.action}</span>
                        <span className="text-slate-500">• by {entry.actorName} ({entry.actorRole})</span>
                      </div>
                      {entry.notes && <p className="text-slate-600 dark:text-slate-400 text-[11px]">{entry.notes}</p>}
                      {entry.oldValue && entry.newValue && (
                        <p className="text-[11px] text-slate-500 font-mono">
                          {entry.oldValue} → {entry.newValue}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                      {new Date(entry.timestamp).toLocaleDateString("en-IN")} {new Date(entry.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Note Dialog */}
        <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {noteType === "INTERNAL_NOTE" ? "Add Internal Federation Note" : "Post Public Update"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-xs text-slate-500">
                {noteType === "INTERNAL_NOTE"
                  ? "This note will ONLY be visible to Federation and Super Admin staff. Customers and Workers will NEVER see it."
                  : "This update will be published to the customer and worker public timeline."}
              </p>
              <Textarea
                placeholder="Type note or update message..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={4}
                className="text-xs"
              />
            </div>
            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setIsNoteOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handlePostNote} disabled={isSubmitting || !noteText.trim()}>
                {isSubmitting ? "Posting..." : "Record Note"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Request Response Dialog */}
        <Dialog open={isRequestResponseOpen} onOpenChange={setIsRequestResponseOpen}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Request Official Statement / Clarification</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Party</label>
                <select
                  value={requestTarget}
                  onChange={(e) => setRequestTarget(e.target.value as GrievancePartyRole)}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2"
                >
                  <option value="WORKER">Worker ({grievance.targetName || "Assigned Craftsman"})</option>
                  <option value="CUSTOMER">Customer ({grievance.raisedByName})</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Statement Question / Request</label>
                <Textarea
                  placeholder="e.g. Please clarify if the work was completed in accordance with requirements..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  rows={4}
                  className="text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setIsRequestResponseOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleRequestResponse} disabled={isSubmitting || !requestMessage.trim()} className="bg-purple-700 hover:bg-purple-800 text-white font-bold">
                {isSubmitting ? "Sending..." : "Issue Response Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Adjust Priority Dialog */}
        <Dialog open={isPriorityOpen} onOpenChange={setIsPriorityOpen}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Adjust Case Priority</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">New Priority</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as GrievancePriority)}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 font-bold"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL (Safety / Harassment)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Reason for Adjustment</label>
                <Input
                  placeholder="e.g. Upgraded due to electrical safety hazard reported"
                  value={priorityReason}
                  onChange={(e) => setPriorityReason(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setIsPriorityOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAdjustPriority} disabled={isSubmitting || !priorityReason.trim()}>
                {isSubmitting ? "Updating..." : "Confirm Priority"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Status Dialog */}
        <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Transition Lifecycle Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">New Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as GrievanceLifecycleStatus)}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 font-bold"
                >
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="ACTION_REQUIRED">ACTION_REQUIRED</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status Transition Notes</label>
                <Input
                  placeholder="Optional transition reason or administrative notes"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setIsStatusOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleUpdateStatus} disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Transition Status"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Resolve Dialog */}
        <Dialog open={isResolveOpen} onOpenChange={setIsResolveOpen}>
          <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-emerald-800 dark:text-emerald-300">
                Record Official Dispute Resolution
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Resolution Type</label>
                <select
                  value={resolutionType}
                  onChange={(e) => setResolutionType(e.target.value as any)}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 font-semibold"
                >
                  <option value="CONCILIATION">Conciliation / Mediated Settlement</option>
                  <option value="REPAIR_CORRECTION">Complimentary Repair / Correction Assigned</option>
                  <option value="COURTESY_CREDIT_RECOMMENDED">Courtesy Credit Recommendation</option>
                  <option value="WARNING_ISSUED">Formal Disciplinary Warning Issued</option>
                  <option value="POLICY_CLARIFIED">Platform Cooperative Policy Clarified</option>
                  <option value="DISMISSED">Dismissed / Inadmissible Claim</option>
                  <option value="OTHER">Other Resolution</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Resolution Summary</label>
                <Input
                  placeholder="Brief summary of dispute settlement"
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Action Taken Details</label>
                <Textarea
                  placeholder="Detailed administrative action, inspection results, and agreed remedy..."
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Compensation / Credit Reference (Optional)</label>
                <Input
                  placeholder="e.g. CR-AHM-2026-0941"
                  value={compensationRef}
                  onChange={(e) => setCompensationRef(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setIsResolveOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleResolve}
                disabled={isSubmitting || !resolutionSummary.trim() || !actionTaken.trim()}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              >
                {isSubmitting ? "Resolving..." : "Confirm & Finalize Resolution"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-rose-800 dark:text-rose-300">
                Reject Complaint (Terminal Action)
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              <p className="text-slate-500">
                Rejecting a complaint is a <strong>permanent terminal action</strong>. Once rejected, the case is closed with no further updates, modifications, or re-opening allowed.
              </p>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rejection Reason (Required) <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  placeholder="Enter detailed justification for rejecting this grievance..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setIsRejectOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleReject}
                disabled={isSubmitting || !rejectReason.trim()}
                className="bg-rose-700 hover:bg-rose-800 text-white font-bold"
              >
                {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Close Dialog */}
        <Dialog open={isCloseOpen} onOpenChange={setIsCloseOpen}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                Close Complaint (Administrative Close)
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              <p className="text-slate-500">
                Closing a complaint terminates the dispute without formal resolution. This action is <strong>permanent</strong> and cannot be undone.
              </p>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Administrative Closure Notes</label>
                <Textarea
                  placeholder="Optional notes regarding the administrative closure..."
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setIsCloseOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCloseCase}
                disabled={isSubmitting}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold"
              >
                {isSubmitting ? "Closing..." : "Close Case"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Escalate Dialog */}
        <Dialog open={isEscalateOpen} onOpenChange={setIsEscalateOpen}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-rose-800 dark:text-rose-300">
                Escalate Case to Super Admin
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              <p className="text-slate-500">
                Escalating will transfer this case to the Super Administrator queue. All federation notes, evidence, and chronological history are preserved.
              </p>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Escalation Reason</label>
                <Textarea
                  placeholder="State the reason requiring state apex federation arbitration or platform intervention..."
                  value={escalationReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setIsEscalateOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleEscalate}
                disabled={isSubmitting || !escalationReason.trim()}
                className="bg-rose-700 hover:bg-rose-800 text-white font-bold"
              >
                {isSubmitting ? "Escalating..." : "Confirm Escalation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Evidence Image Preview Modal */}
        {previewImageUrl && (
          <Dialog open={!!previewImageUrl} onOpenChange={() => setPreviewImageUrl(null)}>
            <DialogContent className="max-w-2xl p-4 bg-white dark:bg-slate-900 border-0 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold flex items-center justify-between">
                  <span>Evidence File Preview</span>
                </DialogTitle>
              </DialogHeader>
              <div className="py-2 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImageUrl}
                  alt="Evidence Preview"
                  className="max-h-[70vh] w-auto object-contain rounded-lg border border-slate-200 dark:border-slate-700 shadow-md"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
