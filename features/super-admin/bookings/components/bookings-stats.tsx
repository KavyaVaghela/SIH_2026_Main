"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Inbox,
  Clock,
  UserCheck,
  Activity,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { BookingStats as StatsType } from "../types";

interface BookingsStatsProps {
  stats?: StatsType | null;
  onFilterClick?: (status: string) => void;
  isLoading?: boolean;
}

export function BookingsStatsGrid({
  stats,
  onFilterClick,
  isLoading,
}: BookingsStatsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
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
      label: "New Requests",
      value: stats.newRequests,
      icon: <Inbox className="h-4 w-4 text-slate-700 dark:text-slate-300" />,
      subtext: "Awaiting matching",
      accent: "border-l-4 border-l-slate-400 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/30",
      filterValue: "REQUEST_SENT",
    },
    {
      label: "Pending Bookings",
      value: stats.pendingBookings,
      icon: <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
      subtext: "Confirming dispatch",
      accent: "border-l-4 border-l-amber-500 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/30",
      filterValue: "PENDING",
    },
    {
      label: "Accepted Bookings",
      value: stats.acceptedBookings,
      icon: <UserCheck className="h-4 w-4 text-sky-600 dark:text-sky-400" />,
      subtext: "Worker assigned",
      accent: "border-l-4 border-l-sky-500 cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-900/30",
      filterValue: "WORKER_ACCEPTED",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />,
      subtext: "Live on-site execution",
      accent: "border-l-4 border-l-indigo-500 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30",
      filterValue: "IN_PROGRESS",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: <CheckCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />,
      subtext: "Fulfillment & paid",
      accent: "border-l-4 border-l-emerald-600 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/30",
      filterValue: "COMPLETED",
    },
    {
      label: "Cancelled",
      value: stats.cancelled,
      icon: <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
      subtext: "Revoked / refunded",
      accent: "border-l-4 border-l-rose-500 cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-900/30",
      filterValue: "CANCELLED",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((item, idx) => (
        <Card
          key={idx}
          onClick={() => onFilterClick?.(item.filterValue)}
          className={`border shadow-xs bg-card transition-all duration-150 ${item.accent}`}
          title={`Click to filter by ${item.label}`}
        >
          <CardContent className="p-3 flex flex-col justify-between h-full space-y-1">
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
