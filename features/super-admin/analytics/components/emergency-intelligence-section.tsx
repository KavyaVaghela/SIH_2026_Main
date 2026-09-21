"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Hourglass,
  ArrowUpRight,
  Building2,
  Wrench,
  Activity,
  Flame,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { EmergencyAnalyticsData } from "../types";

interface EmergencyIntelligenceSectionProps {
  data: EmergencyAnalyticsData | null;
  isLoading?: boolean;
}

export function EmergencyIntelligenceSection({
  data,
  isLoading,
}: EmergencyIntelligenceSectionProps) {
  if (isLoading || !data) {
    return (
      <Card className="border bg-card shadow-xs p-6 space-y-4">
        <Skeleton className="h-6 w-64 mb-2" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </Card>
    );
  }

  const { overview, statusDistribution, tradeBreakdown, federationWorkload, trend } = data;
  const hasEmergencies = overview.totalEmergencyRequests > 0;

  return (
    <Card className="border bg-card shadow-xs">
      <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Flame className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            <CardTitle className="text-base font-bold text-foreground">
              Emergency & On-Demand Operational Intelligence
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Platform-wide urgent household dispatches, live assignment load, trade breakdowns, and federation emergency handling
          </CardDescription>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <Badge
            variant="outline"
            className="bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 text-xs font-bold"
          >
            {overview.totalEmergencyRequests} Emergency Requests
          </Badge>
          <Badge
            variant="outline"
            className={
              overview.liveUnassignedCount > 0
                ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 text-xs font-bold"
                : "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 text-xs font-medium"
            }
          >
            {overview.liveUnassignedCount > 0
              ? `${overview.liveUnassignedCount} Live Unassigned`
              : "0 Unassigned Live"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* 4 Emergency KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase truncate">
                Emergency Demand
              </span>
              <Flame className="h-4 w-4 text-rose-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-foreground mt-0.5">
              {overview.totalEmergencyRequests}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {overview.liveUnassignedCount > 0
                ? `${overview.liveUnassignedCount} awaiting assignment`
                : "No unassigned emergency backlog"}
            </p>
          </div>

          <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase truncate">
                In Progress
              </span>
              <Hourglass className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold font-mono text-foreground mt-0.5">
              {overview.inProgressCount}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              Active dispatches in transit/service
            </p>
          </div>

          <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase truncate">
                Completion Rate
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold font-mono text-foreground mt-0.5">
              {overview.completionRate !== null ? `${overview.completionRate}%` : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {overview.completedCount} completed emergency jobs
            </p>
          </div>

          <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase truncate">
                Avg Response Time
              </span>
              <Clock className="h-4 w-4 text-sky-600" />
            </div>
            <p className="text-base font-semibold font-mono text-foreground mt-1 truncate">
              {overview.avgResponseTime}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              Worker acceptance SLA data
            </p>
          </div>
        </div>

        {/* Live Status Distribution & Trade Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Breakdown */}
          <div className="p-4 rounded-xl border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Emergency Status Lifecycle
                </h4>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                {overview.totalEmergencyRequests} Total
              </span>
            </div>

            {statusDistribution.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No emergency bookings recorded.
              </div>
            ) : (
              <div className="space-y-2.5">
                {statusDistribution.map((item) => (
                  <div key={item.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{item.label}</span>
                      <span className="font-mono text-muted-foreground">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className={
                          item.status.includes("COMPLETED")
                            ? "h-full rounded-full bg-emerald-600"
                            : item.status.includes("CANCELLED")
                            ? "h-full rounded-full bg-rose-600"
                            : "h-full rounded-full bg-amber-500"
                        }
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trade Breakdown */}
          <div className="p-4 rounded-xl border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wrench className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Emergency Demand by Trade
                </h4>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                {tradeBreakdown.length} Trades
              </span>
            </div>

            {tradeBreakdown.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No emergency trade demand recorded.
              </div>
            ) : (
              <div className="space-y-2.5">
                {tradeBreakdown.map((item) => (
                  <div key={item.tradeName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{item.tradeName}</span>
                      <span className="font-mono text-muted-foreground">
                        {item.count} requests ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Emergency Trend & Federation Workload Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Emergency Requests Over Time */}
          <div className="p-4 rounded-xl border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Emergency Request Volume Over Time
                </h4>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                {trend.length} Days Recorded
              </span>
            </div>

            {trend.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs text-muted-foreground border rounded-lg bg-muted/10">
                No activity recorded in window
              </div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="emergencyVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "#cbd5e1" }}
                      tickFormatter={(val) => {
                        const parts = val.split("-");
                        return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : val;
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.96)",
                        borderColor: "#e2e8f0",
                        borderRadius: "8px",
                        fontSize: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                      formatter={(value: any) => [`${value} requests`, "Emergency Volume"]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="requestsCount"
                      stroke="#e11d48"
                      strokeWidth={2}
                      fill="url(#emergencyVolumeGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Federation Emergency Handling Workload Table */}
          <div className="p-4 rounded-xl border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Federation Emergency Workload
                </h4>
              </div>
              <Link
                href="/super-admin/societies"
                className="text-[11px] text-primary hover:underline font-medium flex items-center gap-0.5"
              >
                View Societies <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="overflow-x-auto max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/40 text-[10px] text-muted-foreground uppercase font-semibold">
                    <th className="py-2 px-2.5">Federation</th>
                    <th className="py-2 px-2.5 text-center">Requests</th>
                    <th className="py-2 px-2.5 text-center">Active</th>
                    <th className="py-2 px-2.5 text-center">Completed</th>
                    <th className="py-2 px-2.5 text-center">Unassigned</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-muted-foreground">
                  {federationWorkload.slice(0, 8).map((fed) => (
                    <tr key={fed.federationId} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2 px-2.5 font-medium text-foreground">
                        <div className="truncate max-w-[140px] sm:max-w-[180px]">{fed.federationName}</div>
                        <div className="text-[10px] text-muted-foreground">{fed.city}</div>
                      </td>
                      <td className="py-2 px-2.5 text-center font-mono font-bold text-foreground">
                        {fed.emergencyRequests}
                      </td>
                      <td className="py-2 px-2.5 text-center font-mono">
                        {fed.activeEmergencies > 0 ? (
                          <span className="text-amber-700 dark:text-amber-300 font-semibold">
                            {fed.activeEmergencies}
                          </span>
                        ) : (
                          "0"
                        )}
                      </td>
                      <td className="py-2 px-2.5 text-center font-mono text-emerald-700 dark:text-emerald-300 font-semibold">
                        {fed.completedEmergencies}
                      </td>
                      <td className="py-2 px-2.5 text-center font-mono">
                        {fed.unassignedEmergencies > 0 ? (
                          <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-300">
                            {fed.unassignedEmergencies}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Operational Action Footer */}
        <div className="pt-2 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              Real emergency dispatch monitoring. Live unassigned requests require immediate cooperative federation attention.
            </span>
          </div>
          <Link
            href="/super-admin/bookings"
            className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
          >
            Review All Booking Dispatches <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
