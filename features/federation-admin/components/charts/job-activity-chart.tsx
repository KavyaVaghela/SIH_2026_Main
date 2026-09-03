"use client";

import * as React from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import type { JobActivityTrendPoint, DashboardTimeframe } from "../../types";

interface JobActivityChartProps {
  data?: JobActivityTrendPoint[];
  timeframe: DashboardTimeframe;
  isLoading?: boolean;
}

export function JobActivityChart({ data, timeframe, isLoading }: JobActivityChartProps) {
  if (isLoading || !data) {
    return (
      <Card className="border bg-card shadow-xs">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="h-72 flex items-center justify-center">
          <Skeleton className="h-full w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border bg-card shadow-xs">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Job Activity Trend
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Historical throughput velocity across completed, active in-progress, and pending requests
            </CardDescription>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-md self-start sm:self-auto">
            Window: {timeframe === "7d" ? "Past 7 Days" : timeframe === "90d" ? "Past 3 Months" : "Past 30 Days"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="fedColorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="fedColorRunning" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="fedColorPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} opacity={0.6} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  fontSize: "12px",
                }}
              />
              <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
              <Area
                type="monotone"
                dataKey="completed"
                name="Completed Jobs"
                stroke="#059669"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#fedColorCompleted)"
              />
              <Area
                type="monotone"
                dataKey="running"
                name="Running Jobs"
                stroke="#d97706"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#fedColorRunning)"
              />
              <Area
                type="monotone"
                dataKey="pending"
                name="Pending Requests"
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#fedColorPending)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
