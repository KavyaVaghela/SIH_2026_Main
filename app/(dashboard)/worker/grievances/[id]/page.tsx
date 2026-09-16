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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import type { GrievanceCase, GrievanceLifecycleStatus } from "@/types/complaints/v2";
import { WhatHappensNextCard } from "@/features/guidance/components/what-happens-next-card";
import { ContextualHelpPopover } from "@/features/guidance/components/contextual-help-popover";

export default function WorkerGrievanceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [grievance, setGrievance] = React.useState<GrievanceCase | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Response form
  const [statementText, setStatementText] = React.useState("");
  const [evidenceUrlInput, setEvidenceUrlInput] = React.useState("");
  const [evidenceUrls, setEvidenceUrls] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const fetchGrievance = React.useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const workerId = user?.id || "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";

      const res = await fetch(`/api/complaints/${params.id}?role=WORKER&actorId=${workerId}`);
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

  const handleSubmitStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statementText.trim() || !grievance) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const workerId = user?.id || "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";
      const workerName = user?.user_metadata?.full_name || "Ravi Patel";

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
      setEvidenceUrls([]);
      fetchGrievance();
    } catch (err: unknown) {
      setSubmitError((err as Error).message || "Failed to submit statement");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading grievance case...</div>;
  }

  if (error || !grievance) {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Grievance Not Found</h3>
        <p className="text-xs text-slate-500">{error || "You do not have access to view this dispute."}</p>
        <Button size="sm" variant="outline" onClick={() => router.push("/worker/grievances")}>
          Back to Grievances
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: GrievanceLifecycleStatus) => {
    switch (status) {
      case "OPEN":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-bold text-xs">Open</Badge>;
      case "UNDER_REVIEW":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-xs">Under Review</Badge>;
      case "ACTION_REQUIRED":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300 font-bold text-xs">Statement Required</Badge>;
      case "RESOLVED":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs">Resolved</Badge>;
      case "CLOSED":
        return <Badge className="bg-slate-200 text-slate-800 font-bold text-xs">Closed</Badge>;
      case "ESCALATED":
        return <Badge className="bg-red-100 text-red-800 border-red-300 font-bold text-xs">State Review</Badge>;
      default:
        return <Badge className="font-bold text-xs">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/worker/grievances")} className="h-8 w-8 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border">
                {grievance.complaintNumber}
              </span>
              {getStatusBadge(grievance.status)}
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {grievance.subject}
            </h1>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="text-xs text-slate-400 font-mono">
            Filed on {new Date(grievance.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <ContextualHelpPopover
            buttonText="What happens after I submit a grievance?"
            modalTitle="Worker Grievance Process"
            summary="Worker disputes regarding customer conduct, non-payment, or safety hazards are arbitrated by the federation."
            sections={[
              { heading: "Grievance Lodged (OPEN)", details: "Your case is recorded with tracking code KS-GRV and evaluated by Smart Triage." },
              { heading: "Conciliation Review", details: "Assigned federation officer reviews job logs, estimate quotes, and customer history." },
              { heading: "Statement Request (If Needed)", details: "If testimony is required, you or the customer will receive an inquiry prompt." },
              { heading: "Remedy & Payment Recovery", details: "Federation orders settlement, payment release from escrow, or customer warning." },
              { heading: "Closure & Permanent Record", details: "Case is finalized in cooperative records without penalty to your rating." },
            ]}
            variant="badge"
          />
        </div>
      </div>

      {/* Dynamic "What Happens Next?" Guidance Card */}
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
              <Receipt className="w-3.5 h-3.5" />
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

      {/* Case Overview */}
      <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{grievance.category}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Involved Party</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{grievance.targetName || grievance.raisedByName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Arbitrating Federation</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{grievance.federationName || "Ahmedabad Labour Cooperative Federation"}</span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Statement Details</span>
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

      {/* Resolution if Resolved */}
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

      {/* Statement Required Box */}
      {grievance.status === "ACTION_REQUIRED" && (
        <Card className="p-5 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-300 dark:border-purple-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-200">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            Worker Statement Requested by Federation Officer
          </div>
          <p className="text-xs text-purple-800 dark:text-purple-300">
            The federation conciliation officer has requested your formal statement and work records regarding this case. Please provide your explanation below.
          </p>

          <form onSubmit={handleSubmitStatement} className="space-y-3 pt-1">
            {submitError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                {submitError}
              </div>
            )}
            <Textarea
              placeholder="State your technical observations, work performed, materials used, or client interactions..."
              value={statementText}
              onChange={(e) => setStatementText(e.target.value)}
              rows={4}
              className="text-xs"
              required
            />

            <div className="flex gap-2">
              <Input
                placeholder="Optional work photo/document URL..."
                value={evidenceUrlInput}
                onChange={(e) => setEvidenceUrlInput(e.target.value)}
                className="text-xs h-9"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (evidenceUrlInput.trim()) {
                    setEvidenceUrls((prev) => [...prev, evidenceUrlInput.trim()]);
                    setEvidenceUrlInput("");
                  }
                }}
                className="text-xs font-semibold shrink-0"
              >
                Attach
              </Button>
            </div>

            {evidenceUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs">
                {evidenceUrls.map((u, idx) => (
                  <span key={idx} className="bg-white dark:bg-slate-800 px-2 py-1 rounded border text-[11px] font-mono">
                    {u}
                  </span>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !statementText.trim()}
                className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? "Submitting..." : "Submit Statement to Federation"}
              </Button>
            </div>
          </form>
        </Card>
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
