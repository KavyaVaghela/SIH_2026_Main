"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserCheck, Activity, AlertCircle, ArrowUpRight, Wrench } from "lucide-react";
import type { WorkforceUtilizationMetric } from "../types";

interface WorkforceUtilizationPanelProps {
  utilization: WorkforceUtilizationMetric | null;
  isLoading?: boolean;
}

export function WorkforceUtilizationPanel({
  utilization,
  isLoading,
}: WorkforceUtilizationPanelProps) {
  if (isLoading || !utilization) {
    return (
      <Card className="border shadow-sm p-6">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            <CardTitle className="text-base font-bold text-foreground">
              Workforce Deployment & Skill Distribution
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Clear separation of active, available, and underutilized cooperative craftsmen
          </CardDescription>
        </div>

        <Link
          href="/super-admin/workforce"
          className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:underline flex items-center self-start sm:self-auto"
        >
          Workforce Registry
          <ArrowUpRight className="h-3.5 w-3.5 ml-0.5" />
        </Link>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* 3 Distinct Utilization Concept Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Active Workers */}
          <div className="p-3.5 rounded-xl border bg-card border-l-4 border-l-indigo-500 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-bold uppercase tracking-wider text-[10px]">Active Workers</span>
              <Activity className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold font-mono text-foreground">
              {utilization.activeCount}
            </p>
            <p className="text-[11px] text-muted-foreground">Engaged on-site or en-route</p>
          </div>

          {/* Available Workers */}
          <div className="p-3.5 rounded-xl border bg-card border-l-4 border-l-sky-500 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-bold uppercase tracking-wider text-[10px]">Available Workers</span>
              <UserCheck className="h-4 w-4 text-sky-600" />
            </div>
            <p className="text-2xl font-bold font-mono text-sky-700 dark:text-sky-400">
              {utilization.availableCount}
            </p>
            <p className="text-[11px] text-muted-foreground">Idle & ready for dispatch</p>
          </div>

          {/* Underutilized Workers */}
          <div className="p-3.5 rounded-xl border bg-card border-l-4 border-l-amber-500 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-bold uppercase tracking-wider text-[10px]">Underutilized</span>
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400">
              {utilization.underutilizedCount}
            </p>
            <p className="text-[11px] text-muted-foreground">&lt; 15 hrs logged in 14 days</p>
          </div>
        </div>

        {/* Overall Utilization Rate Gauge */}
        <div className="space-y-1.5 p-3.5 rounded-xl bg-muted/20 border">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Overall Platform Utilization Efficiency</span>
            <span className="font-mono text-foreground font-bold">
              {utilization.overallUtilizationRate}% Utilized
            </span>
          </div>
          <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${utilization.overallUtilizationRate}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Target SLA benchmark: 70% – 85% for optimal buffer against peak surges.
          </p>
        </div>

        {/* Skills / Trade Distribution Breakdown */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center">
              <Wrench className="h-3.5 w-3.5 mr-1.5 text-emerald-700" />
              Workforce Distribution by Trade Skill ({utilization.totalWorkers} Total Craftsmen)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {utilization.skillDistribution.map((skill) => (
              <div
                key={skill.skillName}
                className="p-2.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors space-y-1"
              >
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-foreground">{skill.skillName}</span>
                  <span className="font-mono font-bold text-foreground">
                    {skill.workerCount} <span className="text-[10px] text-muted-foreground font-normal">({skill.percentage}%)</span>
                  </span>
                </div>
                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-700 dark:bg-emerald-500 rounded-full"
                    style={{ width: `${skill.percentage * 2}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
