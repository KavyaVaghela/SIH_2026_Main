"use client";

import * as React from "react";
import Link from "next/link";
import { AlertOctagon, ShieldAlert, AlertTriangle, ArrowUpRight, Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CriticalAlert } from "../types";

interface CriticalAlertsPanelProps {
  alerts?: CriticalAlert[];
  isLoading?: boolean;
}

export function CriticalAlertsPanel({ alerts, isLoading }: CriticalAlertsPanelProps) {
  const [resolvedIds, setResolvedIds] = React.useState<string[]>([]);

  if (isLoading || !alerts) {
    return (
      <Card className="border shadow-sm p-4 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-20 w-full" />
      </Card>
    );
  }

  const activeAlerts = alerts.filter((a) => !resolvedIds.includes(a.id));

  const handleDismiss = (id: string) => {
    setResolvedIds((prev) => [...prev, id]);
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <AlertOctagon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            <CardTitle className="text-base font-bold text-foreground">
              Critical Platform Alerts
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Operational bottlenecks, SLA risks, and governance approvals requiring intervention
          </CardDescription>
        </div>
        <Badge variant="destructive" className="font-bold text-xs">
          {activeAlerts.length} Active
        </Badge>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {activeAlerts.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground space-y-1">
            <Check className="h-8 w-8 text-emerald-600 mx-auto" />
            <p className="text-sm font-semibold text-foreground">All System Operational</p>
            <p className="text-xs">No unresolved critical alerts or SLA breaches flagged.</p>
          </div>
        ) : (
          activeAlerts.map((alert) => {
            const isCritical = alert.severity === "CRITICAL";
            const isHigh = alert.severity === "HIGH";

            return (
              <div
                key={alert.id}
                className={`p-3.5 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCritical
                    ? "bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60"
                    : isHigh
                    ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60"
                    : "bg-muted/40 border-border"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 shrink-0">
                    {isCritical ? (
                      <ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-foreground">{alert.title}</span>
                      <Badge
                        className={`text-[9px] font-bold px-1.5 py-0 uppercase ${
                          isCritical
                            ? "bg-rose-600 text-white"
                            : isHigh
                            ? "bg-amber-600 text-white"
                            : "bg-slate-600 text-white"
                        }`}
                      >
                        {alert.severity}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{alert.timestamp}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{alert.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  {alert.actionUrl && (
                    <Link
                      href={alert.actionUrl}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "h-7 px-2.5 text-xs font-semibold border-emerald-700/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                      )}
                    >
                      Action
                      <ArrowUpRight className="h-3 w-3 ml-1" />
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(alert.id)}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
