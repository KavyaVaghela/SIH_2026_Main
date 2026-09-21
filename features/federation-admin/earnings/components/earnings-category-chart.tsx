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
import type { CategoryEarningsDistributionPoint } from "../types";

interface EarningsCategoryChartProps {
  data?: CategoryEarningsDistributionPoint[];
  totalEarnings?: number;
  isLoading?: boolean;
}

export function EarningsCategoryChart({ data, totalEarnings, isLoading }: EarningsCategoryChartProps) {
  if (isLoading || !data) {
    return (
      <Card className="border bg-card shadow-xs">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="h-72 flex items-center justify-center">
          <Skeleton className="h-48 w-48 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const calculatedTotal = totalEarnings ?? data.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <Card className="border bg-card shadow-xs flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Earnings by Service Category
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Percentage distribution across authorized cooperative trade sectors
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="relative h-72 w-full">
          {/* Centered Overlay for Dynamic Total Earnings */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
            <span className="text-xs font-medium text-muted-foreground">Total Earnings</span>
            <span className="text-xl font-bold text-foreground tracking-tight">
              ₹{calculatedTotal.toLocaleString("en-IN")}
            </span>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as CategoryEarningsDistributionPoint;
                    return (
                      <div className="rounded-lg border border-border bg-card p-2.5 shadow-md text-xs space-y-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-semibold text-foreground">{item.name}</span>
                        </div>
                        <div className="text-muted-foreground">
                          Share: <strong className="text-foreground">{item.percentage}%</strong> (₹{item.amount.toLocaleString("en-IN")})
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={48}
                iconType="circle"
                wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }}
              />
              <Pie
                data={data}
                cx="50%"
                cy="44%"
                innerRadius={62}
                outerRadius={88}
                paddingAngle={3}
                dataKey="percentage"
                nameKey="name"
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
