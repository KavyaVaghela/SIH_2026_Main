"use client";

import * as React from "react";
import { Clock, CheckCircle2, PlayCircle, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface StatsSummaryCardsProps {
  inProgressCount: number;
  completedCount: number;
}

export function KaushalGrowStatsSummaryCards({
  inProgressCount = 3,
  completedCount = 5,
}: StatsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      {/* In Progress Card */}
      <Card className="border border-amber-500/30 bg-card hover:border-amber-500/50 transition-all shadow-xs rounded-xl overflow-hidden">
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              In Progress
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-baseline gap-2">
              <span>{inProgressCount}</span>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Courses</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Active learning modules</p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0">
            <Clock className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      {/* Completed Card */}
      <Card className="border border-emerald-500/30 bg-card hover:border-emerald-500/50 transition-all shadow-xs rounded-xl overflow-hidden">
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Completed
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-baseline gap-2">
              <span>{completedCount}</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Courses</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Mastered skill modules</p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
