"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import {
  multiWorkerService,
  ServiceRequestSummary,
  CompetingWorkerEstimate,
} from "@/features/customer/services/multi-worker-service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Star,
  Briefcase,
  Award,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowLeft,
  XCircle,
  DollarSign,
  TrendingDown,
  UserCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface CompetingEstimatesViewProps {
  requestId: string;
}

export function CompetingEstimatesView({ requestId }: CompetingEstimatesViewProps) {
  const router = useRouter();

  const [summary, setSummary] = React.useState<ServiceRequestSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Confirmation Modal State
  const [confirmingWorker, setConfirmingWorker] = React.useState<CompetingWorkerEstimate | null>(null);
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [confirmationError, setConfirmationError] = React.useState<string | null>(null);

  // 1. Fetch Summary Data
  const loadData = React.useCallback(
    async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      setError(null);
      try {
        const data = await multiWorkerService.getRequestDetails(requestId);
        if (data) {
          setSummary(data);
        } else {
          setError("Service request not found.");
        }
      } catch (err: any) {
        console.error("Failed to load service request details:", err);
        setError("Unable to load competing estimates right now.");
      } finally {
        if (!isBackground) setLoading(false);
      }
    },
    [requestId]
  );

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // 2. Realtime Subscriptions (Broadcast Channel + Postgres Changes CDC)
  React.useEffect(() => {
    const supabase = createClient();

    // Broadcast channel listener (zero-latency updates)
    const channelName = `request_estimates_${requestId}`;
    const broadcastChannel = supabase
      .channel(channelName)
      .on("broadcast", { event: "new_estimate" }, (event) => {
        console.log("Realtime broadcast new estimate received:", event.payload);
        loadData(true);
      })
      .on("broadcast", { event: "worker_interested" }, () => {
        loadData(true);
      })
      .on("broadcast", { event: "worker_declined" }, () => {
        loadData(true);
      })
      .on("broadcast", { event: "worker_confirmed" }, (event) => {
        console.log("Realtime worker confirmed event:", event.payload);
        loadData(true);
      })
      .subscribe();

    // Postgres CDC listener on worker_estimates
    const cdcChannel = supabase
      .channel(`cdc_estimates_${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "worker_estimates",
          filter: `job_request_id=eq.${requestId}`,
        },
        () => {
          loadData(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(broadcastChannel);
      supabase.removeChannel(cdcChannel);
    };
  }, [requestId, loadData]);

  // 3. Periodic Background Refresh Fallback while awaiting estimates
  React.useEffect(() => {
    if (summary?.status === "CONFIRMED" || summary?.status === "CANCELLED" || summary?.allDeclined) {
      return;
    }
    const interval = setInterval(() => {
      loadData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [summary?.status, summary?.allDeclined, loadData]);

  // Handle worker confirmation
  const handleConfirmWorker = async () => {
    if (!confirmingWorker || !summary || isConfirming) return;
    setIsConfirming(true);
    setConfirmationError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const customerId = user?.id || summary.customerId;

      const result = await multiWorkerService.confirmSelectedWorker(
        requestId,
        confirmingWorker.workerId,
        customerId
      );

      // Successfully confirmed -> Navigate to canonical booking lifecycle
      router.push(`/customer/bookings/${result.bookingId}`);
    } catch (err: any) {
      console.error("Failed to confirm worker:", err);
      setConfirmationError(
        err?.message || "Failed to confirm worker. Please try again."
      );
      setIsConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-10 px-4">
        <PageHeader
          title="Competing Worker Estimates"
          description="Gathering competitive estimates from matched cooperative workers in real-time."
          breadcrumbs={[
            { label: "Customer Portal", href: "/customer" },
            { label: "My Requests", href: "/customer/my-bookings" },
            { label: "Competing Estimates" },
          ]}
        />
        <Card className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Connecting to Realtime Workforce Queue...
          </h3>
          <p className="text-xs text-slate-400">
            Awaiting estimates and availability responses from requested workers.
          </p>
        </Card>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-10 px-4">
        <PageHeader
          title="Service Request"
          description="Could not locate the requested service request."
          breadcrumbs={[
            { label: "Customer Portal", href: "/customer" },
            { label: "Service Booking", href: "/customer/book" },
          ]}
        />
        <Card className="p-8 text-center bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl space-y-4">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">
            {error || "Request Not Found"}
          </h3>
          <div className="pt-2">
            <Button
              onClick={() => router.push("/customer/book")}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
            >
              Create New Request
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const isConfirmed = summary.status === "CONFIRMED";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      <PageHeader
        title={`Service Request #${summary.requestNumber}`}
        description={`${summary.categoryName} • ${summary.serviceTitle}`}
        breadcrumbs={[
          { label: "Customer Portal", href: "/customer" },
          { label: "My Requests", href: "/customer/my-bookings" },
          { label: summary.requestNumber },
        ]}
      />

      {/* Top Banner: Service Details & Live Summary Stats */}
      <Card className="p-5 md:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                {summary.categoryName}
              </span>
              <span>•</span>
              <span className="text-xs text-slate-500 font-medium">
                {summary.serviceTitle}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              &quot;{summary.description}&quot;
            </p>
            {summary.preferredSchedule && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Requested for:{" "}
                  {new Date(summary.preferredSchedule).toLocaleDateString("en-IN", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="shrink-0">
            {isConfirmed ? (
              <Badge className="bg-emerald-700 text-white font-bold text-xs py-1 px-3 gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Worker Confirmed
              </Badge>
            ) : summary.allDeclined ? (
              <Badge variant="destructive" className="font-bold text-xs py-1 px-3 gap-1">
                <XCircle className="w-3.5 h-3.5" />
                All Workers Declined
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 font-bold text-xs py-1 px-3 gap-1">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                Awaiting Estimates
              </Badge>
            )}
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block uppercase font-medium">
              Workers Requested
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {summary.totalRequested}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block uppercase font-medium">
              Responded
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {summary.totalResponded}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block uppercase font-medium">
              Estimates Received
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {summary.totalEstimates}
            </span>
          </div>

          {/* Dynamic Best Estimate Metric */}
          <div className="bg-emerald-50 dark:bg-emerald-950/70 p-3 rounded-lg border border-emerald-300 dark:border-emerald-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Best Estimate
              </span>
              {summary.bestEstimate && (
                <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
              )}
            </div>
            <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
              {summary.bestEstimate ? `₹${summary.bestEstimate}` : "—"}
            </span>
          </div>
        </div>
      </Card>

      {/* Competing Estimates Section Title */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Worker Quotations &amp; Estimates
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Workers submit itemized rates independently. Realtime updates are active without page refresh.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => loadData(true)}
          className="text-xs border-slate-300 dark:border-slate-700 h-8 gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Case 1: All Workers Declined Empty State */}
      {summary.allDeclined && (
        <Card className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-full w-12 h-12 mx-auto flex items-center justify-center border border-amber-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No workers are currently available for this request.
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              All requested workers are currently occupied with other active jobs or unavailable for this scheduled slot.
            </p>
          </div>
          <div className="pt-2">
            <Button
              onClick={() => router.push("/customer/book")}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-5"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Return to Worker Matching
            </Button>
          </div>
        </Card>
      )}

      {/* Case 2: No Estimates Yet but Requests are Pending */}
      {!summary.allDeclined && summary.totalEstimates === 0 && (
        <Card className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
          <Clock className="w-7 h-7 text-emerald-600 animate-pulse mx-auto" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            No workers have submitted an estimate yet.
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Your request has been dispatched to {summary.totalRequested} workers. As soon as any worker reviews your requirements and enters an estimate, this list will update automatically.
          </p>
        </Card>
      )}

      {/* Competing Worker Cards List */}
      <div className="space-y-4">
        {summary.estimates.map((item) => {
          const isBest = summary.bestEstimate && item.estimatedAmount === summary.bestEstimate && item.estimatedAmount > 0;
          const isChosen = item.status === "SELECTED" || summary.selectedWorkerId === item.workerId;
          const isDeclined = item.status === "DECLINED";

          return (
            <Card
              key={item.workerId}
              className={`p-5 transition-all border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                isChosen
                  ? "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-600 ring-2 ring-emerald-500/30"
                  : isBest
                  ? "bg-white dark:bg-slate-900 border-emerald-500 shadow-md ring-1 ring-emerald-400/40"
                  : isDeclined
                  ? "bg-slate-50/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 opacity-60"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              {/* Left Column: Worker Details & Stats */}
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {item.avatarUrl ? (
                    /* eslint-disable-next-html-element-content-type */
                    /* eslint-disable-next-html-element-attribute */
                    <img
                      src={item.avatarUrl}
                      alt={item.workerName}
                      className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xl border-2 border-emerald-500">
                      {item.workerName.charAt(0)}
                    </div>
                  )}
                  {item.isVerified && (
                    <span className="absolute -bottom-1 -right-1 bg-emerald-700 text-white rounded-full p-0.5" title="Verified Cooperative Worker">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      {item.workerName}
                    </h4>

                    {item.isVerified && (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-semibold gap-0.5">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Verified
                      </Badge>
                    )}

                    {isBest && (
                      <Badge className="bg-emerald-700 text-white text-[10px] font-bold gap-1 shadow-xs">
                        <Sparkles className="w-3 h-3" />
                        Best Estimate
                      </Badge>
                    )}

                    {isChosen && (
                      <Badge className="bg-emerald-900 text-emerald-200 text-[10px] font-bold gap-1">
                        <UserCheck className="w-3 h-3" />
                        Selected Worker
                      </Badge>
                    )}
                  </div>

                  {/* Rating, Jobs, Experience Metrics */}
                  <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      {item.isNew || item.reviewsCount === 0 ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded text-[11px]">
                          New (0 reviews)
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {item.rating.toFixed(1)}
                          </span>
                          <span className="text-slate-400">({item.reviewsCount} reviews)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{item.completedJobsCount} completed jobs</span>
                    </div>

                    <div className="hidden sm:flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.experienceYears} yrs exp</span>
                    </div>
                  </div>

                  {/* Worker Notes */}
                  {item.notes && !isDeclined && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-1">
                      &quot;{item.notes}&quot;
                    </p>
                  )}
                  {isDeclined && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium pt-1">
                      Worker declined: {item.notes || "Unavailable"}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Estimate Amount & Actions */}
              <div className="flex items-center md:flex-col md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                <div className="text-left md:text-right">
                  <span className="text-[11px] text-slate-400 block font-medium uppercase">
                    {item.status === "ESTIMATE_SUBMITTED" || isChosen
                      ? "Worker Estimate"
                      : "Request Status"}
                  </span>
                  {item.status === "ESTIMATE_SUBMITTED" || isChosen ? (
                    <div>
                      <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                        ₹{item.estimatedAmount}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 pt-1.5 md:text-right">
                        <div>Labor: <strong className="text-slate-900 dark:text-slate-200">₹{item.laborAmount ?? Math.round(item.estimatedAmount * 0.7)}</strong></div>
                        <div>Materials: <strong className="text-slate-900 dark:text-slate-200">₹{item.materialAmount ?? Math.round(item.estimatedAmount * 0.25)}</strong></div>
                        {(item.additionalCharges || 0) > 0 && (
                          <div>Additional: <strong className="text-slate-900 dark:text-slate-200">₹{item.additionalCharges}</strong></div>
                        )}
                        <div className="pt-0.5 font-bold text-emerald-600 dark:text-emerald-400 text-[10px] uppercase">
                          Status: Submitted
                        </div>
                      </div>
                    </div>
                  ) : isDeclined ? (
                    <span className="text-xs font-bold text-rose-600 uppercase">
                      Declined
                    </span>
                  ) : item.status === "INTERESTED" ? (
                    <span className="text-xs font-bold text-emerald-600 uppercase">
                      Interested • Preparing Estimate
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      Pending Review
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/customer/find-worker/${item.workerId}`)}
                    className="text-xs border-slate-300 dark:border-slate-700 h-8 font-medium"
                  >
                    View Details
                  </Button>

                  {!isConfirmed && !isDeclined && item.status === "ESTIMATE_SUBMITTED" && (
                    <Button
                      size="sm"
                      onClick={() => setConfirmingWorker(item)}
                      className={`text-xs font-bold h-8 px-4 ${
                        isBest
                          ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
                          : "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800"
                      }`}
                    >
                      Select Worker
                    </Button>
                  )}

                  {isChosen && (
                    <Badge className="bg-emerald-800 text-white font-bold text-xs py-1.5 px-3">
                      Assigned Worker
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Confirmation Dialog Modal */}
      {confirmingWorker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Confirm Worker
                </h3>
                <p className="text-xs text-slate-500">
                  Service Request #{summary.requestNumber}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Selected Worker:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {confirmingWorker.workerName}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Agreed Estimate:</span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-base">
                  ₹{confirmingWorker.estimatedAmount}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Once confirmed, this worker will be assigned to your service request, your booking will be confirmed, and other pending requests will be closed.
            </p>

            {confirmationError && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {confirmationError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isConfirming}
                onClick={() => {
                  setConfirmingWorker(null);
                  setConfirmationError(null);
                }}
                className="text-xs"
              >
                Cancel
              </Button>

              <Button
                size="sm"
                disabled={isConfirming}
                onClick={handleConfirmWorker}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-5"
              >
                {isConfirming ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Confirming...
                  </>
                ) : (
                  "Confirm Worker"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
