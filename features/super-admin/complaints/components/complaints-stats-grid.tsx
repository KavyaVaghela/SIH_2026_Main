"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Clock, CheckCircle2, MessageSquare } from "lucide-react";
import type { ComplaintStats, ComplaintStatus } from "../types";

interface ComplaintsStatsGridProps {
  stats: ComplaintStats | null;
  onFilterSelect?: (status: "ALL" | ComplaintStatus) => void;
  isLoading?: boolean;
}

export function ComplaintsStatsGrid({
  stats,
  onFilterSelect,
  isLoading,
}: ComplaintsStatsGridProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 border shadow-xs">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-14 mb-1" />
            <Skeleton className="h-3 w-28" />
          </Card>
        ))}
      </div>
    );
  }

  const items = [
    {
      label: "Total Complaints",
      value: stats.totalComplaints.toLocaleString(),
      subtext: "All logged dispute tickets",
      icon: <MessageSquare className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />,
      accent: "border-l-4 border-l-emerald-600",
      statusFilter: "ALL" as const,
    },
    {
      label: "Open Grievances",
      value: stats.openCount.toLocaleString(),
      subtext: "Awaiting triage & initial review",
      icon: <AlertCircle className="h-4 w-4 text-amber-600" />,
      accent: "border-l-4 border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/20",
      statusFilter: "OPEN" as const,
    },
    {
      label: "In Review",
      value: stats.inReviewCount.toLocaleString(),
      subtext: "Under active investigation",
      icon: <Clock className="h-4 w-4 text-sky-600" />,
      accent: "border-l-4 border-l-sky-500 bg-sky-50/20 dark:bg-sky-950/20",
      statusFilter: "IN_REVIEW" as const,
    },
    {
      label: "Resolved Disputes",
      value: stats.resolvedCount.toLocaleString(),
      subtext: "Successfully closed cases",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
      accent: "border-l-4 border-l-emerald-700 bg-emerald-50/20 dark:bg-emerald-950/20",
      statusFilter: "RESOLVED" as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
