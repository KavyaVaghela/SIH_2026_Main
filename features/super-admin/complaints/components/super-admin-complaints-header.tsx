"use client";

import * as React from "react";
import { Building2, BarChart3, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SuperAdminComplaintSubsection } from "../types/v2";

interface SuperAdminComplaintsHeaderProps {
  activeSection: SuperAdminComplaintSubsection;
  onSectionChange: (section: SuperAdminComplaintSubsection) => void;
  federationComplaintCount: number;
  totalFederationsCount: number;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export function SuperAdminComplaintsHeader({
  activeSection,
  onSectionChange,
  federationComplaintCount,
  totalFederationsCount,
  isRefreshing,
  onRefresh,
}: SuperAdminComplaintsHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Super Admin Grievance Governance
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Supervise federation-originated grievances and monitor cross-federation dispute workloads across the cooperative ecosystem.
          </p>
        </div>

        {onRefresh && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="border-border text-foreground hover:bg-muted font-medium text-xs h-9"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          </div>
        )}
      </div>

      {/* Exactly Two Subsections */}
      <div className="flex items-center gap-2 p-1 bg-muted/60 dark:bg-muted/30 rounded-xl border border-border/40 w-full sm:w-fit">
        <button
          type="button"
          onClick={() => onSectionChange("FEDERATION_COMPLAINTS")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            activeSection === "FEDERATION_COMPLAINTS"
              ? "bg-background text-foreground shadow-sm border border-border/40"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          }`}
        >
          <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span>Federation Complaints</span>
          <Badge
            variant={activeSection === "FEDERATION_COMPLAINTS" ? "default" : "secondary"}
            className="ml-1 text-[11px] px-1.5 py-0 h-5"
          >
            {federationComplaintCount}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => onSectionChange("FEDERATION_OVERVIEW")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            activeSection === "FEDERATION_OVERVIEW"
              ? "bg-background text-foreground shadow-sm border border-border/40"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          }`}
        >
          <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>Federation Complaint Overview</span>
          <Badge
            variant={activeSection === "FEDERATION_OVERVIEW" ? "default" : "secondary"}
            className="ml-1 text-[11px] px-1.5 py-0 h-5"
          >
            {totalFederationsCount} Fed
          </Badge>
        </button>
      </div>
    </div>
  );
}
