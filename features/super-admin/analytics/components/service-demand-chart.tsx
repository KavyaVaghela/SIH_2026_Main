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
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase } from "lucide-react";
import type { ServiceDemandMetric } from "../types";

interface ServiceDemandChartProps {
  services: ServiceDemandMetric[];
  isLoading?: boolean;
}

export function ServiceDemandChart({ services, isLoading }: ServiceDemandChartProps) {
  if (isLoading) {
    return (
      <Card className="border bg-card shadow-xs p-6">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </Card>
    );
  }

  const topServices = services.slice(0, 5);
  const chartData = topServices.map((s) => ({
    name: s.serviceTitle.length > 18 ? `${s.serviceTitle.slice(0, 16)}...` : s.serviceTitle,
    fullName: s.serviceTitle,
    Requests: s.requestsCount,
    Share: s.sharePercentage,
  }));

  return (
    <Card className="border bg-card shadow-xs">
      <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            <CardTitle className="text-base font-bold text-foreground">
              Trade Service Demand & Market Share
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Distribution of service requests by trade category for the active analytics scope
          </CardDescription>
        </div>

        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 text-xs font-bold self-start sm:self-auto"
        >
          Top 5 Services
        </Badge>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-5">
        {/* Recharts Bar Chart */}
        <div className="w-full h-44 pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.6} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  fontSize: "12px",
                  color: "hsl(var(--popover-foreground))",
                }}
              />
              <Bar
                dataKey="Requests"
                fill="#059669"
                name="Booking Requests"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Compact Top 5 Service Breakdown */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Top Service Volume Breakdown
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              Top 5 of {services.length} active trades
            </span>
          </div>

          <div className="space-y-1.5">
            {topServices.map((service, index) => (
              <div
                key={service.serviceId}
                className="px-2.5 py-1.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors flex items-center justify-between gap-2"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                    {index + 1}
                  </span>
                  <div className="truncate">
                    <span className="text-xs font-bold text-foreground truncate block">
                      {service.serviceTitle}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{service.category}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5 shrink-0 text-right">
                  <div>
                    <span className="font-mono font-bold text-xs text-foreground block">
                      {service.requestsCount} reqs
                    </span>
                    <span className="text-[10px] text-muted-foreground">{service.sharePercentage}% share</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold hidden sm:inline-flex"
                  >
                    +{service.trendGrowth}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
