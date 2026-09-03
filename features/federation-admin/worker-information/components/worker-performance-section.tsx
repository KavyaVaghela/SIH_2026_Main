"use client";

import * as React from "react";
import {
  TrendingUp,
  CheckCircle2,
  PlayCircle,
  Briefcase,
  Star,
  Clock,
  Award,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WorkerPerformanceSummary } from "../types";

interface WorkerPerformanceSectionProps {
  performance: WorkerPerformanceSummary;
}

export function WorkerPerformanceSection({ performance }: WorkerPerformanceSectionProps) {
  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Service Fulfillment & Performance Benchmarks
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Historical job execution metrics and customer rating distribution
              </CardDescription>
            </div>
          </div>

          <Badge
            variant="outline"
            className="border-emerald-600/30 text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 text-[11px] font-medium self-start sm:self-auto"
          >
            <Award className="h-3 w-3 mr-1 text-emerald-600" />
            Tier: {performance.performanceTier} Performance
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Total Jobs */}
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
            <div className="flex items-center space-x-1.5 text-muted-foreground font-medium">
              <Briefcase className="h-3.5 w-3.5 text-slate-700" />
              <span>Total Service Bookings</span>
            </div>
            <p className="text-xl font-bold text-foreground">{performance.totalJobs}</p>
            <span className="text-[10px] text-muted-foreground block">Lifetime assigned orders</span>
          </div>

          {/* Completed Jobs */}
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
            <div className="flex items-center space-x-1.5 text-emerald-700 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Completed Jobs</span>
            </div>
            <p className="text-xl font-bold text-emerald-800 dark:text-emerald-400">
              {performance.completedJobs}
            </p>
            <span className="text-[10px] text-muted-foreground block">
              {performance.jobCompletionRate}% completion rate
            </span>
          </div>

          {/* Running Jobs */}
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
            <div className="flex items-center space-x-1.5 text-amber-700 font-medium">
              <PlayCircle className="h-3.5 w-3.5" />
              <span>In-Progress Jobs</span>
            </div>
            <p className="text-xl font-bold text-amber-800 dark:text-amber-400">
              {performance.runningJobs}
            </p>
            <span className="text-[10px] text-muted-foreground block">Active on-site or transit</span>
          </div>

          {/* Customer Rating */}
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
            <div className="flex items-center space-x-1.5 text-amber-600 font-medium">
              <Star className="h-3.5 w-3.5 fill-amber-500" />
              <span>Customer Rating</span>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-bold text-foreground">
                {performance.averageRating.toFixed(1)}
              </span>
              <span className="text-muted-foreground text-[10px]">/ 5.0</span>
            </div>
            <span className="text-[10px] text-muted-foreground block">
              {performance.onTimeArrivalRate}% on-time arrival
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
