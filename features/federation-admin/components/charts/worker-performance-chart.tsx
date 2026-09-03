"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Award, Clock } from "lucide-react";
import type { WorkerPerformanceDistributionPoint } from "../../types";

interface WorkerPerformanceChartProps {
  data?: WorkerPerformanceDistributionPoint[];
  averageRating?: number;
  isLoading?: boolean;
}

export function WorkerPerformanceChart({
  data,
  averageRating = 4.8,
  isLoading,
}: WorkerPerformanceChartProps) {
  if (isLoading || !data) {
    return (
      <Card className="border bg-card shadow-xs">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalWorkers = data.reduce((acc, curr) => acc + curr.workerCount, 0);

  return (
    <Card className="border bg-card shadow-xs flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Worker Performance Summary
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Aggregate quality & customer feedback distribution across all active cooperative workers
            </CardDescription>
          </div>

          <div className="flex items-center space-x-3 self-start sm:self-auto">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              <Star className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />
              <span>{averageRating} / 5.0</span>
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-muted-foreground font-medium">
              <Clock className="h-3 w-3 text-emerald-600" />
              <span>98.2% On-Time</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {data.map((tier) => {
          const isTopTier = tier.ratingTier.includes("5.0") || tier.ratingTier.includes("4.5");
          const isWatchlist = tier.ratingTier.includes("Below");

          return (
            <div
              key={tier.ratingTier}
              className="p-2.5 rounded-lg border border-border/80 bg-muted/30 space-y-1.5 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-foreground flex items-center space-x-1">
                    <span>{tier.ratingTier}</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    ({tier.workerCount} workers)
                  </span>
                </div>
                <span className="font-mono font-bold text-foreground">
                  {tier.percentageShare}%
                </span>
              </div>

              {/* Progress visual */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isTopTier
                      ? "bg-emerald-600"
                      : isWatchlist
                      ? "bg-amber-500"
                      : "bg-blue-600"
                  }`}
                  style={{ width: `${tier.percentageShare}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{tier.description}</span>
                {isTopTier && (
                  <span className="flex items-center space-x-1 text-emerald-700 dark:text-emerald-400 font-medium">
                    <Award className="h-3 w-3" />
                    <span>Incentive Eligible</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}

        <div className="pt-1 text-[11px] text-muted-foreground text-center border-t border-border/60">
          Showing aggregate satisfaction across {totalWorkers} registered cooperative workers.
        </div>
      </CardContent>
    </Card>
  );
}
