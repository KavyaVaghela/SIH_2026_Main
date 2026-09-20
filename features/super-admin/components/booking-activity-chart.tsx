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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import type { BookingActivityPoint, OverviewTimeframe } from "../types";

interface BookingActivityChartProps {
  data?: BookingActivityPoint[];
  timeframe: OverviewTimeframe;
  onTimeframeChange: (tf: OverviewTimeframe) => void;
  isLoading?: boolean;
}

export function BookingActivityChart({
  data,
  timeframe,
  onTimeframeChange,
  isLoading,
}: BookingActivityChartProps) {
  if (isLoading || !data) {
    return (
      <Card className="border bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-8 w-36" />
        </CardHeader>
        <CardContent className="h-72 flex items-center justify-center">
          <Skeleton className="h-full w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const hasActivity = data.some(
    (d) => d.completed > 0 || d.active > 0 || d.pending > 0 || d.cancelled > 0
  );

  return (
    <Card className="border bg-card shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-3">
        <div>
          <CardTitle className="text-base font-bold text-foreground">
            Platform Booking & Fulfillment Activity
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Real Supabase booking lifecycle trends aggregated across all cooperative societies
          </CardDescription>
        </div>

        <div className="flex items-center space-x-1 bg-muted/60 p-1 rounded-lg self-start sm:self-auto border">
          {(["7d", "30d", "90d"] as OverviewTimeframe[]).map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? "default" : "ghost"}
              size="sm"
              onClick={() => onTimeframeChange(tf)}
              className={
                timeframe === tf
                  ? "bg-emerald-700 text-white hover:bg-emerald-800 h-7 px-3 text-xs font-medium shadow-xs"
                  : "h-7 px-3 text-xs text-muted-foreground hover:text-foreground"
              }
            >
              {tf === "7d" ? "Past 7 Days" : tf === "30d" ? "Past 30 Days" : "Past 90 Days"}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {!hasActivity ? (
          <div className="h-72 w-full flex flex-col items-center justify-center border rounded-lg bg-muted/20 border-dashed text-center p-6 space-y-2">
            <Calendar className="h-8 w-8 text-muted-foreground/60 mx-auto" />
            <p className="text-sm font-semibold text-foreground">No Activity Recorded in Window</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              No booking status transitions were recorded during this {timeframe === "7d" ? "7-day" : timeframe === "30d" ? "30-day" : "90-day"} timeframe.
            </p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.6} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    fontSize: "12px",
                    color: "hsl(var(--popover-foreground))",
                  }}
                />
                <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Completed Services"
                  stroke="#059669"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                />
                <Area
                  type="monotone"
                  dataKey="active"
                  name="In-Progress Jobs"
                  stroke="#d97706"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorActive)"
                />
                <Area
                  type="monotone"
                  dataKey="pending"
                  name="Pending In Queue"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPending)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
