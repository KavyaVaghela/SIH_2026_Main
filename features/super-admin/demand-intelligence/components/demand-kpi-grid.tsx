"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  UserCheck,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Award,
  Layers,
} from "lucide-react";
import type { DemandOverviewStats } from "../types";

interface DemandKPIGridProps {
  stats?: DemandOverviewStats | null;
  isLoading?: boolean;
}

export function DemandKPIGrid({ stats, isLoading }: DemandKPIGridProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-3 border shadow-xs">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-7 w-12 mb-1" />
            <Skeleton className="h-2.5 w-24" />
          </Card>
        ))}
      </div>
    );
  }

  const isShortage = stats.balanceStatus === "SHORTAGE";
  const isSurplus = stats.balanceStatus === "SURPLUS";

  const items = [
    {
      label: "Service Requests",
      value: stats.serviceRequests.toLocaleString(),
      icon: <TrendingUp className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />,
      subtext: "Gross customer demand",
      accent: "border-l-4 border-l-emerald-600",
    },
    {
      label: "Available Workers",
      value: stats.availableWorkers.toLocaleString(),
      icon: <UserCheck className="h-4 w-4 text-sky-600 dark:text-sky-400" />,
      subtext: "Ready for immediate dispatch",
      accent: "border-l-4 border-l-sky-500",
    },
    {
      label: "Active Workers",
      value: stats.activeWorkers.toLocaleString(),
      icon: <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
      subtext: "Live on-site / en-route",
      accent: "border-l-4 border-l-indigo-500",
    },
    {
      label: "Net Balance (Gap)",
      value: `${stats.shortageOrSurplus > 0 ? "+" : ""}${stats.shortageOrSurplus}`,
      icon: isShortage ? (
        <AlertTriangle className="h-4 w-4 text-rose-600" />
      ) : isSurplus ? (
        <Layers className="h-4 w-4 text-emerald-600" />
      ) : (
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      ),
      subtext: isShortage
        ? "Deficit: Demand > Supply"
        : isSurplus
        ? "Surplus: Supply > Demand"
        : "Demand & Supply Balanced",
      accent: isShortage
        ? "border-l-4 border-l-rose-500 bg-rose-50/20 dark:bg-rose-950/20"
        : isSurplus
        ? "border-l-4 border-l-blue-500"
        : "border-l-4 border-l-emerald-600",
    },
    {
      label: "Capacity Fulfillment",
      value: `${stats.fulfillmentCapacityRate}%`,
      icon: <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
      subtext: stats.topServiceCategory,
      accent: "border-l-4 border-l-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((item, idx) => (
        <Card key={idx} className={`border shadow-xs bg-card ${item.accent}`}>
          <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase truncate">
                {item.label}
              </span>
              <div className="p-1 rounded-md bg-muted/60">{item.icon}</div>
            </div>

            <span className="text-2xl font-bold tracking-tight text-foreground">{item.value}</span>
            <p className="text-[10px] text-muted-foreground truncate">{item.subtext}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
