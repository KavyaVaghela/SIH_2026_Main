"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertTriangle, Activity } from "lucide-react";
import type { WorkerAvailabilityStatus, WorkerVerificationStatus } from "../types";

interface WorkerStatusBadgeProps {
  type: "availability" | "verification";
  status: WorkerAvailabilityStatus | WorkerVerificationStatus | string;
  className?: string;
}

export function WorkerStatusBadge({ type, status, className }: WorkerStatusBadgeProps) {
  if (type === "availability") {
    if (status === "AVAILABLE") {
      return (
        <Badge
          variant="outline"
          className={`bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 text-[11px] font-semibold w-fit ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5 inline-block" />
          Available / Online
        </Badge>
      );
    }
    if (status === "BUSY") {
      return (
        <Badge
          variant="outline"
          className={`bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 text-[11px] font-semibold w-fit ${className}`}
        >
          <Activity className="h-3 w-3 mr-1 text-amber-600" />
          On Job
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className={`bg-muted text-muted-foreground text-[11px] font-medium w-fit ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5 inline-block" />
        Offline
      </Badge>
    );
  }

  // Verification Badge
  if (status === "verified") {
    return (
      <Badge
        variant="outline"
        className={`bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 text-[11px] font-semibold w-fit ${className}`}
      >
        <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
        Verified
      </Badge>
    );
  }
  if (status === "pending_verification") {
    return (
      <Badge
        variant="outline"
        className={`bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 text-[11px] font-semibold w-fit ${className}`}
      >
        <Clock className="h-3 w-3 mr-1 text-amber-600" />
        Pending Verification
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={`bg-rose-50 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 text-[11px] font-semibold w-fit ${className}`}
    >
      <AlertTriangle className="h-3 w-3 mr-1 text-rose-600" />
      Suspended
    </Badge>
  );
}
