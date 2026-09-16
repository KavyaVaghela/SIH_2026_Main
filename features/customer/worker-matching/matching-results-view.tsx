"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { RequestSummaryCard } from "./components/request-summary-card";
import { MatchingExplanationBanner } from "./components/matching-explanation-banner";
import { SortFilterBar, WorkerSortOption } from "./components/sort-filter-bar";
import { WorkerCard } from "./components/worker-card";
import { loadBookingDraft, ServiceBookingDraft } from "@/features/customer/service-booking/types";
import { matchingService, WorkerMatchResult } from "@/features/matching/services/matching-service";
import { multiWorkerService } from "@/features/customer/services/multi-worker-service";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, ArrowLeft, CheckCircle2, Users, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export function MatchingResultsView() {
  const router = useRouter();

  const [draft, setDraft] = React.useState<ServiceBookingDraft | null>(null);
  const [hasDraftLoaded, setHasDraftLoaded] = React.useState(false);
  const [matches, setMatches] = React.useState<WorkerMatchResult[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [requestLoading, setRequestLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sortOption, setSortOption] = React.useState<WorkerSortOption>("best_match");
  
  // Phase 3 Multi-Worker Selection Set
  const [selectedWorkerIds, setSelectedWorkerIds] = React.useState<Set<string>>(new Set());

  const fetchMatches = React.useCallback(async (d: ServiceBookingDraft) => {
    setLoading(true);
    setError(null);
    try {
      const results = await matchingService.findEligibleWorkers({
        categoryId: d.category?.id,
        categoryName: d.category?.name,
        serviceId: d.service?.id,
        subServiceTitle: d.service?.title,
        customerLatitude: 23.0300, // Satellite, Ahmedabad default
        customerLongitude: 72.5178,
        scheduledStartAt: d.preferredDate,
        maxRadiusKm: 25,
      });
      setMatches(results);

      // Pre-select top 3 best matching workers by default for convenience if available
      if (results.length > 0) {
        const topIds = results.slice(0, Math.min(3, results.length)).map((m) => m.worker.id);
        setSelectedWorkerIds(new Set(topIds));
      }
    } catch (err) {
      console.error("Failed to fetch worker matches", err);
      setError("We couldn't load worker matches right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // 1. Initial Draft Loading
  React.useEffect(() => {
    const d = loadBookingDraft();
    setDraft(d);
    setHasDraftLoaded(true);

    if (d && d.category && d.service) {
      fetchMatches(d);
    } else {
      setLoading(false);
    }
  }, [fetchMatches]);

  // 2. Realtime listener for worker status & availability updates
  React.useEffect(() => {
    if (!draft || !draft.category || !draft.service) return;

    const supabase = createClient();
    const channel = supabase
      .channel("matching_workers_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workers" },
        () => {
          fetchMatches(draft);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [draft, fetchMatches]);

  // Sorted Workers
  const sortedMatches = React.useMemo(() => {
    const list = [...matches];
    if (sortOption === "best_match") {
      return list.sort((a, b) => b.matchScore - a.matchScore);
    }
    if (sortOption === "nearest") {
      return list.sort((a, b) => a.tierBreakdown.distanceKm - b.tierBreakdown.distanceKm);
    }
    if (sortOption === "highest_rated") {
      return list.sort((a, b) => b.worker.extendedProfile.rating - a.worker.extendedProfile.rating);
    }
    if (sortOption === "most_experienced") {
      return list.sort((a, b) => b.worker.experienceYears - a.worker.experienceYears);
    }
    return list;
  }, [matches, sortOption]);

  const handleViewProfile = (workerId: string) => {
    router.push(`/customer/find-worker/${workerId}`);
  };

  // Toggle selection for a worker
  const handleToggleWorker = (workerId: string) => {
    setSelectedWorkerIds((prev) => {
      const next = new Set(prev);
      if (next.has(workerId)) {
        next.delete(workerId);
      } else {
        next.add(workerId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allIds = matches.map((m) => m.worker.id);
    setSelectedWorkerIds(new Set(allIds));
  };

  const handleDeselectAll = () => {
    setSelectedWorkerIds(new Set());
  };

  // Phase 3 Multi-Worker Request Submission
  const handleRequestSelectedWorkers = async () => {
    if (selectedWorkerIds.size === 0) {
      setError("Please select at least one worker to send your service request.");
      return;
    }

    if (requestLoading) return; // Prevent double submission
    setRequestLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const customerId = (user?.id && user.id !== "70fbdb46-120f-459e-a616-67b4f676f5d0")
        ? user.id
        : "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";

      // Resolve valid Service ID
      let serviceId = draft?.service?.id;
      if (!serviceId || serviceId.startsWith("srv-")) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: srv } = await (supabase.from("services") as any)
          .select("id")
          .ilike("title", `%${draft?.service?.title || "Tap Repair"}%`)
          .limit(1)
          .maybeSingle();
        if (srv?.id) serviceId = srv.id;
      }

      const scheduledStartAt = draft?.preferredDate || new Date(Date.now() + 86400000).toISOString();

      const result = await multiWorkerService.createMultiWorkerRequest({
        customerId,
        serviceId: serviceId || "a510e2c8-5ee9-4b01-abfc-a2a101ea729e",
        description: draft?.description || "Service requested by customer",
        preferredSchedule: scheduledStartAt,
        workerIds: Array.from(selectedWorkerIds),
      });

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("kaushalyasetu_booking_draft");
      }

      // Navigate to dedicated Competing Estimates comparison view
      router.push(`/customer/requests/${result.requestId}`);
    } catch (err: any) {
      console.error("Failed to create multi-worker request", err);
      setError(err?.message || "Unable to send your request right now. Please try again.");
      setRequestLoading(false);
    }
  };

  const handleModifyBooking = () => {
    router.push("/customer/book");
  };

  // Guard: If accessed without draft after initialization, display helpful empty state
  if (hasDraftLoaded && (!draft || !draft.category || !draft.service)) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-12 px-4">
        <PageHeader
          title="Find a Verified Worker"
          description="We match verified cooperative workers based on your service requirements."
          breadcrumbs={[
            { label: "Customer Portal", href: "/customer" },
            { label: "Service Booking", href: "/customer/book" },
            { label: "Find Worker" },
          ]}
        />

        <Card className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 shadow-sm">
          <div className="p-3 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-full w-12 h-12 mx-auto flex items-center justify-center border border-amber-200 dark:border-amber-800">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Please create a service request first.
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              To find and match eligible cooperative workers, please select your trade category, specific service, and address first.
            </p>
          </div>

          <div className="pt-2">
            <Button
              onClick={() => router.push("/customer/book")}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-5"
            >
              Create Service Request
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-28">
      <PageHeader
        title="Find a Verified Cooperative Worker"
        description="We matched verified cooperative workers based on your service, location, and preferred time."
        breadcrumbs={[
          { label: "Customer Portal", href: "/customer" },
          { label: "Service Booking", href: "/customer/book" },
          { label: "Find Worker" },
        ]}
      />

      {/* Booking Requirement Summary */}
      <RequestSummaryCard draft={draft} onEditClick={handleModifyBooking} />

      {/* 6-Tier Matching Explanation Banner */}
      <MatchingExplanationBanner />

      {/* Sort & Filter Bar with Multi-select controls */}
      <div className="space-y-3">
        <SortFilterBar
          currentSort={sortOption}
          onSortChange={setSortOption}
          resultCount={sortedMatches.length}
        />

        {sortedMatches.length > 0 && (
          <div className="flex items-center justify-between px-1 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Select workers to request competing estimates:
              </span>
              <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full text-[11px]">
                {selectedWorkerIds.size} selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-emerald-700 dark:text-emerald-400 hover:underline font-medium"
              >
                Select All
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-slate-500 hover:underline font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
          <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Finding verified cooperative workers...
          </p>
          <p className="text-xs text-slate-400">
            Evaluating skill match, location radius, availability slots, and workforce distribution in Ahmedabad
          </p>
        </Card>
      )}

      {/* Error State */}
      {!loading && error && (
        <Card className="p-6 text-center bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl space-y-3">
          <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
          <p className="text-sm font-bold text-rose-900 dark:text-rose-200">
            {error}
          </p>
          <Button
            size="sm"
            onClick={() => {
              if (draft) fetchMatches(draft);
            }}
            className="text-xs bg-rose-700 hover:bg-rose-800 text-white"
          >
            Retry Matching
          </Button>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && sortedMatches.length === 0 && (
        <Card className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-full w-12 h-12 mx-auto flex items-center justify-center border border-amber-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No eligible workers found for this service and time.
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try another time slot, expand your service area, or choose another service trade requirement.
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleModifyBooking}
              className="text-xs border-slate-300"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Change Date / Time
            </Button>
          </div>
        </Card>
      )}

      {/* Matched Workers Grid with Checkbox Selection */}
      {!loading && !error && sortedMatches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedMatches.map((match) => (
            <WorkerCard
              key={match.worker.id}
              matchResult={match}
              isSelected={selectedWorkerIds.has(match.worker.id)}
              onViewProfile={handleViewProfile}
              onToggleSelect={handleToggleWorker}
            />
          ))}
        </div>
      )}

      {/* Sticky Bottom Action Bar (Phase 3 Multi-Worker Request) */}
      {!loading && sortedMatches.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-4 shadow-lg">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {selectedWorkerIds.size === 1
                      ? "1 worker selected"
                      : `${selectedWorkerIds.size} workers selected`}
                  </span>
                  {selectedWorkerIds.size > 0 && (
                    <span className="flex items-center text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold gap-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Ready to request bids
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Workers will receive your job details and submit itemized competitive estimates.
                </p>
              </div>
            </div>

            <Button
              size="lg"
              disabled={requestLoading || selectedWorkerIds.size === 0}
              onClick={handleRequestSelectedWorkers}
              className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm px-6 py-2.5 shadow-sm gap-2"
            >
              {requestLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending Requests...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Request Selected Workers
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
