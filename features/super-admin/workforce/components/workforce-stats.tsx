"use client";

import * as React from "react";
import { Users, UserCheck, Activity, UserX, ShieldCheck, Clock, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { WorkforceStats as StatsType } from "../types";

interface WorkforceStatsProps {
  stats?: StatsType | null;
  onUnderutilizedClick?: () => void;
  isLoading?: boolean;
}

export function WorkforceStatsGrid({ stats, onUnderutilizedClick, isLoading }: WorkforceStatsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i} className="p-3 border shadow-xs">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-6 w-10 mb-1" />
            <Skeleton className="h-2.5 w-20" />
          </Card>
        ))}
      </div>
    );
  }

  const items = [
    {
      label: "Total Workers",
      value: stats.totalWorkers,
      icon: <Users className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />,
      subtext: "Registered members",
      accent: "border-l-4 border-l-emerald-600",
    },
    {
      label: "Available Workers",
      value: stats.availableWorkers,
      icon: <UserCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />,
      subtext: "Ready for dispatch",
      accent: "border-l-4 border-l-emerald-600",
    },
    {
      label: "Currently On Jobs",
      value: stats.busyWorkers,
      icon: <Activity className="h-4 w-4 text-amber-600" />,
      subtext: "On-site / en-route",
      accent: "border-l-4 border-l-amber-500",
    },
    {
      label: "Inactive Workers",
      value: stats.inactiveWorkers,
      icon: <UserX className="h-4 w-4 text-slate-500" />,
      subtext: "Offline / suspended",
      accent: "border-l-4 border-l-slate-400",
    },
    {
      label: "Verified Workers",
      value: stats.verifiedWorkers,
      icon: <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />,
      subtext: "Identity & skill verified",
      accent: "border-l-4 border-l-emerald-600",
    },
    {
      label: "Pending Verification",
      value: stats.pendingVerificationWorkers,
      icon: <Clock className="h-4 w-4 text-blue-600" />,
      subtext: "Awaiting document audit",
      accent: "border-l-4 border-l-blue-500",
    },
    {
      label: "Underutilized Workers",
      value: stats.underutilizedWorkers,
      icon: <TrendingDown className="h-4 w-4 text-rose-600" />,
      subtext: "Low job allocation",
      accent: "border-l-4 border-l-rose-500 cursor-pointer hover:bg-rose-50/50 dark:hover:bg-rose-950/20",
      onClick: onUnderutilizedClick,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {items.map((item, idx) => (
        <Card
          key={idx}
          onClick={item.onClick}
          className={`border shadow-xs bg-card transition-all duration-150 ${item.accent}`}
        >
          <CardContent className="p-3 flex flex-col justify-between h-full space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase truncate">
                {item.label}
              </span>
              <div className="p-1 rounded-md bg-muted/60">{item.icon}</div>
            </div>

            <span className="text-xl font-bold tracking-tight text-foreground">{item.value}</span>
            <p className="text-[10px] text-muted-foreground truncate">{item.subtext}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
