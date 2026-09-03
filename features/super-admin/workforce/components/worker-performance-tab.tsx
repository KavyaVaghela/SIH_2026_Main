"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle2, AlertTriangle, Clock, MessageSquare } from "lucide-react";
import type { WorkerPerformanceMetrics } from "../types";

interface WorkerPerformanceTabProps {
  performance: WorkerPerformanceMetrics | null;
}

export function WorkerPerformanceTab({ performance }: WorkerPerformanceTabProps) {
  if (!performance) {
    return (
      <div className="py-8 text-center text-muted-foreground text-xs">
        Performance statistics currently unavailable for this worker.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-xs p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Job Completion Rate
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-foreground">{performance.completionRate}%</p>
          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${performance.completionRate}%` }} />
          </div>
        </Card>

        <Card className="border shadow-xs p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              On-Time SLA Arrival
            </span>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-foreground">{performance.onTimeArrivalRate}%</p>
          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${performance.onTimeArrivalRate}%` }} />
          </div>
        </Card>

        <Card className="border shadow-xs p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Cancellation Rate
            </span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{performance.cancellationRate}%</p>
          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full" style={{ width: `${performance.cancellationRate * 5}%` }} />
          </div>
        </Card>

        <Card className="border shadow-xs p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Rating Score
            </span>
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            ★ {performance.customerRating}
          </p>
          <p className="text-[11px] text-muted-foreground">Based on {performance.totalJobsFulfild} jobs</p>
        </Card>
      </div>

      {/* Recent Customer Reviews */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-bold text-foreground flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-emerald-700" />
            <span>Recent Customer Reviews & Ratings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {performance.recentReviews && performance.recentReviews.length > 0 ? (
            performance.recentReviews.map((rev, idx) => (
              <div key={idx} className="p-3.5 rounded-lg border bg-card space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{rev.customerName}</span>
                  <div className="flex items-center space-x-1 text-xs font-bold text-amber-600">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    <span>{rev.rating}.0</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic">"{rev.comment}"</p>
                <p className="text-[10px] text-muted-foreground pt-1">{rev.date}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground py-2">No review feedback logged yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
