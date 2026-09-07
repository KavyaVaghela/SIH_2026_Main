"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, ShieldAlert, User, Eye, ArrowRight } from "lucide-react";
import type { WelfareAlert } from "../types";

interface WelfareAlertsPanelProps {
  alerts: WelfareAlert[];
  onViewAlertDetail: (alert: WelfareAlert) => void;
  isLoading?: boolean;
}

export function WelfareAlertsPanel({
  alerts,
  onViewAlertDetail,
  isLoading,
}: WelfareAlertsPanelProps) {
  if (isLoading) {
    return (
      <Card className="border shadow-sm p-6">
        <div className="h-44 animate-pulse bg-muted/40 rounded-lg" />
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="border shadow-sm p-6 text-center">
        <div className="mx-auto w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mb-2">
          <ShieldAlert className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
        </div>
        <h4 className="text-sm font-bold text-foreground">Zero Welfare Compliance Alerts</h4>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
          All registered cooperative craftsmen have valid, active group insurance policies and escrow contributions.
        </p>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm border-amber-200/80 dark:border-amber-900/60 bg-gradient-to-br from-card via-card to-amber-950/5 dark:to-amber-950/20">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <CardTitle className="text-base font-bold text-foreground">
              Social Security & Insurance Protection Alerts ({alerts.length} Pending)
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Compliance interventions required for upcoming policy lapses, unenrolled craftsmen, and pending escrow contributions
          </CardDescription>
        </div>

        <Badge
          variant="outline"
          className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border-amber-300 text-xs font-bold"
        >
          Requires Action
        </Badge>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((alert) => {
            const isExpiring = alert.type === "EXPIRING_SOON";
            const isNoCoverage = alert.type === "NO_COVERAGE";

            return (
              <div
                key={alert.id}
                className="p-4 rounded-xl border bg-card hover:border-amber-400 hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        isExpiring
                          ? "bg-amber-50 text-amber-900 border-amber-300"
                          : isNoCoverage
                          ? "bg-rose-50 text-rose-900 border-rose-300"
                          : "bg-blue-50 text-blue-900 border-blue-300"
                      }`}
                    >
                      {isExpiring ? (
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" /> Expiring Soon
                        </span>
                      ) : isNoCoverage ? (
                        <span className="flex items-center">
                          <ShieldAlert className="h-3 w-3 mr-1" /> Unenrolled Worker
                        </span>
                      ) : (
                        "Update Required"
                      )}
                    </Badge>

                    {alert.expiryDate && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Exp: {alert.expiryDate}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-foreground leading-snug">
                      {alert.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground flex items-center mt-1">
                      <User className="h-3 w-3 mr-1 text-emerald-700" />
                      <span className="font-semibold text-foreground mr-1">{alert.workerName}</span>
                      <span>({alert.societyName})</span>
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {alert.description}
                  </p>
                </div>

                <div className="pt-2 border-t flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewAlertDetail(alert)}
                    className="h-7 px-3 text-xs font-semibold border-amber-300 text-amber-900 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
