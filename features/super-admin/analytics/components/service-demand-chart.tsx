"use client";

import * as React from "react";
import Link from "next/link";
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
import { Briefcase, ArrowUpRight, Zap } from "lucide-react";
import type { ServiceDemandMetric } from "../types";

interface ServiceDemandChartProps {
  services: ServiceDemandMetric[];
  isLoading?: boolean;
}

export function ServiceDemandChart({ services, isLoading }: ServiceDemandChartProps) {
  if (isLoading) {
    return (
      <Card className="border shadow-sm p-6">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </Card>
    );
  }

  const chartData = services.slice(0, 5).map((s) => ({
    name: s.serviceTitle.length > 18 ? `${s.serviceTitle.slice(0, 16)}...` : s.serviceTitle,
    fullName: s.serviceTitle,
    Requests: s.requestsCount,
    Share: s.sharePercentage,
  }));

  return (
    <Card className="border shadow-sm">
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

        <Link
          href="/super-admin/demand-intelligence"
          className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:underline flex items-center self-start sm:self-auto"
        >
          Demand Intelligence
          <ArrowUpRight className="h-3.5 w-3.5 ml-0.5" />
        </Link>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Recharts Bar Chart */}
        <div className="w-full h-56 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                width={120}
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
              <Bar
                dataKey="Requests"
                fill="#059669"
                name="Booking Requests"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ranked Service List with Market Share % */}
        <div className="space-y-2.5 pt-2 border-t">
          <span className="text-[11px] font-bold text-muted-foreground uppercase block">
            Top Service Volume Breakdown
          </span>

          <div className="space-y-2">
            {services.map((service, index) => (
              <div
                key={service.serviceId}
                className="p-2.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors flex items-center justify-between gap-2"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                    {index + 1}
                  </span>
                  <div className="truncate">
                    <Link
                      href={`/super-admin/demand-intelligence?service=${encodeURIComponent(service.serviceTitle)}`}
                      className="text-xs font-bold text-foreground hover:text-emerald-700 hover:underline truncate block"
                    >
                      {service.serviceTitle}
                    </Link>
                    <span className="text-[10px] text-muted-foreground">{service.category}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0 text-right">
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
