"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Receipt,
  FileText,
  MessageSquare,
  Send,
  AlertCircle,
  Lock,
  XCircle,
  Archive,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { GrievanceCase, GrievanceLifecycleStatus } from "@/types/complaints/v2";
import { WhatHappensNextCard } from "@/features/guidance/components/what-happens-next-card";

export default function WorkerGrievanceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [grievance, setGrievance] = React.useState<GrievanceCase | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Current worker session
  const [workerId, setWorkerId] = React.useState<string>("59eca4ff-a589-4363-ad76-24a4ff5b6e2e");
  const [workerName, setWorkerName] = React.useState<string>("Ravi Patel");

  // Response form
  const [statementText, setStatementText] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const fetchGrievance = React.useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const id = user?.id || "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";
      const name = user?.user_metadata?.full_name || "Ravi Patel";
      setWorkerId(id);
      setWorkerName(name);

      const res = await fetch(`/api/complaints/${params.id}?role=WORKER&actorId=${id}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Grievance not found");
      setGrievance(data.complaint);
    } catch (err: unknown) {
      setError((err as Error).message || "Grievance not found");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  React.useEffect(() => {
    fetchGrievance();
  }, [fetchGrievance]);

  // Realtime subscription for updates
  React.useEffect(() => {
    const supabase = createClient();
    const channelName = `worker-complaint-detail-${params.id}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "complaints",
          filter: `id=eq.${params.id}`,
        },
        () => {
          fetchGrievance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id, fetchGrievance]);

  const handleSubmitStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statementText.trim() || !grievance) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const evidenceUrls: string[] = [];
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("complaintId", grievance.id);
        const upRes = await fetch("/api/complaints/evidence", {
          method: "POST",
          body: formData,
        });
        if (upRes.ok) {
          const upJson = await upRes.json();
          if (upJson.url) evidenceUrls.push(upJson.url);
        }
      }

      const res = await fetch(`/api/complaints/${grievance.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "RESPONSE_SUBMISSION",
          message: statementText.trim(),
          evidenceUrls,
          actorId: workerId,
          actorRole: "WORKER",
          actorName: workerName,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to submit statement");

      setStatementText("");
      setFile(null);
      fetchGrievance();
    } catch (err: unknown) {
      setSubmitError((err as Error).message || "Failed to submit statement");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading complaint details...</div>;
  }

  if (error || !grievance) {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Complaint Not Found</h3>
        <p className="text-xs text-slate-500">{error || "You do not have access to view this dispute."}</p>
        <Button size="sm" variant="outline" onClick={() => router.push("/worker/grievances")}>
          Back to Complaints
        </Button>
      </div>
    );
  }

  const isCustomerComplaint = grievance.raisedByRole === "CUSTOMER";
  const isTerminal = grievance.status === "REJECTED" || grievance.status === "CLOSED";
  const responseRequested = grievance.responseRequests?.workerRequired && !grievance.responseRequests?.workerSubmitted;
  const responseSubmitted = grievance.responseRequests?.workerSubmitted;

  // Locate the worker's submitted response in the timeline
  const workerSubmissionEvent = grievance.timeline.find(
    (t) => t.type === "RESPONSE_SUBMISSION" && (t.actorRole === "WORKER" || t.actorId === workerId)
  );

  const getStatusBadge = (status: GrievanceLifecycleStatus) => {
    switch (status) {
      case "OPEN":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-bold text-xs">Open</Badge>;
      case "UNDER_REVIEW":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-xs">Under Review</Badge>;
      case "ACTION_REQUIRED":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300 font-bold text-xs">Response Requested</Badge>;
      case "RESOLVED":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs">Resolved</Badge>;
      case "REJECTED":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-bold text-xs">Rejected</Badge>;
      case "CLOSED":
        return <Badge className="bg-slate-200 text-slate-800 font-bold text-xs">Closed</Badge>;
      case "ESCALATED":
        return <Badge className="bg-red-100 text-red-800 border-red-300 font-bold text-xs">Escalated</Badge>;
      default:
        return <Badge className="font-bold text-xs">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/worker/grievances")}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border">
                {grievance.complaintNumber}
              </span>
              {getStatusBadge(grievance.status)}
              {isCustomerComplaint && (
                <Badge className="bg-slate-100 text-slate-700 text-[10px] font-semibold">
                  From Customer
                </Badge>
              )}
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {grievance.subject}
            </h1>
          </div>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Filed on {new Date(grievance.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>

      {/* Terminal State Alert */}
      {isTerminal && (
        <Card className={`p-4 rounded-xl flex items-start gap-3 border ${
          grievance.status === "REJECTED"
            ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200"
            : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
        }`}>
          {grievance.status === "REJECTED" ? (
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <Archive className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 text-xs">
            <span className="font-bold block text-sm">
              Case Finalized: {grievance.status}
            </span>
            <p>
              This complaint was officially {grievance.status.toLowerCase()} by the Federation. It is permanently archived and cannot be reopened or modified.
            </p>
            {grievance.rejectionReason && (
              <p className="font-medium pt-1 border-t border-rose-200/60 dark:border-rose-900/60">
                <strong>Federation Rejection Reason:</strong> {grievance.rejectionReason}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Guidance Card */}
      <WhatHappensNextCard
        context={{
          role: "WORKER",
          entityType: "GRIEVANCE",
          currentStatus: grievance.status,
          entityId: grievance.id,
        }}
      />

      {/* Booking Context if linked */}
      {grievance.bookingContext && (
        <Card className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900 pb-2">
            <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              Service Booking #{grievance.bookingContext.bookingNumber || grievance.bookingId}
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
              Status: {grievance.bookingContext.bookingStatus || "COMPLETED"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Service</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{grievance.bookingContext.serviceTitle || "Trade Service"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{grievance.bookingContext.customerName || "Customer"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Final Bill</span>
              <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">₹{grievance.bookingContext.finalBill ?? "N/A"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">{grievance.bookingContext.paymentStatus || "PAID"}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Statement and Facts Card */}
      <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{grievance.category}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              {isCustomerComplaint ? "Complainant" : "Target Party"}
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {isCustomerComplaint ? grievance.raisedByName : (grievance.targetName || "Customer")}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Arbitrating Federation</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{grievance.federationName || "Ahmedabad Labour Cooperative Federation"}</span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">
            {isCustomerComplaint ? "Customer's Statement" : "Your Statement"}
          </span>
          <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
            {grievance.description}
          </p>
        </div>

        {grievance.evidenceUrls && grievance.evidenceUrls.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Submitted Evidence</span>
            <div className="flex flex-wrap gap-2">
              {grievance.evidenceUrls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-700 dark:text-emerald-400 underline flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" /> Evidence Attachment #{i + 1}
                </a>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Settlement Card if Resolved */}
      {grievance.resolution && (
        <Card className="p-5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Settlement Reached: {grievance.resolution.resolutionType}
            </span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
              {new Date(grievance.resolution.resolvedAt).toLocaleDateString("en-IN")}
            </span>
          </div>
          <p className="text-xs text-emerald-900 dark:text-emerald-100 leading-relaxed">
            <strong>Action Taken:</strong> {grievance.resolution.actionTaken}
          </p>
          {grievance.resolution.compensationReference && (
            <p className="text-xs text-emerald-800 dark:text-emerald-300">
              <strong>Settlement Ref:</strong> {grievance.resolution.compensationReference}
            </p>
          )}
        </Card>
      )}

      {/* Customer Complaint: Worker Response Workflows */}
      {isCustomerComplaint && !isTerminal && (
        <>
          {/* State 1: Response Requested by Federation */}
          {responseRequested && (
            <Card className="p-5 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-300 dark:border-purple-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-200">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                Official Worker Statement Requested by Federation Officer
              </div>
              {grievance.responseRequests?.prompt && (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-purple-200 dark:border-purple-800 text-xs">
                  <span className="font-bold text-purple-900 dark:text-purple-200 block mb-0.5">Inquiry Question:</span>
                  <p className="text-purple-800 dark:text-purple-300 italic">
                    &ldquo;{grievance.responseRequests.prompt}&rdquo;
                  </p>
                </div>
              )}
              <p className="text-xs text-purple-800 dark:text-purple-300">
                Please provide your factual explanation of what occurred. You have one opportunity to submit your response.
              </p>

              <form onSubmit={handleSubmitStatement} className="space-y-3 pt-1">
                {submitError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                    {submitError}
                  </div>
                )}
                <Textarea
                  placeholder="State your observations, work performed, or interactions with the client..."
                  value={statementText}
                  onChange={(e) => setStatementText(e.target.value)}
                  rows={4}
                  className="text-xs bg-white dark:bg-slate-900"
                  required
                />

                <div className="flex items-center gap-2">
                  <label className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-full bg-white dark:bg-slate-900">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>{file ? file.name : "Attach photo or work record (optional)"}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setFile(e.target.files[0]);
                      }}
                    />
                  </label>
                  {file && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-rose-600 hover:text-rose-700 px-2"
                      onClick={() => setFile(null)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting || !statementText.trim()}
                    className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmitting ? "Submitting..." : "Submit Official Statement"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* State 2: Response Already Submitted (Locked historical record) */}
          {responseSubmitted && (
            <Card className="p-5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between border-b border-blue-100 dark:border-blue-900 pb-2">
                <span className="font-bold text-xs text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  Your Official Response Statement (Recorded & Locked)
                </span>
                {grievance.responseRequests?.workerSubmittedAt && (
                  <span className="text-[11px] font-mono text-blue-700 dark:text-blue-400">
                    Submitted {new Date(grievance.responseRequests.workerSubmittedAt).toLocaleDateString("en-IN")}
                  </span>
                )}
              </div>

              <p className="text-xs text-blue-950 dark:text-blue-100 leading-relaxed whitespace-pre-wrap">
                {workerSubmissionEvent?.message || "Your official statement has been securely recorded on file."}
              </p>

              {workerSubmissionEvent?.evidenceUrls && workerSubmissionEvent.evidenceUrls.length > 0 && (
                <div className="pt-2 border-t border-blue-100 dark:border-blue-900 space-y-1">
                  <span className="text-[10px] text-blue-500 font-bold uppercase block">Your Attached Evidence</span>
                  <div className="flex flex-wrap gap-2">
                    {workerSubmissionEvent.evidenceUrls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-700 dark:text-blue-300 underline flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> Attachment #{idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-blue-600 dark:text-blue-400/90 pt-1">
                Your response is part of the permanent conciliation history. Federation officers are actively reviewing all submissions.
              </p>
            </Card>
          )}

          {/* State 3: Response Not Requested */}
          {!responseRequested && !responseSubmitted && grievance.status !== "RESOLVED" && (
            <Card className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Awaiting Federation Review
              </span>
              <p className="text-slate-600 dark:text-slate-400">
                The Federation is currently reviewing the customer&apos;s complaint. No statement is required from you at this time. You will receive an official notification if your perspective is requested.
              </p>
            </Card>
          )}
        </>
      )}

      {/* Public Timeline */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600" />
          Dispute Timeline & Communications
        </h3>

        <div className="space-y-3">
          {grievance.timeline.map((item) => (
            <Card
              key={item.id}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {item.actorName} ({item.actorRole})
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(item.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} • {new Date(item.timestamp).toLocaleDateString("en-IN")}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {item.message}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
