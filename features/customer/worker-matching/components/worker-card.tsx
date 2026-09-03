"use client";

import * as React from "react";
import {
  ShieldCheck,
  Star,
  Briefcase,
  MapPin,
  Clock,
  Award,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkerMatchResult } from "@/features/matching/services/matching-service";

export interface WorkerCardProps {
  matchResult: WorkerMatchResult;
  onViewProfile: (workerId: string) => void;
  onRequestWorker: (workerId: string) => void;
  isSelected?: boolean;
}

export function WorkerCard({
  matchResult,
  onViewProfile,
  onRequestWorker,
  isSelected,
}: WorkerCardProps) {
  const { worker, matchScore, tierBreakdown } = matchResult;
  const p = worker.extendedProfile;

  return (
    <Card
      className={`p-4 md:p-5 transition-all border rounded-xl flex flex-col justify-between space-y-4 ${
        isSelected
          ? "bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-600 dark:border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-sm"
      }`}
    >
      <div className="space-y-3">
        {/* Top Header: Avatar, Name, Cooperative Society & Match Score Pill */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Avatar with Status Indicator */}
            <div className="relative shrink-0">
              {p.avatarUrl ? (
                /* eslint-disable-next-html-element-content-type */
                /* eslint-disable-next-html-element-attribute */
                <img
                  src={p.avatarUrl}
                  alt={p.fullName}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-lg border-2 border-emerald-500">
                  {p.fullName.charAt(0)}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm md:text-base text-slate-900 dark:text-slate-100">
                  {p.fullName}
                </h3>
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>

              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {p.primarySkill}
              </p>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal line-clamp-1">
                {p.cooperativeName}
              </p>
            </div>
          </div>

          {/* Match Score Badge */}
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 text-[11px] font-extrabold shrink-0 py-1"
          >
            {matchScore}% Match
          </Badge>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 block">{p.rating}</span>
              <span className="text-[9px] text-slate-400 block font-normal">Rating</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 block">{p.completedJobsCount}</span>
              <span className="text-[9px] text-slate-400 block font-normal">Jobs Done</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 block">{p.experienceYears} yrs</span>
              <span className="text-[9px] text-slate-400 block font-normal">Experience</span>
            </div>
          </div>
        </div>

        {/* Location Distance, Availability & Languages */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
          <div className="flex items-center gap-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{tierBreakdown.distanceKm} km away</span>
          </div>

          <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Available for Selected Slot</span>
          </div>
        </div>

        {p.languages.length > 0 && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
            Languages: <span className="font-medium text-slate-700 dark:text-slate-300">{p.languages.join(", ")}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewProfile(worker.id)}
          className="flex-1 text-xs border-slate-300 dark:border-slate-700 font-medium"
        >
          View Profile
        </Button>

        <Button
          size="sm"
          onClick={() => onRequestWorker(worker.id)}
          className={`flex-1 text-xs font-semibold gap-1 ${
            isSelected
              ? "bg-emerald-800 text-white hover:bg-emerald-900"
              : "bg-emerald-700 hover:bg-emerald-800 text-white"
          }`}
        >
          {isSelected ? <UserCheck className="w-3.5 h-3.5" /> : null}
          {isSelected ? "Worker Selected" : "Request Worker"}
          {!isSelected && <ChevronRight className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </Card>
  );
}
