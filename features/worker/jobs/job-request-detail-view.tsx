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
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/formatters/currency";
import { workerJobService } from "../services/worker-job-service";
import { CANONICAL_STATUS_LABELS, type WorkerJobItem, type BookingStatusHistoryItem } from "../types";

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

  const loadDetails = React.useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [data, hist] = await Promise.all([
        workerJobService.getJobDetails(requestId),
        workerJobService.getStatusHistory(requestId),
      ]);
      if (data) {
        setJob(data);
        setHistory(hist);
      } else {
        setActionError("Job request not found.");
      }
    } catch (err) {
      console.error("Error loading job details", err);
      setActionError("Failed to load job request details.");
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  React.useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  // Action 1: Worker Reviews Request (REQUEST_SENT -> WORKER_REVIEWING)
  const handleReview = async () => {
    if (!job || isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccessMessage(null);
    try {
      const updated = await workerJobService.reviewJobRequest(job.id, "w-1");
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

  // Action 2: Worker Expresses Interest (WORKER_REVIEWING -> WORKER_INTERESTED -> CUSTOMER_CONFIRMATION_PENDING)
  const handleExpressInterest = async () => {
    if (!job || isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccessMessage(null);
    try {
      const updated = await workerJobService.expressInterestInJob(job.id, "w-1");
      const updatedHist = await workerJobService.getStatusHistory(job.id);
      setJob(updated);
      setHistory(updatedHist);
      setActionSuccessMessage("Interest sent! The customer can now review your interest and confirm the booking.");
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

  const isRequestSent = job.status === "REQUEST_SENT";
  const isReviewing = job.status === "WORKER_REVIEWING";
  const isInterestSent = job.status === "WORKER_INTERESTED" || job.status === "CUSTOMER_CONFIRMATION_PENDING";
  const isConfirmedOrBeyond =
    job.status === "BOOKING_CONFIRMED" ||
    job.status === "WORKER_ACCEPTED" ||
    job.status === "SERVICE_STARTED" ||
    job.status === "BOOKING_COMPLETED";

  const getStatusBadgeVariant = () => {
    if (isRequestSent) return "outline";
    if (isReviewing) return "warning";
    if (isInterestSent) return "secondary";
    if (isConfirmedOrBeyond) return "success";
    return "outline";
  };

  const statusDisplayLabel =
    isRequestSent ? "New Request" :
    isReviewing ? "Under Review" :
    isInterestSent ? "Interest Sent — Waiting for Customer" :
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

            {/* Task 3 & Task 4 Interactive Actions */}
            <CardFooter className="p-4 sm:p-5 border-t bg-muted/20 flex flex-col gap-3">
              {/* State 1: REQUEST_SENT -> Worker Reviews Request */}
              {isRequestSent && (
                <div className="space-y-2.5 w-full">
                  <Button
                    onClick={handleReview}
                    disabled={isSubmitting}
                    className="w-full text-xs font-semibold py-2.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Review Request
                  </Button>
                  <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                    Clicking &ldquo;Review Request&rdquo; acknowledges receipt and changes status to Under Review.
                  </p>
                </div>
              )}

              {/* State 2: WORKER_REVIEWING -> Worker Expresses Interest */}
              {isReviewing && (
                <div className="space-y-2.5 w-full">
                  <Button
                    onClick={handleExpressInterest}
                    disabled={isSubmitting}
                    className="w-full text-xs font-semibold py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Interested in This Job
                  </Button>
                  <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                    Express interest to notify the customer that you are available and ready to take this assignment.
                  </p>
                </div>
              )}

              {/* State 3: WORKER_INTERESTED / CUSTOMER_CONFIRMATION_PENDING */}
              {isInterestSent && (
                <div className="space-y-2.5 w-full">
                  {job.workerEstimateAmount ? (
                    <div className="p-3.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-600/40 text-xs space-y-2 w-full">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-600 shrink-0" />
                          Estimate Submitted
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono border-emerald-600 text-emerald-700 dark:text-emerald-300">
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/worker/jobs/requests/${job.id}/estimate`)}
                        className="w-full text-xs mt-1 border-emerald-600/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/50"
                      >
                        <Edit3 className="h-3.5 w-3.5 mr-1" />
                        View / Update Estimate
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-600/40 text-xs text-emerald-900 dark:text-emerald-200 space-y-1.5 w-full">
                        <div className="flex items-center font-bold text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600 shrink-0" />
                          Interest Sent to Customer
                        </div>
                        <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-emerald-200/80">
                          Prepare and submit your itemized quotation so the customer can review and confirm.
                        </p>
                      </div>

                      <Button
                        onClick={() => router.push(`/worker/jobs/requests/${job.id}/estimate`)}
                        className="w-full text-xs font-semibold py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                      >
                        <Calculator className="h-3.5 w-3.5 mr-1.5" />
                        Create Service Estimate
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* State 4: Already Confirmed */}
              {isConfirmedOrBeyond && (
                <div className="p-3.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-600/40 text-xs text-blue-900 dark:text-blue-200 space-y-1.5 w-full">
                  <div className="flex items-center font-bold text-blue-800 dark:text-blue-300">
                    <CheckCircle2 className="h-4 w-4 mr-1.5 text-blue-600 shrink-0" />
                    Booking Confirmed
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-blue-200/80">
                    This booking has been confirmed by the customer and is active on your schedule.
                  </p>
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
    </div>
  );
}
