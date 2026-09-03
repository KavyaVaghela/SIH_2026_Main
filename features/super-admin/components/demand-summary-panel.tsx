"use client";

import * as React from "react";
import { TrendingUp, MapPin, Clock, Zap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { DemandCategorySummary, DemandDistrictCluster, PeakDemandHour } from "../types";

interface DemandSummaryPanelProps {
  categories?: DemandCategorySummary[];
  clusters?: DemandDistrictCluster[];
  peakHours?: PeakDemandHour[];
  isLoading?: boolean;
}

export function DemandSummaryPanel({
  categories,
  clusters,
  peakHours,
  isLoading,
}: DemandSummaryPanelProps) {
  if (isLoading || !categories || !clusters || !peakHours) {
    return (
      <Card className="border shadow-sm p-4 space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          <CardTitle className="text-base font-bold text-foreground">
            Demand Intelligence Summary
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Real-time market signals, skill category demand, geographic hotspots, and timing spikes
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 space-y-6">
        {/* Top Demanded Skill Categories */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center">
              <TrendingUp className="h-3.5 w-3.5 mr-1.5 text-emerald-700" />
              Top Demanded Skill Categories
            </h4>
            <span className="text-[11px] text-muted-foreground">30-day volume</span>
          </div>

          <div className="space-y-2">
            {categories.slice(0, 4).map((cat) => (
              <div
                key={cat.categoryId}
                className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors border"
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">{cat.categoryName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {cat.bookingCount.toLocaleString()} requests logged
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold"
                >
                  +{cat.growthPercentage}%
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* District Demand Clusters */}
        <div className="space-y-3 pt-2 border-t">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center">
            <MapPin className="h-3.5 w-3.5 mr-1.5 text-emerald-700" />
            Geographic Demand Clusters
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {clusters.map((cluster) => (
              <div
                key={cluster.district}
                className="p-2.5 rounded-lg border bg-card hover:bg-accent/40 transition-colors space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{cluster.district}</span>
                  <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-900 font-bold">
                    Score {cluster.demandScore}/100
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Primary Need: <span className="font-medium text-foreground">{cluster.primarySkillNeeded}</span>
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Active Workers: {cluster.activeWorkersCount} available
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Demand Hours Analysis */}
        <div className="space-y-3 pt-2 border-t">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center">
            <Clock className="h-3.5 w-3.5 mr-1.5 text-emerald-700" />
            Peak Demand Hours
          </h4>

          <div className="space-y-2">
            {peakHours.map((ph) => (
              <div key={ph.timeSlot} className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{ph.timeSlot}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-muted h-2 rounded-full overflow-hidden">
                    <div
                      className={
                        ph.demandLevel === "PEAK"
                          ? "bg-amber-500 h-full rounded-full"
                          : ph.demandLevel === "HIGH"
                          ? "bg-emerald-600 h-full rounded-full"
                          : "bg-blue-500 h-full rounded-full"
                      }
                      style={{ width: `${ph.percentageShare * 2}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground w-8 text-right">
                    {ph.percentageShare}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
