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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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

  const [isEscalateOpen, setIsEscalateOpen] = React.useState(false);
  const [escalationReason, setEscalateReason] = React.useState("");

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  if (!isOpen || !grievance) return null;

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
        {/* Case Header Banner */}
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
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <span>Category: <strong>{grievance.category}</strong></span>
                {grievance.subcategory && <span>• Subcategory: {grievance.subcategory}</span>}
                <span>• Filed: {new Date(grievance.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </p>
            </div>

            {/* Quick Action Toolbar */}
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
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Resolve Dispute
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
            Case Overview & Context
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
            Timeline & Communications ({grievance.timeline.length})
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
            Immutable Audit Trail ({grievance.auditTrail.length})
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
              {/* Parties Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Complainant ({grievance.raisedByRole})
                  </span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      {grievance.raisedByName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{grievance.raisedByName}</h4>
                      {grievance.raisedByPhone && (
                        <p className="text-xs text-slate-500 font-mono">{grievance.raisedByPhone}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Target Party ({grievance.targetRole || "Worker / Federation"})
                  </span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                      {(grievance.targetName || "T").charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {grievance.targetName || "Designated Trade Worker"}
                      </h4>
                      {grievance.targetPhone && (
                        <p className="text-xs text-slate-500 font-mono">{grievance.targetPhone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Statement */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Original Grievance Statement
                </span>
                <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {grievance.description}
                </p>
              </div>

              {/* Booking Context (If booking-linked) */}
              {grievance.bookingContext && (
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/40 pb-2">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5" />
                      Linked Booking Context (REF: {grievance.bookingContext.bookingNumber || grievance.bookingId})
                    </span>
                    <Badge variant="outline" className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border-emerald-300 text-[10px] font-bold">
                      Booking: {grievance.bookingContext.bookingStatus || "CONFIRMED"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Service</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{grievance.bookingContext.serviceTitle || "Trade Service"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">System Estimate</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">₹{grievance.bookingContext.systemEstimate ?? "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Final Bill</span>
                      <span className="font-mono font-extrabold text-emerald-800 dark:text-emerald-300">₹{grievance.bookingContext.finalBill ?? "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Status</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">{grievance.bookingContext.paymentStatus || "PENDING"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Resolution Display if Resolved */}
              {grievance.resolution && (
                <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Official Resolution: {grievance.resolution.resolutionType}
                    </span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      Resolved on {new Date(grievance.resolution.resolvedAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-900 dark:text-emerald-100 leading-relaxed">
                    <strong>Action Taken:</strong> {grievance.resolution.actionTaken}
                  </p>
                  {grievance.resolution.compensationReference && (
                    <p className="text-xs text-emerald-800 dark:text-emerald-300">
                      <strong>Reference:</strong> {grievance.resolution.compensationReference}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-6">
              {/* Timeline Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Communications & Updates ({grievance.timeline.length} items)
                </span>
                <div className="flex items-center gap-2">
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
                    Add Public Update
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsRequestResponseOpen(true)}
                    className="text-xs gap-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Request Party Response
                  </Button>
                </div>
              </div>

              {/* Chronological Timeline List */}
              <div className="space-y-4">
                {grievance.timeline.map((item) => {
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
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-emerald-700 dark:text-emerald-400 underline flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" /> Attached Evidence #{i + 1}
                            </a>
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
                {grievance.auditTrail.map((entry) => (
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
                  placeholder="e.g. Please clarify if the double battery backup load exceeded 800W during installation..."
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
                  <option value="REJECTED">REJECTED</option>
                  <option value="CLOSED">CLOSED</option>
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
                  <option value="COURTESY_CREDIT_RECOMMENDED">Courtesy Credit Recommendation (Recorded only)</option>
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
                  placeholder="e.g. CR-AHM-2026-0941 (Reference only; financial states remain controlled)"
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
      </DialogContent>
    </Dialog>
  );
}
