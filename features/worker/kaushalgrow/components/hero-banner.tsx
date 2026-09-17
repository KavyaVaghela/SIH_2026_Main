"use client";

import * as React from "react";
import { GraduationCap, PlayCircle, ShieldCheck, UserCheck } from "lucide-react";

export function KaushalGrowHeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 bg-[#f4fbf8] dark:bg-emerald-950/30 p-5 sm:p-6 md:p-7 shadow-xs space-y-4">
      {/* Top Pill Badge */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#dcfce7] dark:bg-emerald-900/40 border border-emerald-300/60 text-[#065f46] dark:text-emerald-300 text-xs font-semibold">
          <GraduationCap className="h-3.5 w-3.5 text-[#065f46] dark:text-emerald-300" />
          <span>Skill Learning Hub</span>
        </div>
      </div>

      {/* Main Heading, Tagline & Description */}
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
          <span className="text-[#0f172a] dark:text-white">Kaushal</span>
          <span className="text-[#065f46] dark:text-emerald-400">Grow</span>
        </h1>

        <h2 className="text-base sm:text-xl font-bold text-[#334155] dark:text-slate-200 pt-0.5">
          Learn Skills. Grow Your Future.
        </h2>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal max-w-xl leading-relaxed">
          Access curated learning resources, track your progress and become a better professional.
        </p>
      </div>

      {/* Bottom Features Row */}
      <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-semibold text-slate-700 dark:text-slate-200">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-[#dcfce7] dark:bg-emerald-900/50 text-[#065f46] dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-300/40">
            <PlayCircle className="h-3.5 w-3.5" />
          </div>
          <span>Verified Learning Modules</span>
        </div>

        <div className="hidden sm:block h-3.5 w-px bg-slate-300/80 dark:bg-slate-700" />

        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-[#dcfce7] dark:bg-emerald-900/50 text-[#065f46] dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-300/40">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <span>Certified Courses</span>
        </div>

        <div className="hidden sm:block h-3.5 w-px bg-slate-300/80 dark:bg-slate-700" />

        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-[#dcfce7] dark:bg-emerald-900/50 text-[#065f46] dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-300/40">
            <UserCheck className="h-3.5 w-3.5" />
          </div>
          <span>Free Access for Workers</span>
        </div>
      </div>
    </div>
  );
}
