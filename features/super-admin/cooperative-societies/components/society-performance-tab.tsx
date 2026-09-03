"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, CheckCircle2, TrendingUp, AlertTriangle, Star, ShieldCheck } from "lucide-react";
import type { SocietyPerformanceMetrics } from "../types";

interface SocietyPerformanceTabProps {
  performance: SocietyPerformanceMetrics | null;
}

export function SocietyPerformanceTab({ performance }: SocietyPerformanceTabProps) {
  if (!performance) {
    return (
      <div className="py-8 text-center text-muted-foreground text-xs">
        Performance metrics data currently unavailable for this society.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <Card className="border shadow-xs bg-linear-to-br from-card via-card to-emerald-950/5 dark:to-emerald-950/20">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
              <h3 className="text-base font-bold text-foreground">Overall Performance Benchmark</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Composite index based on service SLA adherence, utilization, and customer rating.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-right">
              <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
                {performance.overallPerformanceScore}
              </span>
              <span className="text-sm font-bold text-muted-foreground"> / 100</span>
              <p className="text-[10px] font-semibold text-muted-foreground">Grade A Governance</p>
            </div>
            <Badge className="bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
              High Performing
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Booking Completion Rate */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Booking Completion Rate
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-foreground">
                {performance.bookingCompletionRate}%
              </span>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200">
                Target: &gt;90%
              </Badge>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all"
                style={{ width: `${performance.bookingCompletionRate}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">Percentage of requests fulfilled without error.</p>
          </CardContent>
        </Card>

        {/* Worker Utilization Rate */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Worker Utilization Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-foreground">
                {performance.workerUtilizationRate}%
              </span>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200">
                Optimal
              </Badge>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all"
                style={{ width: `${performance.workerUtilizationRate}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">Active worker time assigned to client requests.</p>
          </CardContent>
        </Card>

        {/* Customer Satisfaction */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Customer Satisfaction
              </CardTitle>
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-foreground">
                {performance.customerSatisfaction} / 5.0
              </span>
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-200">
                Top Rated
              </Badge>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{ width: `${(performance.customerSatisfaction / 5) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">Average rating across completed job reviews.</p>
          </CardContent>
        </Card>

        {/* Cancellation Rate */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Cancellation Rate
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-foreground">
                {performance.cancellationRate}%
              </span>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200">
                Low Risk
              </Badge>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all"
                style={{ width: `${performance.cancellationRate * 3}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">Bookings cancelled prior to service dispatch.</p>
          </CardContent>
        </Card>

        {/* Complaint Count */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Customer Complaints Flagged
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-foreground">
                {performance.complaintCount} Tickets
              </span>
              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-800 border-blue-200">
                Resolved
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">Total formal escalation tickets logged.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
