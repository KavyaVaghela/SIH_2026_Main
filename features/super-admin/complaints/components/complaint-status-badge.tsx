"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, CheckCircle2, ShieldAlert } from "lucide-react";
import type { ComplaintStatus, ComplaintCategory } from "../types";

interface ComplaintStatusBadgeProps {
  status: ComplaintStatus;
  className?: string;
}

export function ComplaintStatusBadge({ status, className = "" }: ComplaintStatusBadgeProps) {
  switch (status) {
    case "OPEN":
      return (
        <Badge
          variant="outline"
          className={`bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 text-xs font-bold ${className}`}
        >
          <AlertCircle className="h-3 w-3 mr-1 text-amber-600 inline" />
          Open Dispute
        </Badge>
      );

    case "IN_REVIEW":
      return (
        <Badge
          variant="outline"
          className={`bg-sky-50 text-sky-900 border-sky-300 dark:bg-sky-950/70 dark:text-sky-200 text-xs font-bold ${className}`}
        >
          <Clock className="h-3 w-3 mr-1 text-sky-600 inline" />
          In Review
        </Badge>
      );

    case "RESOLVED":
    default:
      return (
        <Badge
          variant="outline"
          className={`bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 text-xs font-bold ${className}`}
        >
          <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600 inline" />
          Resolved
        </Badge>
      );
  }
}

interface ComplaintCategoryBadgeProps {
  category: ComplaintCategory;
  label?: string;
  className?: string;
}

export function ComplaintCategoryBadge({
  category,
  label,
  className = "",
}: ComplaintCategoryBadgeProps) {
  const displayLabel = label || category.replace("_", " ");

  if (category === "SAFETY_ISSUE") {
    return (
      <Badge
        variant="outline"
        className={`bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 text-[11px] font-bold ${className}`}
      >
        <ShieldAlert className="h-3 w-3 mr-1 text-rose-600 inline" />
        {displayLabel}
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={`bg-muted/70 text-foreground text-[11px] font-medium ${className}`}
    >
      {displayLabel}
    </Badge>
  );
}
