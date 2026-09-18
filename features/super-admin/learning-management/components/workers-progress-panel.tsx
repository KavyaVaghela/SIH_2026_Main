"use client";

import * as React from "react";
import { Target, CheckCircle2, Clock, CircleAlert, TrendingUp } from "lucide-react";
import { LMSDashboardStats } from "@/features/shared/learning/types";
import { Card, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export interface WorkersProgressPanelProps {
  stats: LMSDashboardStats;
}

export function WorkersProgressPanel({ stats }: WorkersProgressPanelProps) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.overallCompletionPercent / 100) * circumference;

  return (
    <Card className="border border-border bg-card shadow-xs rounded-2xl overflow-hidden p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <CardTitle className="text-base font-bold text-foreground">
            Workers&apos; Learning Progress
          </CardTitle>
        </div>
        <span className="text-xs text-muted-foreground font-medium">Real-Time Sync</span>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* SVG Progress Ring */}
        <div className="flex items-center gap-4 shrink-0 w-full md:w-auto">
          <div className="relative h-24 w-24 flex items-center justify-center shrink-0">
            <svg className="h-full w-full transform -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-muted"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-emerald-600 dark:stroke-emerald-400 transition-all duration-1000 ease-out"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black text-foreground tracking-tight font-mono">
                {stats.overallCompletionPercent}%
              </span>
              <span className="text-[8px] uppercase font-bold text-muted-foreground tracking-wider">
                Overall
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-foreground">Workforce Upskilling Index</h4>
            <p className="text-xs text-muted-foreground">Calculated dynamically from active worker completions</p>
          </div>
        </div>

        {/* Dynamic Metric Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto flex-1">
          <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold text-foreground">Completed</span>
            </div>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-sm">
              {stats.completedCoursesCount}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20 text-xs gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-semibold text-foreground">In Progress</span>
            </div>
            <span className="font-bold text-amber-700 dark:text-amber-400 font-mono text-sm">
              {stats.inProgressCoursesCount}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-500/20 bg-slate-50/40 dark:bg-slate-900/40 text-xs gap-3">
            <div className="flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-slate-500 shrink-0" />
              <span className="font-semibold text-foreground">Not Started</span>
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-300 font-mono text-sm">
              {stats.notStartedCoursesCount}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
