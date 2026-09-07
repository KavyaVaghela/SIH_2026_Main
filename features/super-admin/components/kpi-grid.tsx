"use client";

import * as React from "react";
import {
  Building2,
  Users,
  UserCheck,
  User,
  Calendar,
  CheckCircle2,
  Activity,
  Clock,
  Star,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { SuperAdminOverviewStats } from "../types";

interface KPIGridProps {
  stats?: SuperAdminOverviewStats;
  isLoading?: boolean;
}

interface KPICardItem {
  key: string;
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  badgeText?: string;
  accentColor: string;
}

export function KPIGrid({ stats, isLoading }: KPIGridProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <Card key={i} className="border shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </Card>
        ))}
      </div>
    );
  }

  const kpiList: KPICardItem[] = [
    {
      key: "societies",
      title: "Cooperative Societies",
      value: stats.totalSocieties.toLocaleString(),
      subtext: "Verified & active registered units",
      icon: <Building2 className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />,
      badgeText: "+2 this month",
      accentColor: "border-l-4 border-l-emerald-600",
    },
    {
      key: "workers",
      title: "Total Workforce",
      value: stats.totalWorkers.toLocaleString(),
      subtext: "Registered cooperative members",
      icon: <Users className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />,
      badgeText: "98% verified",
      accentColor: "border-l-4 border-l-emerald-600",
    },
    {
      key: "active_workers",
      title: "Active / Available Workers",
      value: `${stats.availableWorkers.toLocaleString()} / ${stats.activeWorkers.toLocaleString()}`,
      subtext: "Ready for instant assignment",
      icon: <UserCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />,
      badgeText: "73% online",
      accentColor: "border-l-4 border-l-emerald-600",
    },
    {
      key: "customers",
      title: "Total Customers",
      value: stats.totalCustomers.toLocaleString(),
      subtext: "Registered household clients",
      icon: <User className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />,
      badgeText: "+14% MoM",
      accentColor: "border-l-4 border-l-emerald-600",
    },
    {
      key: "bookings",
      title: "Platform Bookings",
      value: stats.totalBookings.toLocaleString(),
      subtext: "Total requests logged",
      icon: <Calendar className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />,
      badgeText: "Lifetime",
      accentColor: "border-l-4 border-l-emerald-600",
    },
    {
      key: "completed",
      title: "Completed Services",
      value: stats.completedServices.toLocaleString(),
      subtext: "Successfully fulfilled jobs",
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />,
      badgeText: "88% completion rate",
      accentColor: "border-l-4 border-l-emerald-600",
    },
    {
      key: "active_jobs",
      title: "Active In-Progress Jobs",
      value: stats.activeJobs.toLocaleString(),
      subtext: "On-site or en-route right now",
      icon: <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      badgeText: "Live Now",
      accentColor: "border-l-4 border-l-amber-500",
    },
    {
      key: "pending_requests",
      title: "Pending Requests",
      value: stats.pendingRequests.toLocaleString(),
      subtext: "Matching worker or customer confirmation",
      icon: <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      badgeText: "In Queue",
      accentColor: "border-l-4 border-l-blue-500",
    },
    {
      key: "rating",
      title: "Platform Satisfaction",
      value: `${stats.averageRating} / 5.0`,
      subtext: "Based on customer reviews",
      icon: <Star className="h-5 w-5 text-amber-500 fill-amber-500" />,
      badgeText: "High Quality",
      accentColor: "border-l-4 border-l-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
      {kpiList.map((item) => (
        <Card
          key={item.key}
          className={`border shadow-sm hover:shadow-md transition-all duration-200 bg-card ${item.accentColor}`}
        >
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {item.title}
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
                {item.icon}
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {item.value}
              </span>
              {item.badgeText && (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-semibold bg-emerald-100/70 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-none"
                >
                  <TrendingUp className="h-3 w-3 mr-1 inline" />
                  {item.badgeText}
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground pt-1 border-t border-border/50">
              {item.subtext}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
