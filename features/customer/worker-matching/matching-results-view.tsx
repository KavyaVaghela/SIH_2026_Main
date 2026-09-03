"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { RequestSummaryCard } from "./components/request-summary-card";
import { MatchingExplanationBanner } from "./components/matching-explanation-banner";
import { SortFilterBar, WorkerSortOption } from "./components/sort-filter-bar";
import { WorkerCard } from "./components/worker-card";
import { loadBookingDraft, saveBookingDraft, ServiceBookingDraft } from "@/features/customer/service-booking/types";
import { matchingService, WorkerMatchResult } from "@/features/matching/services/matching-service";
import { bookingService } from "@/features/bookings/services/booking-service";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export function MatchingResultsView() {
  const router = useRouter();

  const [draft, setDraft] = React.useState<ServiceBookingDraft | null>(null);
  const [matches, setMatches] = React.useState<WorkerMatchResult[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [requestLoading, setRequestLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sortOption, setSortOption] = React.useState<WorkerSortOption>("best_match");
  const [selectedWorkerId, setSelectedWorkerId] = React.useState<string | null>(null);

  // Load booking draft and trigger matching
  React.useEffect(() => {
    const d = loadBookingDraft();
    setDraft(d);

    if (d?.selectedWorkerId) {
      setSelectedWorkerId(d.selectedWorkerId);
    }

    const fetchMatches = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await matchingService.findEligibleWorkers({
          categoryId: d?.category?.id || "cat-plumbing",
          serviceId: d?.service?.id,
          customerLatitude: 23.0300, // Satellite, Ahmedabad
          customerLongitude: 72.5178,
          maxRadiusKm: 15,
        });
        setMatches(results);
      } catch (err) {
        console.error("Failed to fetch worker matches", err);
        setError("We couldn't load worker matches right now. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

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

  const handleRequestWorker = async (workerId: string) => {
    setSelectedWorkerId(workerId);
    if (draft) {
      const updatedDraft = { ...draft, selectedWorkerId: workerId };
      setDraft(updatedDraft);
      saveBookingDraft(updatedDraft);
    }

    // Create real booking request in bookingService
    setRequestLoading(true);
    try {
      const matched = matches.find((m) => m.worker.id === workerId);
      const p = matched?.worker.extendedProfile;

      const newBooking = await bookingService.createRequest({
        customerId: "cust-1", // Logged in customer ID
        workerId,
        serviceId: draft?.service?.id || "srv-p1",
        federationId: matched?.worker.federationId || "fed-ahmedabad-1",
        addressId: draft?.address?.id || "addr-1",
        problemDescription: draft?.description || "Tap leakage fix required",
        problemPhotoUrl: draft?.photoUrl || undefined,
        scheduledStartAt: draft?.preferredDate || new Date().toISOString().split("T")[0],
        scheduledEndAt: draft?.preferredDate || new Date().toISOString().split("T")[0],
        totalAmount: draft?.estimate?.estimatedTotal || 350,
        serviceTitle: draft?.service?.title || "Tap Repair & Leak Fix",
        categoryName: draft?.category?.name || "Plumbing & Drainage",
        workerName: p?.fullName || "Ramesh Patel",
        workerAvatarUrl: p?.avatarUrl || undefined,
        workerPhone: p?.phone || "+91 98250 11021",
        cooperativeName: p?.cooperativeName || "Satellite Artisans Cooperative Society",
        addressText: draft?.address ? `${draft.address.addressLine1}, ${draft.address.city}` : "Satellite, Ahmedabad",
      });

      router.push(`/customer/bookings/${newBooking.id}`);
    } catch (err) {
      console.error("Failed to create booking request", err);
      setError("Unable to send your request right now. Please try again.");
    } finally {
      setRequestLoading(false);
    }
  };

  const handleModifyBooking = () => {
    router.push("/customer/book");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
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

      {/* Sort & Filter Bar */}
      <SortFilterBar
        currentSort={sortOption}
        onSortChange={setSortOption}
        resultCount={sortedMatches.length}
      />

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
            onClick={() => window.location.reload()}
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

      {/* Matched Workers Grid */}
      {!loading && !error && sortedMatches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedMatches.map((match) => (
            <WorkerCard
              key={match.worker.id}
              matchResult={match}
              isSelected={selectedWorkerId === match.worker.id}
              onViewProfile={handleViewProfile}
              onRequestWorker={handleRequestWorker}
            />
          ))}
        </div>
      )}

      {/* Selected Worker Task 4 Request Banner */}
      {selectedWorkerId && (
        <Card className="bg-emerald-900 text-white p-5 rounded-xl shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Worker Selected</h4>
              <p className="text-xs text-emerald-200 mt-0.5">
                Worker selection saved into booking draft. Ready to dispatch real booking request.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            disabled={requestLoading}
            onClick={() => handleRequestWorker(selectedWorkerId)}
            className="bg-white text-emerald-950 hover:bg-emerald-50 font-bold text-xs px-5 py-2"
          >
            {requestLoading ? "Sending Request..." : "Dispatch Service Request"}
          </Button>
        </Card>
      )}
    </div>
  );
}
