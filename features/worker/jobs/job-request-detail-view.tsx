"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  Clock,
  Navigation,
  Wrench,
  ShieldCheck,
  Building2,
  AlertCircle,
  FileText,
  Eye,
  ThumbsUp,
  CheckCircle2,
  RefreshCw,
  History,
  Calculator,
  Edit3,
  Image as ImageIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/formatters/currency";
import { workerJobService } from "../services/worker-job-service";
import { CANONICAL_STATUS_LABELS, type WorkerJobItem, type BookingStatusHistoryItem } from "../types";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import { Send, X } from "lucide-react";

export interface JobRequestDetailViewProps {
  requestId: string;
}

export function JobRequestDetailView({ requestId }: JobRequestDetailViewProps) {
  const router = useRouter();
  const [job, setJob] = React.useState<WorkerJobItem | null>(null);
  const [history, setHistory] = React.useState<BookingStatusHistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [workerDbId, setWorkerDbId] = React.useState<string>("");
  const [showEstimateForm, setShowEstimateForm] = React.useState(false);
  const [estimateAmount, setEstimateAmount] = React.useState<string>("");
  const [estimateNotes, setEstimateNotes] = React.useState<string>("");
  const [showPhotoModal, setShowPhotoModal] = React.useState(false);
  const [photoLoadError, setPhotoLoadError] = React.useState(false);

  React.useEffect(() => {
    setPhotoLoadError(false);
  }, [job?.problemPhotoUrl]);

  // Resolve real worker UUID from authenticated session on mount
  React.useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.from("workers") as any)
            .select("id")
            .eq("profile_id", user.id)
            .maybeSingle()
            .then(({ data: wRec }: { data: { id: string } | null }) => {
              if (wRec?.id) setWorkerDbId(wRec.id);
            });
        }
      });
    });
  }, []);

  const loadDetails = React.useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
      setActionError(null);
    }
    try {
      const [data, hist] = await Promise.all([
        workerJobService.getJobDetails(requestId, workerDbId || undefined),
        workerJobService.getStatusHistory(requestId),
      ]);
      if (data) {
        setJob(data);
        setHistory(hist);
        if (data.workerEstimateAmount) {
          setEstimateAmount(String(data.workerEstimateAmount));
          setEstimateNotes(data.workerEstimateNotes || "");
        } else if (data.totalAmount) {
          setEstimateAmount((prev) => prev || String(data.totalAmount));
        }
      } else if (!isBackground) {
        setActionError("Job request not found.");
      }
    } catch (err) {
      console.error("Error loading job details", err);
      if (!isBackground) {
        setActionError("Failed to load job request details.");
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  }, [requestId, workerDbId]);

  React.useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  // Realtime subscription for customer confirmation & status transitions
  useRealtimeSubscription({
    table: "bookings",
    filter: `id=eq.${requestId}`,
    onPayload: (payload) => {
      if (payload?.new?.status) {
        setJob((prev) => (prev ? { ...prev, status: payload.new.status } : null));
      }
      loadDetails(true);
    },
  });

  useRealtimeSubscription({
    table: "job_requests",
    filter: `id=eq.${requestId}`,
    onPayload: () => {
      loadDetails(true);
    },
  });

  useRealtimeSubscription({
    table: "worker_estimates",
    filter: `job_request_id=eq.${requestId}`,
    onPayload: () => {
      loadDetails(true);
    },
  });

  // Action: Worker Reviews Request (REQUEST_SENT -> WORKER_REVIEWING)
  const handleReview = async () => {
    if (!job || isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccessMessage(null);
    try {
      const updated = await workerJobService.reviewJobRequest(job.id, workerDbId);
      const updatedHist = await workerJobService.getStatusHistory(job.id);
      setJob(updated);
      setHistory(updatedHist);
      setActionSuccessMessage("You are now reviewing this service request.");
    } catch (err: any) {
      console.error("Failed to review request", err);
      setActionError(err?.message || "Failed to update review status. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Worker Chooses Interested / Accept -> Opens Estimate Form
  const handleInterestedClick = () => {
    setShowEstimateForm(true);
    setActionError(null);
  };

  // Action: Submit Estimate
  const handleInlineSubmitEstimate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!job || isSubmitting) return;
    const amt = parseFloat(estimateAmount);
    if (isNaN(amt) || amt <= 0) {
      setActionError("Please enter a valid estimate amount in ₹.");
      return;
    }
    const minCharge = job.minimumVisitCharge || 200;
    if (amt < minCharge) {
      setActionError(`Estimate (₹${amt}) cannot be lower than the minimum visit charge of ₹${minCharge}.`);
      return;
    }
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccessMessage(null);
    try {
      const labor = Math.round(amt * 0.7);
      const materials = Math.round(amt * 0.3);
      const updated = await workerJobService.submitWorkerEstimate({
        bookingId: job.id,
        workerId: workerDbId,
        totalAmount: amt,
        estimatedAmount: amt,
        laborAmount: labor,
        materialAmount: materials,
        notes: estimateNotes.trim() || undefined,
      });
      if (updated) setJob(updated);
      setShowEstimateForm(false);
      setActionSuccessMessage(`Estimate of ₹${amt} successfully submitted to customer!`);
      await loadDetails(true);
    } catch (err: any) {
      console.error("Failed to submit estimate", err);
      setActionError(err?.message || "Failed to submit estimate. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Worker Expresses Interest without estimate
  const handleExpressInterest = async () => {
    if (!job || isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccessMessage(null);
    try {
      const updated = await workerJobService.expressInterestInJob(job.id, workerDbId);
      const updatedHist = await workerJobService.getStatusHistory(job.id);
      setJob(updated);
      setHistory(updatedHist);
      setActionSuccessMessage("Interest sent! The customer can now review your interest.");
    } catch (err: any) {
      console.error("Failed to express interest", err);
      setActionError(err?.message || "Failed to submit interest. Please verify your dispatch availability.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Job Request Details"
          description="Loading request specifications..."
          breadcrumbs={[
            { label: "Worker Portal", href: "/worker" },
            { label: "Schedule & Jobs", href: "/worker/schedule?tab=requests" },
            { label: "Details" },
          ]}
        />
        <Card className="p-12 text-center text-muted-foreground border-dashed">
          <RefreshCw className="h-5 w-5 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-sm font-medium">Loading job request #{requestId}...</p>
        </Card>
      </div>
    );
  }

  // Action: Worker Declines Request
  const handleDecline = async () => {
    if (!job || isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccessMessage(null);
    try {
      const updated = await workerJobService.declineJobRequest(job.id, workerDbId, "Worker declined request");
      if (updated) setJob(updated);
      setActionSuccessMessage("You have declined this service request.");
      router.push("/worker/schedule?tab=requests");
    } catch (err: any) {
      console.error("Failed to decline request", err);
      setActionError(err?.message || "Failed to decline request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (actionError && !job) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Job Request Details"
          breadcrumbs={[
            { label: "Worker Portal", href: "/worker" },
            { label: "Schedule & Jobs", href: "/worker/schedule?tab=requests" },
            { label: "Details" },
          ]}
        />
        <Card className="p-8 text-center text-destructive border-destructive/30 bg-destructive/5 space-y-3">
          <p className="text-base font-semibold">{actionError}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/worker/schedule?tab=requests")}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Return to Requests
          </Button>
        </Card>
      </div>
    );
  }

  if (!job) return null;

  const isDeclined = job.status === "DECLINED";
  const isUnavailable = job.status === "WORKER_UNAVAILABLE" || job.status === "NOT_SELECTED";
  const isRequestSent = (job.status === "REQUEST_SENT" || job.status === "PENDING") && !isUnavailable;
  const isReviewing = job.status === "WORKER_REVIEWING" && !isUnavailable;
  const isInterestSent =
    (job.status === "WORKER_INTERESTED" ||
    job.status === "INTERESTED" ||
    job.status === "CUSTOMER_CONFIRMATION_PENDING" ||
    job.status === "ESTIMATE_SUBMITTED") && !isUnavailable;
  const isConfirmedOrBeyond =
    job.status === "BOOKING_CONFIRMED" ||
    job.status === "SELECTED" ||
    job.status === "WORKER_ACCEPTED" ||
    job.status === "SERVICE_STARTED" ||
    job.status === "BOOKING_COMPLETED";

  const getStatusBadgeVariant = () => {
    if (isDeclined) return "destructive";
    if (isUnavailable) return "warning";
    if (isRequestSent) return "outline";
    if (isReviewing) return "warning";
    if (isInterestSent) return "secondary";
    if (isConfirmedOrBeyond) return "success";
    return "outline";
  };

  const statusDisplayLabel =
    isDeclined ? "Declined" :
    job.status === "WORKER_UNAVAILABLE" ? "Allocated / Unavailable" :
    job.status === "NOT_SELECTED" ? "Not Selected" :
    isRequestSent ? "New Request" :
    isReviewing ? "Under Review" :
    job.status === "ESTIMATE_SUBMITTED" ? "Estimate Submitted" :
    isInterestSent ? "Interest Sent — Waiting for Customer" :
    job.status === "SELECTED" ? "Customer Selected You!" :
    (CANONICAL_STATUS_LABELS[job.status] || job.status);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={`Job Request #${job.bookingNumber}`}
        description="Cooperative dispatch request awaiting worker review and quotation."
        breadcrumbs={[
          { label: "Worker Portal", href: "/worker" },
          { label: "Schedule & Jobs", href: "/worker/schedule?tab=requests" },
          { label: `Request #${job.bookingNumber}` },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/worker/schedule?tab=requests")}
            className="text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Return to Requests
          </Button>
        }
      />

      {/* Success Banner */}
      {actionSuccessMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-600/40 text-emerald-900 dark:text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {actionError && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Grid: Details & Interactive Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Request Specifications */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="border-border shadow-sm overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b pb-3 bg-muted/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-lg font-bold text-foreground">
                    {job.serviceTitle}
                  </CardTitle>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge
                    variant={getStatusBadgeVariant() as any}
                    className="text-xs font-semibold py-0.5 px-2.5"
                  >
                    {statusDisplayLabel}
                  </Badge>
                  {job.urgency === "EMERGENCY" && (
                    <Badge variant="destructive" className="text-xs">
                      EMERGENCY
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-5">
              {/* Customer & Location Block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                    <User className="h-3.5 w-3.5 mr-1 text-primary" />
                    Customer
                  </span>
                  <p className="text-base font-bold text-foreground">
                    {job.customerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Verified Household Customer
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                    Service Location
                  </span>
                  <p className="text-base font-bold text-foreground">
                    {job.customerArea}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <Navigation className="h-3 w-3 mr-1 text-blue-600" />
                    Distance: <strong className="text-foreground ml-1">{job.distanceKm} km</strong>
                  </p>
                </div>
              </div>

              {/* Timing & Schedule Block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg border bg-card space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1 text-amber-600" />
                    Requested Date
                  </span>
                  <p className="text-sm font-bold text-foreground">
                    {job.scheduledDate}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border bg-card space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1 text-teal-600" />
                    Requested Time
                  </span>
                  <p className="text-sm font-bold text-foreground">
                    {job.scheduledTime}
                  </p>
                </div>
              </div>

              {/* Problem Description */}
              <div className="space-y-1.5 pt-2 border-t">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  Problem Description
                </span>
                <p className="p-3.5 rounded-lg border bg-muted/30 text-sm leading-relaxed text-foreground">
                  {job.problemDescription}
                </p>
              </div>

              {/* Customer Uploaded Problem Photo */}
              {job.problemPhotoUrl && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                      <ImageIcon className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                      Problem Photo / Customer Evidence
                    </span>
                    <Badge variant="outline" className="text-[10px] font-medium border-emerald-300 text-emerald-700 dark:text-emerald-400">
                      Customer Attachment
                    </Badge>
                  </div>

                  {photoLoadError ? (
                    <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                        <span>Problem photo preview unavailable.</span>
                      </div>
                      <a
                        href={job.problemPhotoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-semibold hover:text-amber-800 shrink-0"
                      >
                        Open Direct Link
                      </a>
                    </div>
                  ) : (
                    <div className="max-w-sm rounded-xl overflow-hidden border border-border bg-card shadow-sm">
                      <div
                        className="relative max-h-56 bg-muted/40 cursor-pointer overflow-hidden flex items-center justify-center"
                        onClick={() => setShowPhotoModal(true)}
                        title="Click to view full photo"
                      >
                        {/* eslint-disable-next-html-element-attribute */}
                        {/* eslint-disable-next-html-element-content-type */}
                        <img
                          src={job.problemPhotoUrl}
                          alt="Customer Problem Evidence"
                          onError={() => setPhotoLoadError(true)}
                          className="max-h-56 w-full object-contain transition-transform duration-200 hover:scale-[1.02]"
                        />
                      </div>
                      <div className="p-2 px-3 flex items-center justify-between bg-muted/20 border-t border-border text-xs">
                        <span className="text-[11px] text-muted-foreground">
                          Inspect issue before submitting estimate
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPhotoModal(true)}
                          className="h-7 text-xs px-2.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Photo
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Institutional Dispatch Note */}
              <div className="flex items-center text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 mr-1.5 text-emerald-600 shrink-0" />
                <span>
                  Dispatched by: <strong className="text-foreground">{job.cooperativeName}</strong> via Gujarat Labour Federation registry.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Audit Status History Timeline */}
          {history.length > 0 && (
            <Card className="border-border shadow-sm overflow-hidden">
              <CardHeader className="p-4 border-b pb-2 bg-muted/10">
                <CardTitle className="text-sm font-bold text-foreground flex items-center">
                  <History className="h-4 w-4 mr-1.5 text-primary" />
                  Request Audit &amp; Status History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5">
                <div className="divide-y text-xs">
                  {history.map((hist, idx) => (
                    <div key={hist.id || idx} className="py-2 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center space-x-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" />
                        <span className="font-semibold text-foreground">
                          {CANONICAL_STATUS_LABELS[hist.newStatus] || hist.newStatus}
                        </span>
                        {hist.notes && (
                          <span className="text-muted-foreground italic truncate max-w-xs">
                            — {hist.notes}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {new Date(hist.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Financial Summary & Task 3 Action Workflow */}
        <div className="space-y-5">
          <Card className="border-border shadow-sm">
            <CardHeader className="p-4 sm:p-5 border-b pb-3 bg-muted/10">
              <CardTitle className="text-base font-bold text-foreground">
                Financial Breakdown
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-3.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Platform Initial Estimate:</span>
                <span className="text-lg font-bold text-foreground">
                  {formatINR(job.totalAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between text-muted-foreground">
                <span>Minimum Visit Charge:</span>
                <span className="font-semibold text-foreground">
                  {formatINR(job.minimumVisitCharge || 200)}
                </span>
              </div>

              <div className="flex items-center justify-between text-muted-foreground">
                <span>Cooperative Welfare Cess (5%):</span>
                <span>- {formatINR(job.totalAmount - job.workerEarnings)}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t font-semibold">
                <span className="text-foreground">Net Estimated Payout:</span>
                <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                  {formatINR(job.workerEarnings)}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-700/20 text-xs text-muted-foreground flex items-start space-x-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Cooperative Escrow Guarantee: Customer payment is secured in cooperative escrow prior to job execution.
                </span>
              </div>
            </CardContent>

            {/* Task 2 Interactive Actions: Interested/Accept, Decline & Estimate Form */}
            <CardFooter className="p-4 sm:p-5 border-t bg-muted/20 flex flex-col gap-3">
              {/* If Inline Estimate Form is open */}
              {showEstimateForm && !isConfirmedOrBeyond && (
                <form onSubmit={handleInlineSubmitEstimate} className="space-y-3 w-full p-3.5 rounded-lg border bg-card/90 shadow-sm">
                  <div className="flex items-center justify-between pb-1.5 border-b">
                    <span className="text-xs font-bold text-foreground flex items-center">
                      <Calculator className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                      {job.workerEstimateAmount ? "Update Your Estimate" : "Provide Service Estimate"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowEstimateForm(false)}
                      className="text-muted-foreground hover:text-foreground text-xs"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor="inline-estimate-amount" className="text-[11px] font-semibold text-foreground">
                        Estimated Amount (₹) *
                      </label>
                      <span className="text-[10px] text-muted-foreground">
                        Min: {formatINR(job.minimumVisitCharge || 200)}
                      </span>
                    </div>
                    <Input
                      id="inline-estimate-amount"
                      type="number"
                      min={job.minimumVisitCharge || 200}
                      step="10"
                      placeholder="e.g. 700"
                      value={estimateAmount}
                      onChange={(e) => setEstimateAmount(e.target.value)}
                      required
                      autoFocus
                      className="h-9 text-sm font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="inline-estimate-notes" className="text-[11px] font-semibold text-foreground">
                      Optional Short Note
                    </label>
                    <Input
                      id="inline-estimate-notes"
                      type="text"
                      placeholder="e.g. Includes standard service, inspection & parts"
                      value={estimateNotes}
                      onChange={(e) => setEstimateNotes(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      type="submit"
                      disabled={isSubmitting || !estimateAmount}
                      className="flex-1 text-xs font-semibold py-2 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Submit ₹{estimateAmount || "0"} Estimate
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEstimateForm(false)}
                      disabled={isSubmitting}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              {/* State 0: WORKER_UNAVAILABLE or NOT_SELECTED -> Request Closed */}
              {!showEstimateForm && isUnavailable && (
                <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-600/40 text-xs text-amber-900 dark:text-amber-200 space-y-1.5 w-full">
                  <div className="flex items-center font-bold text-amber-800 dark:text-amber-300">
                    <AlertCircle className="h-4 w-4 mr-1.5 text-amber-600 shrink-0" />
                    Request No Longer Actionable
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-amber-200/80">
                    {job.status === "WORKER_UNAVAILABLE"
                      ? "You are currently allocated to an active customer booking. Estimates cannot be submitted while allocated."
                      : "Another worker was confirmed for this service request."}
                  </p>
                </div>
              )}

              {/* State 1: PENDING / REQUEST_SENT / REVIEWING -> Worker chooses [Interested / Accept] or [Decline] */}
              {!showEstimateForm && (isRequestSent || isReviewing) && (
                <div className="space-y-2.5 w-full">
                  <div className="flex gap-2">
                    <Button
                      onClick={handleInterestedClick}
                      disabled={isSubmitting}
                      className="flex-1 text-xs font-semibold py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Interested / Accept
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDecline}
                      disabled={isSubmitting}
                      className="flex-1 text-xs font-semibold py-2.5 border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400"
                    >
                      Decline
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                    Choose &ldquo;Interested / Accept&rdquo; to enter your quotation, or &ldquo;Decline&rdquo; if unavailable.
                  </p>
                </div>
              )}

              {/* State 2: ESTIMATE_SUBMITTED / WORKER_INTERESTED / CUSTOMER_CONFIRMATION_PENDING */}
              {!showEstimateForm && isInterestSent && (
                <div className="space-y-2.5 w-full">
                  {job.workerEstimateAmount ? (
                    <div className="p-3.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-600/40 text-xs space-y-2 w-full">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-600 shrink-0" />
                          Estimate Submitted
                        </span>
                        <Badge variant="outline" className="text-[11px] font-bold font-mono border-emerald-600 text-emerald-700 dark:text-emerald-300">
                          {formatINR(job.workerEstimateAmount)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground border-t pt-1.5">
                        <div>Labour: <strong className="text-foreground">{formatINR(job.workerEstimateLabor || Math.round(job.workerEstimateAmount * 0.7))}</strong></div>
                        <div>Materials: <strong className="text-foreground">{formatINR(job.workerEstimateMaterials || Math.round(job.workerEstimateAmount * 0.3))}</strong></div>
                      </div>
                      {job.workerEstimateNotes && (
                        <p className="text-[11px] text-muted-foreground italic border-t pt-1">
                          &ldquo;{job.workerEstimateNotes}&rdquo;
                        </p>
                      )}
                      <div className="flex gap-2 pt-1 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowEstimateForm(true)}
                          className="flex-1 text-xs border-emerald-600/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/50"
                        >
                          <Edit3 className="h-3.5 w-3.5 mr-1" />
                          Update Estimate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleDecline}
                          disabled={isSubmitting}
                          className="text-xs text-rose-600 hover:bg-rose-50"
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-600/40 text-xs text-emerald-900 dark:text-emerald-200 space-y-1.5 w-full">
                        <div className="flex items-center font-bold text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600 shrink-0" />
                          Interested / Accepted
                        </div>
                        <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-emerald-200/80">
                          Enter your quotation amount so the customer can review and confirm.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => setShowEstimateForm(true)}
                          className="flex-1 text-xs font-semibold py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                        >
                          <Calculator className="h-3.5 w-3.5 mr-1.5" />
                          Enter Estimate
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleDecline}
                          disabled={isSubmitting}
                          className="text-xs text-rose-600 border-rose-300"
                        >
                          Decline
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* State 4: Already Confirmed */}
              {isConfirmedOrBeyond && (
                <div className="space-y-3 w-full">
                  <div className="p-3.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-600/40 text-xs text-blue-900 dark:text-blue-200 space-y-1.5 w-full">
                    <div className="flex items-center font-bold text-blue-800 dark:text-blue-300">
                      <CheckCircle2 className="h-4 w-4 mr-1.5 text-blue-600 shrink-0" />
                      Booking Confirmed
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-blue-200/80">
                      This booking has been confirmed by the customer and is active on your schedule.
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push(`/worker/jobs/${job.id}`)}
                    className="w-full text-xs font-semibold py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Open Active Job Execution
                  </Button>
                </div>
              )}

              {/* Secondary CTA: Return / Leave Request without expressing interest */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/worker/schedule?tab=requests")}
                className="w-full text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Return to Requests
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Full Photo Modal */}
      {showPhotoModal && job?.problemPhotoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowPhotoModal(false)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh] bg-card rounded-2xl overflow-hidden shadow-2xl border border-border flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 px-4 border-b border-border flex items-center justify-between bg-muted/30">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-emerald-600" />
                Customer Problem Evidence — Request #{job.bookingNumber}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded-full"
                onClick={() => setShowPhotoModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-2 overflow-auto max-h-[75vh] flex items-center justify-center bg-black/5 dark:bg-black/40">
              {/* eslint-disable-next-html-element-attribute */}
              {/* eslint-disable-next-html-element-content-type */}
              <img
                src={job.problemPhotoUrl}
                alt="Customer Problem Evidence Full View"
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="p-3 border-t border-border flex items-center justify-between bg-muted/10 text-xs">
              <span className="text-muted-foreground text-[11px]">
                Inspect damage or parts requirement before preparing estimate
              </span>
              <a
                href={job.problemPhotoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-emerald-600 hover:underline"
              >
                Open in new tab
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
