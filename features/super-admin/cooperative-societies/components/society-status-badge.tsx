"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";
import type { SocietyStatus } from "../types";

interface SocietyStatusBadgeProps {
  status: SocietyStatus | string;
  isActive?: boolean;
  className?: string;
}

export function SocietyStatusBadge({ status, isActive, className }: SocietyStatusBadgeProps) {
  const isApproved = status === "ACTIVE" || (isActive === true && status !== "REJECTED" && status !== "SUSPENDED");
  const isPending = status === "PENDING" || status === "PENDING_VERIFICATION";
  const isRejected = status === "REJECTED";

  if (isApproved) {
    return (
      <Badge
        variant="outline"
        className={`bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold flex items-center w-fit ${className}`}
      >
        <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
        Active & Verified
      </Badge>
    );
  }

  if (isPending) {
    return (
      <Badge
        variant="outline"
        className={`bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-[11px] font-semibold flex items-center w-fit ${className}`}
      >
        <Clock className="h-3 w-3 mr-1 text-amber-600" />
        Pending Verification
      </Badge>
    );
  }

  if (isRejected) {
    return (
      <Badge
        variant="outline"
        className={`bg-rose-50 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800 text-[11px] font-semibold flex items-center w-fit ${className}`}
      >
        <XCircle className="h-3 w-3 mr-1 text-rose-600" />
        Rejected
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={`bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300 border-slate-200 dark:border-slate-800 text-[11px] font-semibold flex items-center w-fit ${className}`}
    >
      <AlertTriangle className="h-3 w-3 mr-1 text-slate-600" />
      Suspended
    </Badge>
  );
}
