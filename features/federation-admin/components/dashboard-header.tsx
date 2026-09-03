"use client";

import * as React from "react";
import { RefreshCw, Building2, MapPin, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DashboardTimeframe, FederationIdentity } from "../types";

interface DashboardHeaderProps {
  federation?: FederationIdentity;
  timeframe: DashboardTimeframe;
  onTimeframeChange: (tf: DashboardTimeframe) => void;
  onRefresh: () => void;
  isLoading?: boolean;
  lastUpdated?: string;
  isDevelopmentFallback?: boolean;
  dataSourceNotice?: string;
}

export function DashboardHeader({
  federation,
  timeframe,
  onTimeframeChange,
  onRefresh,
  isLoading,
  lastUpdated,
  isDevelopmentFallback,
  dataSourceNotice,
}: DashboardHeaderProps) {
  const timeframes: { key: DashboardTimeframe; label: string }[] = [
    { key: "7d", label: "7 Days" },
    { key: "30d", label: "30 Days" },
    { key: "90d", label: "90 Days" },
  ];

  return (
    <div className="space-y-4 pb-2 border-b border-border/60">
      {/* Dev fallback alert banner if active */}
      {isDevelopmentFallback && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong className="font-semibold">Development Demonstration State:</strong>{" "}
              {dataSourceNotice || "Cross-dashboard operational data is rendered in deterministic fallback mode."}
            </span>
          </div>
          <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300 font-mono text-[10px]">
            DEMO MODE
          </Badge>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Federation Context & Title */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
              <Building2 className="h-3.5 w-3.5" />
              <span>{federation?.name || "ABC Labour Cooperative Federation"}</span>
            </div>
            <Badge variant="secondary" className="flex items-center space-x-1 text-[11px] font-medium text-muted-foreground">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span>{federation?.city || "Ahmedabad"}, {federation?.state || "Gujarat"}</span>
            </Badge>
            <Badge variant="outline" className="flex items-center space-x-1 text-[10px] text-muted-foreground font-mono">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              <span>{federation?.registrationNumber || "REG/GJ/AHM/2024/042"}</span>
            </Badge>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Federation Performance & Operations
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Executive oversight of workforce operational capacity, service fulfillment velocity, customer complaints, and aggregate cooperative efficiency.
          </p>
        </div>

        {/* Actions & Filters */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Timeframe selector */}
          <div className="inline-flex rounded-lg border border-border bg-muted/50 p-0.5 text-muted-foreground">
            {timeframes.map((tf) => (
              <button
                key={tf.key}
                type="button"
                onClick={() => onTimeframeChange(tf.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  timeframe === tf.key
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "hover:text-foreground text-muted-foreground"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Sync status & Refresh button */}
          {lastUpdated && (
            <span className="hidden xl:inline-block text-[11px] text-muted-foreground">
              Synced {lastUpdated}
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8 text-xs font-medium border-border hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
