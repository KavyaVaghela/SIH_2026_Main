"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";
import type { WelfareCoverageStatus } from "../types";

interface WelfareStatusBadgeProps {
  status: WelfareCoverageStatus;
  className?: string;
}

export function WelfareStatusBadge({ status, className = "" }: WelfareStatusBadgeProps) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge
          variant="outline"
          className={`bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 text-xs font-bold ${className}`}
        >
          <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600 inline" />
          Active Policy
        </Badge>
      );

    case "EXPIRING_SOON":
      return (
        <Badge
          variant="outline"
          className={`bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 text-xs font-bold ${className}`}
        >
          <Clock className="h-3 w-3 mr-1 text-amber-600 inline" />
          Expiring Soon
        </Badge>
      );

    case "EXPIRED":
      return (
        <Badge
          variant="outline"
          className={`bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 text-xs font-bold ${className}`}
        >
          <XCircle className="h-3 w-3 mr-1 text-rose-600 inline" />
          Policy Expired
        </Badge>
      );

    case "NO_COVERAGE":
    default:
      return (
        <Badge
          variant="outline"
          className={`bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 text-xs font-bold ${className}`}
        >
          <AlertTriangle className="h-3 w-3 mr-1 text-slate-500 inline" />
          No Coverage
        </Badge>
      );
  }
}
