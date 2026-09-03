"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Building2,
  CheckCircle2,
  AlertTriangle,
  HeartHandshake,
  CalendarX,
} from "lucide-react";
import type { NotificationCategory } from "../types";

interface NotificationCategoryBadgeProps {
  category: NotificationCategory;
  className?: string;
}

export function NotificationCategoryBadge({
  category,
  className = "",
}: NotificationCategoryBadgeProps) {
  switch (category) {
    case "WORKER_SHORTAGE":
      return (
        <Badge
          variant="outline"
          className={`bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 text-[11px] font-bold ${className}`}
        >
          <Users className="h-3 w-3 mr-1 text-amber-600 inline" />
          Worker Shortage
        </Badge>
      );

    case "NEW_SOCIETY_REGISTRATION":
      return (
        <Badge
          variant="outline"
          className={`bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950/70 dark:text-blue-200 text-[11px] font-bold ${className}`}
        >
          <Building2 className="h-3 w-3 mr-1 text-blue-600 inline" />
          New Society Registration
        </Badge>
      );

    case "SOCIETY_AWAITING_APPROVAL":
      return (
        <Badge
          variant="outline"
          className={`bg-indigo-50 text-indigo-900 border-indigo-300 dark:bg-indigo-950/70 dark:text-indigo-200 text-[11px] font-bold ${className}`}
        >
          <CheckCircle2 className="h-3 w-3 mr-1 text-indigo-600 inline" />
          Society Awaiting Approval
        </Badge>
      );

    case "HIGH_COMPLAINTS":
      return (
        <Badge
          variant="outline"
          className={`bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 text-[11px] font-bold ${className}`}
        >
          <AlertTriangle className="h-3 w-3 mr-1 text-rose-600 inline" />
          High Complaints
        </Badge>
      );

    case "WELFARE_EXPIRY":
      return (
        <Badge
          variant="outline"
          className={`bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 text-[11px] font-bold ${className}`}
        >
          <HeartHandshake className="h-3 w-3 mr-1 text-emerald-700 inline" />
          Welfare Expiry
        </Badge>
      );

    case "UNUSUAL_CANCELLATION":
    default:
      return (
        <Badge
          variant="outline"
          className={`bg-purple-50 text-purple-900 border-purple-300 dark:bg-purple-950/70 dark:text-purple-200 text-[11px] font-bold ${className}`}
        >
          <CalendarX className="h-3 w-3 mr-1 text-purple-600 inline" />
          Cancellation Surge
        </Badge>
      );
  }
}
