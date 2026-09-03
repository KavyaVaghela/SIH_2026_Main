"use client";

import * as React from "react";
import { IndianRupee, Calendar, TrendingUp, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/formatters/currency";
import type { WorkerEarningsSummary } from "../types";

export interface EarningsSummaryGridProps {
  summary: WorkerEarningsSummary;
}

export function EarningsSummaryGrid({ summary }: EarningsSummaryGridProps) {
  const cards = [
    {
      title: "Today's Earnings",
      amount: formatINR(summary.todaysEarnings),
      subtext: "2 bookings settled",
      icon: IndianRupee,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/40",
    },
    {
      title: "This Week",
      amount: formatINR(summary.thisWeekEarnings),
      subtext: "Mon - Sun active period",
      icon: Calendar,
      iconColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/40",
    },
    {
      title: "This Month",
      amount: formatINR(summary.thisMonthEarnings),
      subtext: "Current billing cycle",
      icon: TrendingUp,
      iconColor: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/40",
    },
    {
      title: "Completed Jobs",
      amount: summary.completedJobsCount.toLocaleString(),
      subtext: "Lifetime completed record",
      icon: CheckCircle2,
      iconColor: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800/40",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const IconComp = card.icon;
        return (
          <Card key={card.title} className="border-border shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-1">
                  {card.title}
                </span>
                <div className={`p-2 rounded-lg border shrink-0 ${card.bgColor}`}>
                  <IconComp className={`h-4 w-4 ${card.iconColor}`} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {card.amount}
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                  {card.subtext}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
