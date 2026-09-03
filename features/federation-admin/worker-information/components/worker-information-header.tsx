"use client";

import * as React from "react";
import { Users, ShieldCheck, RefreshCw, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface WorkerInformationHeaderProps {
  totalCount: number;
  onRefresh: () => void;
  isLoading?: boolean;
  isDevelopmentFallback?: boolean;
  dataSourceNotice?: string;
}

export function WorkerInformationHeader({
  totalCount,
  onRefresh,
  isLoading,
  isDevelopmentFallback,
  dataSourceNotice,
}: WorkerInformationHeaderProps) {
  return (
    <div className="space-y-4 pb-2 border-b border-border/60">
      {/* Dev fallback alert banner if active */}
      {isDevelopmentFallback && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong className="font-semibold">Development Demonstration State:</strong>{" "}
              {dataSourceNotice || "Worker roster is currently loaded in deterministic fallback mode."}
            </span>
          </div>
          <Badge
            variant="outline"
            className="border-amber-500/40 text-amber-700 dark:text-amber-300 font-mono text-[10px]"
          >
            DEMO ROSTER
          </Badge>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title & Description */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-blue-800 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-800/40">
              <Users className="h-3.5 w-3.5" />
              <span>Federation Workforce</span>
            </div>
            <Badge
              variant="secondary"
              className="text-[11px] font-medium text-muted-foreground"
            >
              Total Members: {totalCount}
            </Badge>
            <Badge
              variant="outline"
              className="flex items-center space-x-1 text-[10px] text-muted-foreground font-mono"
            >
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              <span>Read-Only Analysis Hub</span>
            </Badge>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Worker Information
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            View and analyze workers belonging to your federation. Member administrative operations (registration, activation, deactivation) are governed separately under Workforce Management.
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-9 text-xs font-medium border-border hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Roster
          </Button>
        </div>
      </div>
    </div>
  );
}
