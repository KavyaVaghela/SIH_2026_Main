"use client";

import * as React from "react";
import { Building2, MapPin, ShieldCheck, RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SUPPORTED_2026_MONTHS } from "../services/earnings-service";
import { useFederationContext } from "../../utils/federation-context";

interface EarningsHeaderProps {
  selectedMonthKey: string;
  onMonthChange: (monthKey: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
  lastUpdated?: string;
}

export function EarningsHeader({
  selectedMonthKey,
  onMonthChange,
  onRefresh,
  isLoading,
  lastUpdated,
}: EarningsHeaderProps) {
  const { federation } = useFederationContext();

  return (
    <div className="space-y-4 pb-2 border-b border-border/60">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Chips & Title */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
              <Building2 className="h-3.5 w-3.5" />
              <span>{federation?.name || "Ahmedabad Skilled Workers Federation"}</span>
            </div>
            <Badge variant="secondary" className="flex items-center space-x-1 text-[11px] font-medium text-muted-foreground">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span>{federation?.city || "Ahmedabad"}, {federation?.state || "Gujarat"}</span>
            </Badge>
            <Badge variant="outline" className="flex items-center space-x-1 text-[10px] text-muted-foreground font-mono">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              <span>{federation?.code || "FED-AMD-01"}</span>
            </Badge>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Earnings & Revenue
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Financial metrics, platform commission splits, category revenue distribution, and statutory payout reconciliations.
          </p>
        </div>

        {/* Actions & Filters */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Month Selector (January 2026 to September 2026 only) */}
          <div className="flex items-center space-x-1.5 bg-card border border-border rounded-md px-2.5 py-1 text-xs">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedMonthKey}
              onChange={(e) => onMonthChange(e.target.value)}
              className="bg-transparent font-medium text-foreground focus:outline-none text-xs cursor-pointer"
            >
              {SUPPORTED_2026_MONTHS.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
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
