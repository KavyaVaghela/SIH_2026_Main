"use client";

import * as React from "react";
import { Briefcase, IndianRupee, Star, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation, formatLocalizedCurrency } from "@/lib/i18n";
import type { WorkerOverviewStats } from "../types";

export interface SummaryCardsGridProps {
  stats: WorkerOverviewStats;
}

export function SummaryCardsGrid({ stats }: SummaryCardsGridProps) {
  const { t, locale } = useTranslation();

  const cards = [
    {
      label: t("worker.overview.todaysJobs", "Today's Jobs"),
      value: stats.todaysJobs.toString(),
      subtext:
        stats.todaysJobs === 0
          ? t("worker.overview.noJobsScheduled", "No jobs scheduled today")
          : t("worker.overview.scheduledToday", { count: stats.todaysJobs }, `${stats.todaysJobs} scheduled today`),
      icon: Briefcase,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/40",
    },
    {
      label: t("worker.overview.todaysEarnings", "Today's Earnings"),
      value: formatLocalizedCurrency(stats.todaysEarnings, locale),
      subtext: t("worker.overview.directSettlement", "Direct bank settlement"),
      icon: IndianRupee,
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/40",
    },
    {
      label: t("worker.overview.overallRating", "Overall Rating"),
      value: stats.overallRating > 0 ? `⭐ ${stats.overallRating.toFixed(1)}` : "No ratings yet",
      subtext:
        stats.overallRating > 0
          ? t("worker.overview.verifiedCustomers", "From verified customers")
          : t("worker.overview.newMemberBaseline", "New member baseline"),
      icon: Star,
      iconColor: "text-yellow-600 dark:text-yellow-400",
      iconBg: "bg-yellow-50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800/40",
    },
    {
      label: t("worker.overview.completedJobs", "Completed Jobs"),
      value: stats.completedJobs.toLocaleString(),
      subtext:
        stats.completedJobs === 0
          ? t("worker.overview.noCompletedYet", "No completed jobs yet")
          : t("worker.overview.lifetimeRecord", "Lifetime cooperative record"),
      icon: CheckCircle2,
      iconColor: "text-teal-600 dark:text-teal-400",
      iconBg: "bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800/40",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((item) => {
        const IconComponent = item.icon;
        return (
          <Card key={item.label} className="border-border shadow-sm hover:shadow transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-1">
                  {item.label}
                </span>
                <div className={`p-2 rounded-lg border shrink-0 ${item.iconBg}`}>
                  <IconComponent className={`h-4 w-4 ${item.iconColor}`} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {item.value}
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                  {item.subtext}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
