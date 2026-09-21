"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MonthlyEarningsTrendPoint } from "../types";

interface EarningsTrendChartProps {
  data?: MonthlyEarningsTrendPoint[];
  isLoading?: boolean;
}

export function EarningsTrendChart({ data, isLoading }: EarningsTrendChartProps) {
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

  const formatYAxis = (val: number) => {
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  return (
    <Card className="border bg-card shadow-xs flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Earnings Trend
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Monthly comparative gross revenue and platform commission split (Apr – Sep)
            </CardDescription>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-md self-start sm:self-auto">
            Cycle: April 2025 – September 2025
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} opacity={0.6} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={formatYAxis} />
              <Tooltip
                formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, undefined]}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  fontSize: "12px",
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "0px" }} />
              <Bar
                dataKey="grossEarnings"
                name="Total Earnings"
                fill="#059669"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
              <Bar
                dataKey="platformCommission"
                name="Platform Commission"
                fill="#0284c7"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
