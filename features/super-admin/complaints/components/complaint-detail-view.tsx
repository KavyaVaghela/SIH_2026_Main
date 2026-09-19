"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Building2,
  User,
  Briefcase,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Shield,
  Layers,
  Lock,
  MessageSquare,
  Send,
  XCircle,
  Archive,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type {
  GrievanceCase,
  GrievanceLifecycleStatus,
  GrievancePriority,
  GrievanceResolution,
  GrievancePartyRole,
} from "@/types/complaints/v2";

export function ComplaintDetailView() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";

  const [complaint, setComplaint] = React.useState<GrievanceCase | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Form states
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  // Modals / active tabs
  const [internalNoteText, setInternalNoteText] = React.useState<string>("");
  const [publicUpdateText, setPublicUpdateText] = React.useState<string>("");

  // Action dialog states
  const [showResolveDialog, setShowResolveDialog] = React.useState<boolean>(false);
  const [resolveType, setResolveType] = React.useState<string>("CONCILIATION");
  const [resolveAction, setResolveAction] = React.useState<string>("");
  const [resolveSummary, setResolveSummary] = React.useState<string>("");

  const [showRejectDialog, setShowRejectDialog] = React.useState<boolean>(false);
  const [rejectReason, setRejectReason] = React.useState<string>("");

  const [showCloseDialog, setShowCloseDialog] = React.useState<boolean>(false);
  const [closeNotes, setCloseNotes] = React.useState<string>("");

  const [showRequestDialog, setShowRequestDialog] = React.useState<boolean>(false);
  const [requestTarget, setRequestTarget] = React.useState<GrievancePartyRole>("WORKER");
  const [requestPrompt, setRequestPrompt] = React.useState<string>("");

  // Fetch real complaint from API
  const fetchComplaint = React.useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/complaints/${id}?role=SUPER_ADMIN`);
      if (res.ok) {
        const json = await res.json();
        if (json.complaint) {
          setComplaint(json.complaint);
        } else {
          setError("Complaint record could not be found.");
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.error || "Failed to load complaint.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchComplaint();
  }, [fetchComplaint]);

  // Realtime subscription on complaints table for this complaint ID
  React.useEffect(() => {
    if (!id) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`super-admin-complaint-detail-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "complaints",
          filter: `id=eq.${id}`,
        },
        () => {
          fetchComplaint();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, fetchComplaint]);

  const isTerminal = complaint?.status === "REJECTED" || complaint?.status === "CLOSED";

  // Post Internal Note
  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNoteText.trim() || !complaint || isTerminal) return;

    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "INTERNAL_NOTE",
          message: internalNoteText.trim(),
          actorId: "super-admin-01",
          actorRole: "SUPER_ADMIN",
          actorName: "Super Administrator",
        }),
      });
      if (res.ok) {
        setInternalNoteText("");
        await fetchComplaint();
      } else {
        const json = await res.json();
        setActionError(json.error || "Failed to add internal note.");
      }
    } catch (err: any) {
      setActionError(err.message || "Failed to submit note.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Post Public Update
  const handleAddPublicUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicUpdateText.trim() || !complaint || isTerminal) return;

    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "PUBLIC_UPDATE",
          message: publicUpdateText.trim(),
          actorId: "super-admin-01",
          actorRole: "SUPER_ADMIN",
          actorName: "Super Administrator",
        }),
      });
      if (res.ok) {
        setPublicUpdateText("");
        await fetchComplaint();
      } else {
        const json = await res.json();
        setActionError(json.error || "Failed to add public update.");
      }
    } catch (err: any) {
      setActionError(err.message || "Failed to submit update.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Request Clarification / Response
  const handleRequestResponse = async () => {
    if (!requestPrompt.trim() || !complaint || isTerminal) return;

    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "RESPONSE_REQUEST",
          targetParty: requestTarget,
          message: requestPrompt.trim(),
          actorId: "super-admin-01",
          actorRole: "SUPER_ADMIN",
          actorName: "Super Administrator",
        }),
      });
      if (res.ok) {
        setShowRequestDialog(false);
        setRequestPrompt("");
        await fetchComplaint();
      } else {
        const json = await res.json();
        setActionError(json.error || "Failed to issue response request.");
      }
    } catch (err: any) {
      setActionError(err.message || "Failed to send request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resolve Complaint
  const handleResolve = async () => {
    if (!resolveAction.trim() || !complaint || isTerminal) return;

    setIsSubmitting(true);
    setActionError(null);
    try {
      const resolutionPayload: GrievanceResolution = {
        resolutionType: resolveType as any,
        actionTaken: resolveAction.trim(),
        summary: resolveSummary.trim() || resolveAction.trim(),
        followUpRequired: false,
        resolvedAt: new Date().toISOString(),
        resolvedBy: "super-admin-01",
        resolvedByName: "Super Administrator",
      };

      const res = await fetch(`/api/complaints/${complaint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resolve",
          resolution: resolutionPayload,
          actorId: "super-admin-01",
          actorRole: "SUPER_ADMIN",
          actorName: "Super Administrator",
        }),
      });

      if (res.ok) {
        setShowResolveDialog(false);
        setResolveAction("");
        setResolveSummary("");
        await fetchComplaint();
      } else {
        const json = await res.json();
        setActionError(json.error || "Failed to resolve complaint.");
      }
    } catch (err: any) {
      setActionError(err.message || "Failed to resolve.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reject Complaint
  const handleReject = async () => {
    if (!rejectReason.trim() || !complaint || isTerminal) return;

    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejectionReason: rejectReason.trim(),
          actorId: "super-admin-01",
          actorRole: "SUPER_ADMIN",
          actorName: "Super Administrator",
        }),
      });

      if (res.ok) {
        setShowRejectDialog(false);
        setRejectReason("");
        await fetchComplaint();
      } else {
        const json = await res.json();
        setActionError(json.error || "Failed to reject complaint.");
      }
    } catch (err: any) {
      setActionError(err.message || "Failed to reject.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close Complaint
  const handleClose = async () => {
    if (!complaint || isTerminal) return;

    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "close",
          notes: closeNotes.trim(),
          actorId: "super-admin-01",
          actorRole: "SUPER_ADMIN",
          actorName: "Super Administrator",
        }),
      });

      if (res.ok) {
        setShowCloseDialog(false);
        setCloseNotes("");
        await fetchComplaint();
      } else {
        const json = await res.json();
        setActionError(json.error || "Failed to close complaint.");
      }
    } catch (err: any) {
      setActionError(err.message || "Failed to close.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="space-y-6 py-12 text-center max-w-md mx-auto">
        <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Complaint Not Found</h2>
        <p className="text-xs text-muted-foreground">{error || "The requested complaint ticket does not exist."}</p>
        <Link href="/super-admin/complaints">
          <Button variant="outline" size="sm" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Super Admin Complaints
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Back link & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/40 pb-4">
        <div className="space-y-1">
          <Link
            href="/super-admin/complaints"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Super Admin Complaints Registry</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">
              {complaint.complaintNumber}
            </h1>
            <Badge variant="outline" className="text-xs">
              {complaint.category}
            </Badge>
            <Badge
              variant={complaint.priority === "CRITICAL" ? "destructive" : "secondary"}
              className="text-xs uppercase font-bold"
            >
              {complaint.priority}
            </Badge>
            <Badge
              className={
                complaint.status === "RESOLVED"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                  : complaint.status === "REJECTED"
                  ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20"
                  : complaint.status === "CLOSED"
                  ? "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20"
                  : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
              }
            >
              {complaint.status}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Logged: {new Date(complaint.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
      </div>

      {/* Terminal State Banner */}
      {isTerminal && (
        <Card className="p-4 border-slate-300 bg-slate-100/70 dark:bg-slate-900/50 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-slate-600 dark:text-slate-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-foreground">
                Terminal Immutable Complaint Record ({complaint.status})
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                This grievance case has reached a concluded terminal state. In accordance with cooperative governance rules,
                all status changes, timeline modifications, responses, and internal notes are permanently locked.
                {complaint.rejectionReason && ` Rejection reason: "${complaint.rejectionReason}".`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Action Error Notice */}
      {actionError && (
        <Card className="p-3 border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs">
          {actionError}
        </Card>
      )}

      {/* 4 Context Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Complainant Card */}
        <Card className="p-3.5 border-border/40 bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Complainant</span>
            <User className="h-3.5 w-3.5" />
          </div>
          <p className="text-sm font-bold text-foreground truncate">{complaint.raisedByName}</p>
          <Badge variant="outline" className="text-[10px]">
            {complaint.raisedByRole}
          </Badge>
          <p className="text-[10px] text-muted-foreground truncate font-mono">ID: {complaint.raisedBy}</p>
        </Card>

        {/* Target Party Card */}
        <Card className="p-3.5 border-border/40 bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Target Person</span>
            <User className="h-3.5 w-3.5" />
          </div>
          <p className="text-sm font-bold text-foreground truncate">{complaint.targetName || "Not Specified"}</p>
          {complaint.targetRole ? (
            <Badge variant="secondary" className="text-[10px]">
              {complaint.targetRole}
            </Badge>
          ) : (
            <span className="text-[10px] text-muted-foreground">Direct Platform / Operational</span>
          )}
          {complaint.targetProfileId && (
            <p className="text-[10px] text-muted-foreground truncate font-mono">ID: {complaint.targetProfileId}</p>
          )}
        </Card>

        {/* Federation Card */}
        <Card className="p-3.5 border-border/40 bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Federation</span>
            <Building2 className="h-3.5 w-3.5 text-indigo-500" />
          </div>
          <p className="text-sm font-bold text-foreground truncate">
            {complaint.federationName || "Regional Federation"}
          </p>
          <p className="text-[10px] text-muted-foreground truncate font-mono">ID: {complaint.federationId}</p>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Cooperative Jurisdiction</span>
        </Card>

        {/* Booking / Job Context Card */}
        <Card className="p-3.5 border-border/40 bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Linked Job / Gig</span>
            <Briefcase className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <p className="text-sm font-bold text-foreground truncate">
            {complaint.bookingContext?.bookingNumber || "No Booking Linked"}
          </p>
          {complaint.bookingContext?.serviceTitle && (
            <p className="text-xs text-muted-foreground truncate">{complaint.bookingContext.serviceTitle}</p>
          )}
          {complaint.bookingContext?.finalBill ? (
            <span className="text-[10px] font-mono text-emerald-600 font-semibold">
              ₹{complaint.bookingContext.finalBill}
            </span>
          ) : null}
        </Card>
      </div>

      {/* Main Grid: Subject & Description + Evidence + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Statement, Evidence, Action Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {/* Complaint Statement Card */}
          <Card className="p-5 border-border/40 shadow-sm">
            <h3 className="text-base font-bold text-foreground mb-1">{complaint.subject}</h3>
            <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed mt-2 p-3.5 rounded-lg bg-muted/40 border border-border/30">
              {complaint.description}
            </p>

            {/* Evidence Gallery */}
            {complaint.evidenceUrls && complaint.evidenceUrls.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/40">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Attached Evidence ({complaint.evidenceUrls.length})</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {complaint.evidenceUrls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative rounded-lg border border-border/40 overflow-hidden bg-muted/20 aspect-video flex items-center justify-center hover:border-primary transition-all"
                    >
                      <img
                        src={url}
                        alt={`Evidence ${i + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        <span>View</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Super Admin Action Panel (Active when not terminal) */}
          {!isTerminal && (
            <Card className="p-5 border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/30 to-background dark:from-indigo-950/10 shadow-sm">
              <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Super Admin Decision Workspace</span>
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Execute authorized central dispute conciliation decisions. All actions are logged into the permanent audit trail.
              </p>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  size="sm"
                  onClick={() => setShowResolveDialog(true)}
                  className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  Resolve Grievance
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRequestDialog(true)}
                  className="h-9 border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 text-xs font-semibold"
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                  Request Clarification
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRejectDialog(true)}
                  className="h-9 border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 text-xs font-semibold"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5" />
                  Reject Complaint
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowCloseDialog(true)}
                  className="h-9 text-xs font-semibold"
                >
                  <Archive className="h-3.5 w-3.5 mr-1.5" />
                  Close Case
                </Button>
              </div>

              {/* Public Update Quick Form */}
              <div className="mt-5 pt-4 border-t border-border/40">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Publish Public Update:</h4>
                <form onSubmit={handleAddPublicUpdate} className="flex gap-2">
                  <Input
                    placeholder="Provide public instruction or inspection notice visible to all parties..."
                    value={publicUpdateText}
                    onChange={(e) => setPublicUpdateText(e.target.value)}
                    className="h-9 text-xs flex-1"
                    disabled={isSubmitting}
                  />
                  <Button size="sm" type="submit" disabled={isSubmitting || !publicUpdateText.trim()} className="h-9 text-xs">
                    <Send className="h-3.5 w-3.5 mr-1" />
                    Post
                  </Button>
                </form>
              </div>
            </Card>
          )}

          {/* Chronological Timeline & Updates */}
          <Card className="p-5 border-border/40 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Public Audit Timeline ({complaint.timeline.length} Events)</span>
            </h3>

            <div className="space-y-3 relative pl-4 border-l-2 border-border/60">
              {complaint.timeline.map((event) => (
                <div key={event.id} className="relative space-y-1">
                  <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">
                      {event.actorName} ({event.actorRole})
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(event.timestamp).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded border border-border/30">
                    {event.message}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Col: Internal Notes (Confidential) */}
        <div className="space-y-6">
          <Card className="p-4 border-indigo-200 dark:border-indigo-900/60 bg-muted/20 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Lock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Internal Notes (Admin Only)</span>
              </div>
              <Badge variant="outline" className="text-[10px] text-indigo-600 font-mono">
                CONFIDENTIAL
              </Badge>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Internal notes are strictly confidential to Federation and Super Admin officers. They are permanently hidden from customers and workers.
            </p>

            {/* Note form */}
            {!isTerminal && (
              <form onSubmit={handleAddInternalNote} className="space-y-2">
                <Textarea
                  placeholder="Record confidential investigative findings or legal observations..."
                  value={internalNoteText}
                  onChange={(e) => setInternalNoteText(e.target.value)}
                  className="text-xs min-h-[80px]"
                  disabled={isSubmitting}
                />
                <Button
                  size="sm"
                  type="submit"
                  disabled={isSubmitting || !internalNoteText.trim()}
                  className="w-full h-8 text-xs font-semibold"
                >
                  Add Internal Note
                </Button>
              </form>
            )}

            {/* Notes List */}
            <div className="space-y-2.5 pt-2">
              {(!complaint.internalNotes || complaint.internalNotes.length === 0) ? (
                <p className="text-xs text-muted-foreground italic text-center py-4">No internal notes logged.</p>
              ) : (
                complaint.internalNotes.map((note) => (
                  <div key={note.id} className="p-3 rounded-lg bg-background border border-border/60 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <strong className="text-foreground">{note.actorName}</strong>
                      <span>{new Date(note.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                    </div>
                    <p className="text-xs text-foreground/90">{note.message}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* RESOLVE DIALOG MODAL */}
      {showResolveDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-5 bg-background shadow-xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Resolve Grievance</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Resolution Type</label>
                <select
                  value={resolveType}
                  onChange={(e) => setResolveType(e.target.value)}
                  className="w-full h-9 mt-1 px-3 text-xs rounded-md border border-input bg-background"
                >
                  <option value="CONCILIATION">Conciliation Agreement</option>
                  <option value="REPAIR_CORRECTION">Repair / Correction</option>
                  <option value="COURTESY_CREDIT_RECOMMENDED">Courtesy Credit Recommended</option>
                  <option value="WARNING_ISSUED">Formal Warning Issued</option>
                  <option value="POLICY_CLARIFIED">Policy Clarified</option>
                  <option value="DISMISSED">Dismissed with Explanation</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Action Taken *</label>
                <Textarea
                  placeholder="Specify official corrective action taken..."
                  value={resolveAction}
                  onChange={(e) => setResolveAction(e.target.value)}
                  className="text-xs min-h-[70px] mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Summary</label>
                <Input
                  placeholder="Concise summary sentence..."
                  value={resolveSummary}
                  onChange={(e) => setResolveSummary(e.target.value)}
                  className="text-xs h-9 mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowResolveDialog(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleResolve}
                disabled={isSubmitting || !resolveAction.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Confirm Resolution
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* REJECT DIALOG MODAL */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-5 bg-background shadow-xl space-y-4">
            <h3 className="text-base font-bold text-destructive">Reject Complaint</h3>
            <p className="text-xs text-muted-foreground">
              Once rejected, the complaint enters an immutable terminal state. Please provide an explicit, factual reason.
            </p>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Rejection Reason *</label>
              <Textarea
                placeholder="State why this complaint was deemed unsubstantiated or rejected..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="text-xs min-h-[80px] mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleReject}
                disabled={isSubmitting || !rejectReason.trim()}
              >
                Confirm Rejection
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* CLOSE DIALOG MODAL */}
      {showCloseDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-5 bg-background shadow-xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Close Complaint</h3>
            <p className="text-xs text-muted-foreground">
              Closing permanently locks the complaint as an archived historical record.
            </p>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Closing Notes</label>
              <Textarea
                placeholder="Optional closing notes or concluding statement..."
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                className="text-xs min-h-[80px] mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCloseDialog(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleClose} disabled={isSubmitting}>
                Confirm Closure
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* REQUEST CLARIFICATION DIALOG MODAL */}
      {showRequestDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-5 bg-background shadow-xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Request Statement / Clarification</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Target Party</label>
                <select
                  value={requestTarget}
                  onChange={(e) => setRequestTarget(e.target.value as GrievancePartyRole)}
                  className="w-full h-9 mt-1 px-3 text-xs rounded-md border border-input bg-background"
                >
                  <option value="WORKER">Worker</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="FEDERATION_ADMIN">Federation Admin</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Specific Inquiry Prompt *</label>
                <Textarea
                  placeholder="Clearly state what factual information or clarification the party must provide..."
                  value={requestPrompt}
                  onChange={(e) => setRequestPrompt(e.target.value)}
                  className="text-xs min-h-[80px] mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowRequestDialog(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRequestResponse}
                disabled={isSubmitting || !requestPrompt.trim()}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Send Request
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
