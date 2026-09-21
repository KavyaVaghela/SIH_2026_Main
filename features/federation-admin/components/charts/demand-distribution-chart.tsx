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
import type { ServiceDemandPoint } from "../../types";

interface DemandDistributionChartProps {
  data?: ServiceDemandPoint[];
  isLoading?: boolean;
}

export function DemandDistributionChart({ data, isLoading }: DemandDistributionChartProps) {
  if (isLoading || !data) {
    return (
      <Card className="border bg-card shadow-xs">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <Skeleton className="h-full w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border bg-card shadow-xs">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Service Demand Distribution
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Household booking demand volume by core service category across Ahmedabad jurisdiction
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 15, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} opacity={0.6} />
              <XAxis
                dataKey="categoryName"
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
                    const item = payload[0].payload as ServiceDemandPoint;
                    return (
                      <div className="rounded-lg border border-border bg-card p-3 shadow-md text-xs space-y-1.5">
                        <div className="font-bold text-foreground text-sm">{item.categoryName}</div>
                        <div className="text-muted-foreground flex justify-between gap-4">
                          <span>Demand Volume:</span>
                          <strong className="text-emerald-700 dark:text-emerald-400">{item.demandVolume} requests</strong>
                        </div>
                        <div className="text-muted-foreground flex justify-between gap-4">
                          <span>YoY Surge:</span>
                          <strong className="text-blue-700 dark:text-blue-400">+{item.growthRate}%</strong>
                        </div>
                        <div className="text-muted-foreground flex justify-between gap-4 pt-1 border-t border-border">
                          <span>Worker Capacity Share:</span>
                          <strong className="text-foreground">{item.activeWorkerShare}%</strong>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="demandVolume" name="Demand Volume" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
