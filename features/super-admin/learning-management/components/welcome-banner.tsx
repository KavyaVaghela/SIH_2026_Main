"use client";

import * as React from "react";

export function LMSWelcomeBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/25 p-6 sm:p-7 shadow-xs">
      {/* Subtle Background Glow Graphic */}
      <div className="absolute -bottom-16 -right-16 h-60 w-60 rounded-full bg-emerald-300/30 dark:bg-emerald-600/15 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between gap-4">
        <div className="space-y-1.5 max-w-4xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            KaushalGrow Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-emerald-100/80 leading-relaxed font-medium">
            Manage learning resources and empower workers with new skills. Publish vocational courses, manage skill categories, and monitor workforce upskilling statistics in real time.
          </p>
        </div>
      </div>
    </div>
  );
}
