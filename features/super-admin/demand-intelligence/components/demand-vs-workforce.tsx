"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import type { DemandOverviewStats } from "../types";

interface DemandVsWorkforceProps {
  stats: DemandOverviewStats | null;
  isLoading?: boolean;
}

export function DemandVsWorkforce({ stats, isLoading }: DemandVsWorkforceProps) {
  if (isLoading || !stats) {
    return (
      <Card className="border shadow-sm p-6">
        <div className="h-28 animate-pulse bg-muted/40 rounded-lg" />
      </Card>
    );
  }

  const deficit = Math.abs(stats.shortageOrSurplus);
  const isShortage = stats.balanceStatus === "SHORTAGE";
  const isSurplus = stats.balanceStatus === "SURPLUS";

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold text-foreground flex items-center space-x-2">
              <Users className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
              <span>Demand vs. Available Workforce Balance</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Direct capacity comparison between active incoming service requests and dispatch-ready craftsmen
            </CardDescription>
          </div>

          <Badge
            variant="outline"
            className={`text-xs font-bold px-3 py-1 ${
              isShortage
                ? "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/70 dark:text-rose-300"
                : isSurplus
                ? "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300"
                : "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300"
            }`}
          >
            {isShortage ? (
              <span className="flex items-center">
                <AlertTriangle className="h-3.5 w-3.5 mr-1 text-rose-600" />
                Workforce Deficit Detected
              </span>
            ) : isSurplus ? (
              <span className="flex items-center">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-blue-600" />
                Workforce Surplus
              </span>
            ) : (
              <span className="flex items-center">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                Balanced Supply & Demand
              </span>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Metric Comparison Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-muted/20 p-4 rounded-xl border">
          {/* Demand Column */}
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-center sm:justify-start">
              <TrendingUp className="h-3.5 w-3.5 mr-1 text-emerald-700" />
              Gross Service Demand
            </span>
            <p className="text-3xl font-extrabold text-foreground">
              {stats.serviceRequests} <span className="text-sm font-normal text-muted-foreground">requests</span>
            </p>
            <p className="text-[11px] text-muted-foreground">Logged across selected scope</p>
          </div>

          {/* Versus Icon / Ratio */}
          <div className="flex flex-col items-center justify-center space-y-1 py-2 sm:py-0 border-y sm:border-y-0 sm:border-x border-border">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Fulfillment Ratio
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold font-mono text-foreground">
                {stats.availableWorkers} : {stats.serviceRequests}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              {stats.fulfillmentCapacityRate}% capacity ready
            </p>
          </div>

          {/* Supply Column */}
          <div className="space-y-1 text-center sm:text-right">
            <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-center sm:justify-end">
              <Users className="h-3.5 w-3.5 mr-1 text-sky-600" />
              Available Workforce
            </span>
            <p className="text-3xl font-extrabold text-sky-700 dark:text-sky-400">
              {stats.availableWorkers} <span className="text-sm font-normal text-muted-foreground">workers</span>
            </p>
            <p className="text-[11px] text-muted-foreground">Ready for immediate dispatch</p>
          </div>
        </div>

        {/* Visual Progress Ratio Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs text-muted-foreground font-semibold">
            <span>Workforce Fulfillment Coverage</span>
            <span className="font-mono text-foreground">{stats.fulfillmentCapacityRate}% Covered</span>
          </div>
          <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isShortage ? "bg-rose-500" : isSurplus ? "bg-blue-600" : "bg-emerald-600"
              }`}
              style={{ width: `${Math.min(100, stats.fulfillmentCapacityRate)}%` }}
            />
          </div>
        </div>

        {/* Actionable Balance Insight Callout */}
        <div
          className={`p-3.5 rounded-lg border text-xs leading-relaxed flex items-start space-x-2.5 ${
            isShortage
              ? "bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/50 text-rose-900 dark:text-rose-200"
              : isSurplus
              ? "bg-blue-50/60 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-900/50 text-blue-900 dark:text-blue-200"
              : "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200"
          }`}
        >
          {isShortage ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          )}
          <p>
            <span className="font-bold">Super Admin Balance Assessment: </span>
            {isShortage ? (
              <>
                Current service demand exceeds available supply by a deficit of{" "}
                <span className="font-bold font-mono underline">{deficit} workers</span>. Customer fulfillment
                SLA may experience delays unless cross-society dispatch or surge allocation is initiated.
              </>
            ) : isSurplus ? (
              <>
                Workforce supply currently exceeds inbound demand by{" "}
                <span className="font-bold font-mono">{deficit} craftsmen</span>. Recommend checking the
                Underutilized Workers panel to distribute commercial project bookings to available members.
              </>
            ) : (
              <>
                Platform workforce capacity is currently balanced within standard 15-minute dispatch SLAs.
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
