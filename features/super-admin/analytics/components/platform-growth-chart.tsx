"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Users, UserCheck, Calendar, TrendingUp } from "lucide-react";
import type { PlatformGrowthPoint } from "../types";

interface PlatformGrowthChartProps {
  data: PlatformGrowthPoint[];
  isLoading?: boolean;
}

export function PlatformGrowthChart({ data, isLoading }: PlatformGrowthChartProps) {
  if (isLoading) {
    return (
      <Card className="border shadow-sm p-6">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </Card>
    );
  }

  const latest = data[data.length - 1] || {
    societies: 5,
    workers: 264,
    customers: 3890,
    bookings: 4420,
  };

  const pillarCards = [
    {
      title: "Cooperative Societies",
      value: latest.societies,
      icon: <Building2 className="h-4 w-4 text-emerald-700" />,
      subtext: "Verified federations active",
    },
    {
      title: "Enrolled Craftsmen",
      value: latest.workers.toLocaleString(),
      icon: <UserCheck className="h-4 w-4 text-sky-600" />,
      subtext: "Certified gig workers",
    },
    {
      title: "Registered Customers",
      value: latest.customers.toLocaleString(),
      icon: <Users className="h-4 w-4 text-indigo-600" />,
      subtext: "Household accounts",
    },
    {
      title: "Cumulative Bookings",
      value: latest.bookings.toLocaleString(),
      icon: <Calendar className="h-4 w-4 text-amber-600" />,
      subtext: "Gross gig jobs dispatched",
    },
  ];

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          <CardTitle className="text-base font-bold text-foreground">
            Platform Expansion & Ecosystem Growth
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Historical growth trajectory across the four core ecosystem pillars
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* 4 Compact Pillar Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {pillarCards.map((card, i) => (
            <div key={i} className="p-3 rounded-xl border bg-muted/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase truncate">
                  {card.title}
                </span>
                {card.icon}
              </div>
              <p className="text-2xl font-bold font-mono text-foreground mt-0.5">{card.value}</p>
              <p className="text-[10px] text-muted-foreground truncate">{card.subtext}</p>
            </div>
          ))}
        </div>

        {/* Recharts Multi-line Chart */}
        <div className="w-full h-72 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="period"
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
              <Line
                type="monotone"
                dataKey="bookings"
                name="Total Bookings"
                stroke="#059669"
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="customers"
                name="Verified Customers"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="workers"
                name="Registered Workers"
                stroke="#0284c7"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
