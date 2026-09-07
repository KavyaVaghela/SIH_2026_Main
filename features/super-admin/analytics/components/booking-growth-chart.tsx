"use client";

import * as React from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, ArrowUpRight, Calendar } from "lucide-react";
import type { BookingGrowthPoint } from "../types";

interface BookingGrowthChartProps {
  data: BookingGrowthPoint[];
  growthRate?: number;
  isLoading?: boolean;
}

export function BookingGrowthChart({
  data,
  growthRate = 18.6,
  isLoading,
}: BookingGrowthChartProps) {
  if (isLoading) {
    return (
      <Card className="border shadow-sm p-6">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-4" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </Card>
    );
  }

  const totalPeriodBookings = data.reduce((acc, d) => acc + d.total, 0);

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            <CardTitle className="text-base font-bold text-foreground">
              Booking Volume & Growth Trajectory
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Time-series progression of dispatched, fulfilled, and active gig orders across cooperative federations
          </CardDescription>
        </div>

        <div className="flex items-center space-x-2">
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 text-xs font-bold"
          >
            +{growthRate}% Trend Growth
          </Badge>
          <Link
            href="/super-admin/bookings"
            className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:underline flex items-center"
          >
            Inspect Bookings
            <ArrowUpRight className="h-3.5 w-3.5 ml-0.5" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Quick Snapshot Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/20 p-3 rounded-xl border">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Bookings</span>
            <p className="text-xl font-bold font-mono text-foreground mt-0.5">{totalPeriodBookings}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Completed</span>
            <p className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
              {data.reduce((acc, d) => acc + d.completed, 0)}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">In Progress</span>
            <p className="text-xl font-bold font-mono text-sky-700 dark:text-sky-400 mt-0.5">
              {data.reduce((acc, d) => acc + d.inProgress, 0)}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Cancelled</span>
            <p className="text-xl font-bold font-mono text-rose-600 mt-0.5">
              {data.reduce((acc, d) => acc + d.cancelled, 0)}
            </p>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="w-full h-72 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="periodLabel"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(var(--popover-foreground))",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="#059669"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCompleted)"
                name="Completed Jobs"
              />
              <Area
                type="monotone"
                dataKey="inProgress"
                stroke="#0284c7"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorInProgress)"
                name="In Progress"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
