"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Star,
  Briefcase,
  Award,
  MapPin,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Phone,
  UserCheck,
} from "lucide-react";
import { matchingService, WorkerMatchResult } from "@/features/matching/services/matching-service";
import { bookingService } from "@/features/bookings/services/booking-service";
import { loadBookingDraft, saveBookingDraft, ServiceBookingDraft } from "@/features/customer/service-booking/types";

export interface WorkerProfileViewProps {
  workerId: string;
}

export function WorkerProfileView({ workerId }: WorkerProfileViewProps) {
  const router = useRouter();

  const [matchResult, setMatchResult] = React.useState<WorkerMatchResult | null>(null);
  const [draft, setDraft] = React.useState<ServiceBookingDraft | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [requestLoading, setRequestLoading] = React.useState(false);
  const [isSelected, setIsSelected] = React.useState(false);

  React.useEffect(() => {
    const d = loadBookingDraft();
    setDraft(d);

    if (d?.selectedWorkerId === workerId) {
      setIsSelected(true);
    }

    matchingService.getWorkerProfileById(workerId).then((res) => {
      setMatchResult(res);
      setLoading(false);
    });
  }, [workerId]);

  const handleSelectAndRequestWorker = async () => {
    setIsSelected(true);
    if (draft) {
      const updated = { ...draft, selectedWorkerId: workerId };
      saveBookingDraft(updated);
    }

    setRequestLoading(true);
    try {
      const p = matchResult?.worker.extendedProfile;

      const newBooking = await bookingService.createRequest({
        customerId: "cust-1",
        workerId,
        serviceId: draft?.service?.id || "srv-p1",
        federationId: matchResult?.worker.federationId || "fed-ahmedabad-1",
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
    } finally {
      setRequestLoading(false);
    }
  };

  const handleBackToMatches = () => {
    router.push("/customer/find-worker");
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 rounded-xl space-y-3">
        <p className="text-xs text-slate-500 animate-pulse">Loading worker profile...</p>
      </div>
    );
  }

  if (!matchResult) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 rounded-xl space-y-3">
        <p className="text-xs text-slate-500">Worker profile not found.</p>
        <Button size="sm" onClick={handleBackToMatches} className="text-xs">
          Back to Matches
        </Button>
      </div>
    );
  }

  const { worker, matchScore, tierBreakdown } = matchResult;
  const p = worker.extendedProfile;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title={p.fullName}
        description={`Verified Trade Worker • ${p.cooperativeName}`}
        breadcrumbs={[
          { label: "Customer Portal", href: "/customer" },
          { label: "Find Worker", href: "/customer/find-worker" },
          { label: p.fullName },
        ]}
      />

      {/* Main Profile Header Card */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5 md:p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            {p.avatarUrl ? (
              /* eslint-disable-next-html-element-content-type */
              /* eslint-disable-next-html-element-attribute */
              <img
                src={p.avatarUrl}
                alt={p.fullName}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-emerald-500 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-2xl border-4 border-emerald-500">
                {p.fullName.charAt(0)}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {p.fullName}
                </h1>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-bold gap-1 py-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Worker
                </Badge>
              </div>

              <p className="text-xs md:text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                {p.primarySkill}
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {p.cooperativeName}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Badge className="bg-emerald-700 text-white text-xs px-3 py-1 font-bold">
              {matchScore}% Match Score
            </Badge>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" /> Available for Selected Time Slot
            </span>
          </div>
        </div>

        {/* 4-Metric Highlight Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Rating
            </span>
            <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">{p.rating} / 5.0</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" /> Jobs Done
            </span>
            <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">{p.completedJobsCount} Jobs</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-600" /> Experience
            </span>
            <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">{p.experienceYears} Years</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Distance
            </span>
            <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">{tierBreakdown.distanceKm} km</p>
          </div>
        </div>

        {/* Bio & Professional Summary */}
        <div className="space-y-2 pt-1">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            About Worker
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            {p.bio}
          </p>
        </div>

        {/* Skills & Spoken Languages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Trade Skills & Specializations
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {p.secondarySkills?.map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs py-1"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 mr-1" />
                  {s}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Spoken Languages
            </h4>
            <div className="flex flex-wrap gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
              {p.languages.map((l) => (
                <span
                  key={l}
                  className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Guidance (Customer Protected) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>Direct phone contact unlocked after worker request confirmation.</span>
          </div>
          <Badge variant="outline" className="text-[10px] text-slate-500">
            Privacy Protected
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToMatches}
            className="text-xs border-slate-300 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Matches
          </Button>

          <Button
            disabled={requestLoading}
            onClick={handleSelectAndRequestWorker}
            className={`text-xs font-bold px-6 gap-2 ${
              isSelected
                ? "bg-emerald-900 text-white"
                : "bg-emerald-700 hover:bg-emerald-800 text-white"
            }`}
          >
            {isSelected ? <UserCheck className="w-4 h-4" /> : null}
            {requestLoading
              ? "Sending Request..."
              : isSelected
              ? "Request Dispatched"
              : "Request This Worker"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
