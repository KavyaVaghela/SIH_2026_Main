"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ShieldCheck, ShieldAlert, Clock } from "lucide-react";
import type { WelfareSummaryStats, WelfareCoverageStatus } from "../types";

interface WelfareStatsGridProps {
  stats: WelfareSummaryStats | null;
  onFilterSelect?: (status: "ALL" | WelfareCoverageStatus) => void;
  isLoading?: boolean;
}

export function WelfareStatsGrid({
  stats,
  onFilterSelect,
  isLoading,
}: WelfareStatsGridProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 border shadow-xs">
            <Skeleton className="h-4 w-28 mb-2" />
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-32" />
          </Card>
        ))}
      </div>
    );
  }

  const items = [
    {
      label: "Total Registered Workers",
      value: stats.totalWorkers.toLocaleString(),
      subtext: "Verified cooperative members",
      icon: <Users className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />,
      accent: "border-l-4 border-l-emerald-600",
      statusFilter: "ALL" as const,
    },
    {
      label: "Workers with Coverage",
      value: stats.coveredWorkers.toLocaleString(),
      subtext: `${stats.coveragePercentage}% platform compliance`,
      icon: <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
      accent: "border-l-4 border-l-emerald-700 bg-emerald-50/20 dark:bg-emerald-950/20",
      statusFilter: "ACTIVE" as const,
    },
    {
      label: "Workers without Coverage",
      value: stats.uncoveredWorkers.toLocaleString(),
      subtext: "Requires onboarding enrollment",
      icon: <ShieldAlert className="h-4 w-4 text-rose-600" />,
      accent: "border-l-4 border-l-rose-500 bg-rose-50/20 dark:bg-rose-950/20",
      statusFilter: "NO_COVERAGE" as const,
    },
    {
      label: "Policies Expiring Soon",
      value: stats.expiringSoonCount.toLocaleString(),
      subtext: "Expires in ≤ 30 days",
      icon: <Clock className="h-4 w-4 text-amber-600" />,
      accent: "border-l-4 border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/20",
      statusFilter: "EXPIRING_SOON" as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item, idx) => (
        <Card
          key={idx}
          onClick={() => onFilterSelect && onFilterSelect(item.statusFilter)}
          className={`border shadow-xs bg-card ${item.accent} ${
            onFilterSelect ? "cursor-pointer hover:shadow-sm hover:border-emerald-700/40 transition-all" : ""
          }`}
        >
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase truncate">
                {item.label}
              </span>
              <div className="p-1.5 rounded-md bg-muted/60">{item.icon}</div>
            </div>

            <span className="text-2xl font-bold tracking-tight text-foreground">{item.value}</span>
            <p className="text-[11px] text-muted-foreground truncate">{item.subtext}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
