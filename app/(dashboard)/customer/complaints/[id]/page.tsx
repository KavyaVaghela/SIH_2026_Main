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
import { createClient } from "@/lib/supabase/client";
import type { GrievanceCase, GrievanceLifecycleStatus } from "@/types/complaints/v2";
import { WhatHappensNextCard } from "@/features/guidance/components/what-happens-next-card";
import { ContextualHelpPopover } from "@/features/guidance/components/contextual-help-popover";

export default function CustomerComplaintDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [complaint, setComplaint] = React.useState<GrievanceCase | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Response submission state
  const [responseText, setResponseText] = React.useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = React.useState(false);
  const [responseError, setResponseError] = React.useState<string | null>(null);

  const fetchComplaint = React.useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const customerId = user?.id || "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";

      const res = await fetch(`/api/complaints/${params.id}?role=CUSTOMER&actorId=${customerId}`);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to load complaint");
      }
      setComplaint(data.complaint);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to load complaint");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  React.useEffect(() => {
    fetchComplaint();
  }, [fetchComplaint]);

  const handleSubmitClarification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim() || !complaint) return;

    setIsSubmittingResponse(true);
    setResponseError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const customerId = user?.id || "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";
      const customerName = user?.user_metadata?.full_name || "Customer";

      const res = await fetch(`/api/complaints/${complaint.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "RESPONSE_SUBMISSION",
          message: responseText.trim(),
          actorId: customerId,
          actorRole: "CUSTOMER",
          actorName: customerName,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to submit statement");

      setResponseText("");
      fetchComplaint();
    } catch (err: unknown) {
      setResponseError((err as Error).message || "Failed to submit statement");
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading case file...</div>;
  }

  if (error || !complaint) {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Grievance Not Found</h3>
        <p className="text-xs text-slate-500">{error || "You may not have permission to view this case."}</p>
        <Button size="sm" variant="outline" onClick={() => router.push("/customer/complaints")}>
          Back to My Complaints
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
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300 font-bold text-xs">Clarification Requested</Badge>;
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
          <Button variant="outline" size="sm" onClick={() => router.push("/customer/complaints")} className="h-8 w-8 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border">
                {complaint.complaintNumber}
              </span>
              {getStatusBadge(complaint.status)}
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {complaint.subject}
            </h1>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="text-xs text-slate-400 font-mono">
            Filed on {new Date(complaint.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <ContextualHelpPopover
            buttonText="What happens after I submit a grievance?"
            modalTitle="Grievance Resolution Process"
            summary="Every complaint on KaushalyaSetu is governed by transparent cooperative conciliation under Phase 5."
            sections={[
              { heading: "Submitted (OPEN)", details: "Your case is logged with tracking reference KS-GRV and evaluated by Smart Triage for urgency." },
              { heading: "Under Review", details: "Assigned to a regional cooperative federation conciliation officer who reviews booking logs and evidence." },
              { heading: "Response Required (If Disputed)", details: "If testimony or photos are needed, a formal statement request is issued to worker or customer." },
              { heading: "Resolution & Remedy", details: "Federation issues binding remedies: service rework under warranty, voucher, or mutual settlement." },
              { heading: "Case Closure", details: "Historical case records are permanently sealed in the cooperative audit log." },
            ]}
            variant="badge"
          />
        </div>
      </div>

      {/* Dynamic "What Happens Next?" Guidance Card */}
      <WhatHappensNextCard
        context={{
          role: "CUSTOMER",
          entityType: "GRIEVANCE",
          currentStatus: complaint.status,
          entityId: complaint.id,
        }}
      />

      {/* Linked Booking Context Card */}
      {complaint.bookingContext && (
        <Card className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900 pb-2">
            <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" />
              Service Booking #{complaint.bookingContext.bookingNumber || complaint.bookingId}
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
              Status: {complaint.bookingContext.bookingStatus || "COMPLETED"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Service</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{complaint.bookingContext.serviceTitle || "Trade Service"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Worker</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{complaint.bookingContext.workerName || "Craftsman"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Final Bill</span>
              <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">₹{complaint.bookingContext.finalBill ?? "N/A"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment Status</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">{complaint.bookingContext.paymentStatus || "PAID"}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Case Overview */}
      <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{complaint.category}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Against Party</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{complaint.targetName || "Assigned Worker"}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Reviewing Federation</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{complaint.federationName || "Cooperative Federation"}</span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Grievance Description</span>
          <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
            {complaint.description}
          </p>
        </div>

        {complaint.evidenceUrls && complaint.evidenceUrls.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Attached Evidence</span>
            <div className="flex flex-wrap gap-2">
              {complaint.evidenceUrls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-700 dark:text-emerald-400 underline flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" /> Evidence Document #{i + 1}
                </a>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Resolution Card if Resolved */}
      {complaint.resolution && (
        <Card className="p-5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Grievance Resolved: {complaint.resolution.resolutionType}
            </span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
              {new Date(complaint.resolution.resolvedAt).toLocaleDateString("en-IN")}
            </span>
          </div>
          <p className="text-xs text-emerald-900 dark:text-emerald-100 leading-relaxed">
            <strong>Action Taken:</strong> {complaint.resolution.actionTaken}
          </p>
          {complaint.resolution.compensationReference && (
            <p className="text-xs text-emerald-800 dark:text-emerald-300">
              <strong>Resolution Reference:</strong> {complaint.resolution.compensationReference}
            </p>
          )}
        </Card>
      )}

      {/* Clarification Request & Submission Box */}
      {complaint.status === "ACTION_REQUIRED" && (
        <Card className="p-5 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-300 dark:border-purple-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-200">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            Federation Clarification Requested
          </div>
          <p className="text-xs text-purple-800 dark:text-purple-300">
            The federation conciliation officer has requested additional clarification or evidence regarding this case. Please submit your statement below.
          </p>

          <form onSubmit={handleSubmitClarification} className="space-y-3 pt-1">
            {responseError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                {responseError}
              </div>
            )}
            <Textarea
              placeholder="Type your response or clarification statement..."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              rows={3}
              className="text-xs"
              required
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingResponse || !responseText.trim()}
                className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmittingResponse ? "Submitting..." : "Submit Statement"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Public Timeline */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600" />
          Case Timeline & Communications
        </h3>

        <div className="space-y-3">
          {complaint.timeline.map((item) => (
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
