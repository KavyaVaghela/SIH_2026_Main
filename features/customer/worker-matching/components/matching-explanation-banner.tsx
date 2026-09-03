"use client";

import * as React from "react";
import { Sparkles, ShieldCheck } from "lucide-react";

export function MatchingExplanationBanner() {
  return (
    <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-start gap-3 text-xs">
      <div className="p-1.5 bg-emerald-700 text-white rounded-lg shrink-0 mt-0.5 shadow-xs">
        <Sparkles className="w-4 h-4" />
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">
            KaushalyaSetu 6-Tier Fair Matching Engine
          </span>
          <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Transparent
          </span>
        </div>

        <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
          Workers are matched using skill, availability, distance, experience, rating, current workload, and fair workforce distribution.
        </p>
      </div>
    </div>
  );
}
