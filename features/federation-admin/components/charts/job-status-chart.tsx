"use client";

import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { JobStatusDistributionPoint } from "../../types";

interface JobStatusChartProps {
  data?: JobStatusDistributionPoint[];
  isLoading?: boolean;
}

export function JobStatusChart({ data, isLoading }: JobStatusChartProps) {
  if (isLoading || !data) {
    return (
      <Card className="border bg-card shadow-xs h-full flex flex-col">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="flex-1 min-h-[220px] flex items-center justify-center">
          <Skeleton className="h-44 w-44 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const totalJobs = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card className="border bg-card shadow-xs flex flex-col h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Jobs by Status
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Lifecycle status breakdown across all recorded federation bookings
            </CardDescription>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground">
            Total: {totalJobs}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex-1 flex flex-col justify-center items-center pb-4">
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as JobStatusDistributionPoint;
                    return (
                      <div className="rounded-lg border border-border bg-card p-2.5 shadow-md text-xs space-y-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-semibold text-foreground">{item.label}</span>
                        </div>
                        <div className="text-muted-foreground">
                          Count: <strong className="text-foreground">{item.count}</strong> ({item.percentage}%)
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={32}
                iconType="circle"
                wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }}
              />
              <Pie
                data={data}
                cx="50%"
                cy="42%"
                innerRadius={50}
                outerRadius={78}
                paddingAngle={4}
                dataKey="count"
                nameKey="label"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
