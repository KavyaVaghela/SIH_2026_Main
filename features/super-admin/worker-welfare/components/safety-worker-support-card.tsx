"use client";

import * as React from "react";
import { ShieldCheck, AlertTriangle, LifeBuoy, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SAFETY_SUPPORT_STATS } from "../data/welfare-mock-data";

export interface SafetyWorkerSupportCardProps {
  dateFilter?: string;
}

export function SafetyWorkerSupportCard({ dateFilter = "30_DAYS" }: SafetyWorkerSupportCardProps) {
  const stats = React.useMemo(() => {
    switch (dateFilter) {
      case "7_DAYS":
        return {
          safetyTrainings: 32,
          emergencyAssistance: 8,
          welfareRequests: 48,
          pendingAssistance: 18,
          label: "This week",
        };
      case "90_DAYS":
        return {
          safetyTrainings: 410,
          emergencyAssistance: 115,
          welfareRequests: 640,
          pendingAssistance: 142,
          label: "In 90 days",
        };
      case "ALL":
        return {
          safetyTrainings: 1250,
          emergencyAssistance: 340,
          welfareRequests: 1890,
          pendingAssistance: 198,
          label: "All time",
        };
      default:
        return {
          safetyTrainings: SAFETY_SUPPORT_STATS.safetyTrainingsThisMonth,
          emergencyAssistance: SAFETY_SUPPORT_STATS.emergencyAssistanceThisMonth,
          welfareRequests: SAFETY_SUPPORT_STATS.welfareRequestsThisMonth,
          pendingAssistance: SAFETY_SUPPORT_STATS.pendingAssistanceRequiresAction,
          label: "This month",
        };
    }
  }, [dateFilter]);

  return (
    <Card className="border border-border/80 shadow-sm flex flex-col justify-between h-full">
      <CardHeader className="pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Safety & Worker Support
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monitor safety initiatives and emergency support
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 grid grid-cols-2 gap-3 flex-1">
        <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-900/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-[10px] text-muted-foreground font-medium">{stats.label}</span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-foreground">{stats.safetyTrainings}</div>
            <div className="text-xs font-semibold text-muted-foreground mt-0.5">Safety Trainings</div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span className="text-[10px] text-muted-foreground font-medium">{stats.label}</span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400">{stats.emergencyAssistance}</div>
            <div className="text-xs font-semibold text-muted-foreground mt-0.5">Emergency Assistance</div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <LifeBuoy className="h-4 w-4 text-blue-600" />
            <span className="text-[10px] text-muted-foreground font-medium">{stats.label}</span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-foreground">{stats.welfareRequests}</div>
            <div className="text-xs font-semibold text-muted-foreground mt-0.5">Welfare Requests</div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-[10px] text-muted-foreground font-medium">Requires action</span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingAssistance}</div>
            <div className="text-xs font-semibold text-muted-foreground mt-0.5">Pending Assistance</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
