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
import type { ProfessionDistributionPoint } from "../../types";

interface ProfessionDistributionChartProps {
  data?: ProfessionDistributionPoint[];
  isLoading?: boolean;
}

export function ProfessionDistributionChart({ data, isLoading }: ProfessionDistributionChartProps) {
  if (isLoading || !data) {
    return (
      <Card className="border bg-card shadow-xs">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
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
        <CardTitle className="text-base font-bold text-foreground">
          Jobs by Profession & Service Category
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Completed job volume paired with deployed cooperative workforce capacity by trade
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 15, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} opacity={0.6} />
              <XAxis
                dataKey="profession"
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={40}
                tick={{ fontSize: 11, fill: "#6b7280" }}
              />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as ProfessionDistributionPoint;
                    return (
                      <div className="rounded-lg border border-border bg-card p-3 shadow-md text-xs space-y-1.5">
                        <div className="font-bold text-foreground text-sm">{item.profession}</div>
                        <div className="text-muted-foreground flex justify-between gap-4">
                          <span>Completed Jobs:</span>
                          <strong className="text-emerald-700 dark:text-emerald-400">{item.completedJobs}</strong>
                        </div>
                        <div className="text-muted-foreground flex justify-between gap-4">
                          <span>Active Workers:</span>
                          <strong className="text-blue-700 dark:text-blue-400">{item.activeWorkers}</strong>
                        </div>
                        <div className="text-muted-foreground flex justify-between gap-4 pt-1 border-t border-border">
                          <span>Coop Quality Score:</span>
                          <strong className="text-foreground">{item.averageRating} ★</strong>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="completedJobs" name="Completed Jobs" fill="#047857" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="activeWorkers" name="Active Workers" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
