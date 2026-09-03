"use client";

import * as React from "react";
import { Building2, MapPin, ShieldCheck, RefreshCw, FileEdit, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OfficialFederationDetails } from "../types";

interface FederationInformationHeaderProps {
  officialDetails?: OfficialFederationDetails;
  onOpenChangeDialog: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
  lastUpdated?: string;
  isDevelopmentFallback?: boolean;
  dataSourceNotice?: string;
}

export function FederationInformationHeader({
  officialDetails,
  onOpenChangeDialog,
  onRefresh,
  isLoading,
  lastUpdated,
  isDevelopmentFallback,
  dataSourceNotice,
}: FederationInformationHeaderProps) {
  return (
    <div className="space-y-4 pb-2 border-b border-border/60">
      {/* Dev fallback alert banner if active */}
      {isDevelopmentFallback && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong className="font-semibold">Development Demonstration State:</strong>{" "}
              {dataSourceNotice || "Official records are currently loaded in deterministic fallback mode."}
            </span>
          </div>
          <Badge
            variant="outline"
            className="border-amber-500/40 text-amber-700 dark:text-amber-300 font-mono text-[10px]"
          >
            DEMO DATASET
          </Badge>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Federation Context & Title */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
              <Building2 className="h-3.5 w-3.5" />
              <span>{officialDetails?.name || "ABC Labour Cooperative Federation"}</span>
            </div>
            <Badge
              variant="secondary"
              className="flex items-center space-x-1 text-[11px] font-medium text-muted-foreground"
            >
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span>
                {officialDetails?.city || "Ahmedabad"}, {officialDetails?.state || "Gujarat"}
              </span>
            </Badge>
            <Badge
              variant="outline"
              className="flex items-center space-x-1 text-[10px] text-muted-foreground font-mono"
            >
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              <span>{officialDetails?.registrationNumber || "REG/GJ/AHM/2024/042"}</span>
            </Badge>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Federation Information & Governance
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Official statutory profile, regulatory registration records, verified documents, and governed change request dispatch. Sensitive official data cannot be edited directly.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
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
            className="h-9 text-xs font-medium border-border hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={onOpenChangeDialog}
            className="h-9 text-xs font-medium bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs"
          >
            <FileEdit className="h-3.5 w-3.5 mr-1.5" />
            Request Change
          </Button>
        </div>
      </div>
    </div>
  );
}
