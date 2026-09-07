"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Star, ArrowUpRight, Award, Building2, CheckCircle2 } from "lucide-react";
import type { SocietyPerformanceMetric } from "../types";

interface TopPerformingSocietiesProps {
  societies: SocietyPerformanceMetric[];
  isLoading?: boolean;
}

export function TopPerformingSocieties({
  societies,
  isLoading,
}: TopPerformingSocietiesProps) {
  if (isLoading) {
    return (
      <Card className="border shadow-sm p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      </Card>
    );
  }

  // Sort descending by transparent benchmark score
  const topThree = [...societies]
    .sort((a, b) => b.benchmarkScore - a.benchmarkScore)
    .slice(0, 3);

  return (
    <Card className="border shadow-sm border-emerald-300/70 dark:border-emerald-800/60 bg-gradient-to-br from-card via-card to-emerald-950/5 dark:to-emerald-950/20">
      <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base font-bold text-foreground">
              Top Performing Cooperative Societies
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Exemplary federations ranked by composite governance score (Completion 35%, Rating 30%, Utilization 20%, Low Cancellations 15%)
          </CardDescription>
        </div>

        <Link
          href="/super-admin/societies"
          className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:underline flex items-center self-start sm:self-auto"
        >
          View All Societies
          <ArrowUpRight className="h-3.5 w-3.5 ml-0.5" />
        </Link>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topThree.map((soc, idx) => {
            const rankBadges = ["Rank #1", "Rank #2", "Rank #3"];
            const rankColors = [
              "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
              "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200",
              "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950 dark:text-orange-300",
            ];

            return (
              <div
                key={soc.societyId}
                className="p-4 rounded-xl border bg-card hover:border-emerald-700/50 hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className={`text-[10px] font-extrabold ${rankColors[idx]}`}>
                      {rankBadges[idx]}
                    </Badge>

                    <div className="flex items-center space-x-1">
                      <Badge className="bg-emerald-800 text-white text-[10px] font-bold">
                        Grade {soc.benchmarkGrade}
                      </Badge>
                      <span className="text-xs font-mono font-bold text-foreground">
                        {soc.benchmarkScore} pts
                      </span>
                    </div>
                  </div>

                  <div>
                    <Link
                      href={`/super-admin/societies/${soc.societyId}`}
                      className="text-sm font-bold text-foreground hover:text-emerald-700 hover:underline block leading-snug"
                    >
                      {soc.societyName}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">{soc.location}</p>
                  </div>

                  {soc.highlightBadge && (
                    <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold flex items-center">
                      <Award className="h-3 w-3 mr-1 shrink-0" />
                      <span>{soc.highlightBadge}</span>
                    </div>
                  )}

                  {/* Operational Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-muted/30 border text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Completion</span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {soc.completionRate}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Utilization</span>
                      <span className="font-mono font-bold text-sky-700 dark:text-sky-400">
                        {soc.workerUtilization}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Satisfaction</span>
                      <span className="font-mono font-bold text-amber-600 flex items-center">
                        <Star className="h-2.5 w-2.5 mr-0.5 fill-amber-500 text-amber-500" />
                        {soc.customerRating}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Cancellations</span>
                      <span className="font-mono font-bold text-foreground">
                        {soc.cancellationRate}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <Link
                    href={`/super-admin/societies/${soc.societyId}`}
                    className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:underline flex items-center justify-between"
                  >
                    <span>Inspect Society Registry</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
