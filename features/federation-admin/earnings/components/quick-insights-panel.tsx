"use client";

import * as React from "react";
import { TrendingUp, CheckCircle2, Award, Star, Lightbulb } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuickInsightMetric } from "../types";

interface QuickInsightsPanelProps {
  insights?: QuickInsightMetric;
  isLoading?: boolean;
}

export function QuickInsightsPanel({ insights, isLoading }: QuickInsightsPanelProps) {
  if (isLoading || !insights) {
    return (
      <Card className="border bg-card shadow-xs">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border bg-card shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-base font-bold text-foreground">
            Quick Insights
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Algorithmic summary of revenue highlights and operational performance
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Insight 1: 18% increase in earnings */}
        <div className="flex items-start space-x-3 p-3 rounded-lg border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/30">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white shadow-xs">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <span className="text-sm font-bold text-foreground">
              {insights.growthPercentage}% increase
            </span>
            <p className="text-xs text-muted-foreground">
              in earnings compared to last month
            </p>
          </div>
        </div>

        {/* Insight 2: 142 completed bookings */}
        <div className="flex items-start space-x-3 p-3 rounded-lg border border-border bg-muted/40">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white shadow-xs">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <span className="text-sm font-bold text-foreground">
              {insights.completedBookings} completed bookings
            </span>
            <p className="text-xs text-muted-foreground">
              by workers under your federation
            </p>
          </div>
        </div>

        {/* Insight 3: Top earning service */}
        <div className="flex items-start space-x-3 p-3 rounded-lg border border-border bg-muted/40">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-600 text-white shadow-xs">
            <Award className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <span className="text-sm font-bold text-foreground">
              Top earning service
            </span>
            <p className="text-xs text-muted-foreground">
              {insights.topService} ({insights.topServiceShare}% of total earnings)
            </p>
          </div>
        </div>

        {/* Insight 4: 4.8 average rating */}
        <div className="flex items-start space-x-3 p-3 rounded-lg border border-border bg-muted/40">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-purple-600 text-white shadow-xs">
            <Star className="h-4 w-4 fill-white" />
          </div>
          <div className="space-y-0.5">
            <span className="text-sm font-bold text-foreground">
              {insights.averageRating} average rating
            </span>
            <p className="text-xs text-muted-foreground">
              from customer bookings
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
