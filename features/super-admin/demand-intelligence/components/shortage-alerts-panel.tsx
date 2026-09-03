"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin, Briefcase, Eye, ChevronRight } from "lucide-react";
import type { ShortageAlert } from "../types";

interface ShortageAlertsPanelProps {
  alerts: ShortageAlert[];
  onViewDetails: (alert: ShortageAlert) => void;
  isLoading?: boolean;
}

export function ShortageAlertsPanel({
  alerts,
  onViewDetails,
  isLoading,
}: ShortageAlertsPanelProps) {
  if (isLoading) {
    return (
      <Card className="border shadow-sm p-6">
        <div className="h-44 animate-pulse bg-muted/40 rounded-lg" />
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="border shadow-sm p-8 text-center bg-card">
        <div className="mx-auto w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mb-2">
          <AlertTriangle className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
        </div>
        <h4 className="text-sm font-bold text-foreground">No Critical Shortages Detected</h4>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
          Workforce supply currently matches or exceeds incoming demand for the selected filters.
        </p>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm border-rose-200/80 dark:border-rose-900/60 bg-gradient-to-br from-card via-card to-rose-950/5 dark:to-rose-950/20">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            <CardTitle className="text-base font-bold text-foreground">
              Workforce Shortage Alerts ({alerts.length} Active)
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Critical regional deficits where inbound booking volume outpaces localized available craftsmen
          </CardDescription>
        </div>

        <Badge
          variant="outline"
          className="bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 border-rose-300 text-xs font-bold"
        >
          Action Required
        </Badge>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 rounded-xl border bg-card hover:border-rose-300 hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-foreground flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1 text-rose-600 shrink-0" />
                      {alert.location}
                    </h4>
                    <p className="text-[11px] text-muted-foreground font-medium flex items-center mt-0.5">
                      <Briefcase className="h-3 w-3 mr-1 text-muted-foreground" />
                      {alert.serviceTitle}
                    </p>
                  </div>

                  <Badge
                    variant="outline"
                    className="bg-rose-50 text-rose-900 border-rose-300 text-[10px] font-bold"
                  >
                    Shortage: {alert.shortageAmount}
                  </Badge>
                </div>

                {/* 4 Required Metric Indicators */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-muted/40 border text-center text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Demand</span>
                    <span className="font-mono font-bold text-foreground">{alert.currentDemand}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Available</span>
                    <span className="font-mono font-bold text-sky-700 dark:text-sky-400">
                      {alert.availableWorkers}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-600 font-bold block">Deficit</span>
                    <span className="font-mono font-bold text-rose-600">
                      -{alert.shortageAmount}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">Action: </span>
                  {alert.recommendedAction}
                </p>
              </div>

              <div className="pt-2 border-t flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground truncate" title={alert.societyName}>
                  {alert.societyName}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(alert)}
                  className="h-7 px-3 text-xs font-semibold border-rose-300 text-rose-900 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
