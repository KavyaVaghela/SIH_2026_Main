import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, UserX, Activity, Clock, Slash } from "lucide-react";
import type { WorkerAccountStatus, WorkerAvailabilityStatus } from "../types";

interface WorkerStatusBadgeProps {
  accountStatus: WorkerAccountStatus;
  availabilityStatus?: WorkerAvailabilityStatus;
  showAvailability?: boolean;
}

export function WorkerStatusBadge({
  accountStatus,
  availabilityStatus,
  showAvailability = true,
}: WorkerStatusBadgeProps) {
  const isAccountActive = accountStatus === "ACTIVE";

  const getAvailabilityPill = (status?: WorkerAvailabilityStatus) => {
    switch (status) {
      case "AVAILABLE":
        return (
          <span className="inline-flex items-center text-[10px] text-emerald-800 dark:text-emerald-300 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
            Available
          </span>
        );
      case "BUSY":
        return (
          <span className="inline-flex items-center text-[10px] text-amber-800 dark:text-amber-300 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-1" />
            On Job / Busy
          </span>
        );
      case "UNAVAILABLE":
        return (
          <span className="inline-flex items-center text-[10px] text-muted-foreground font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mr-1" />
            Unavailable
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col space-y-0.5 items-start">
      {/* 1. Account Status (Primary) */}
      {isAccountActive ? (
        <Badge
          variant="outline"
          className="border-emerald-600/30 text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 text-[10px] font-semibold px-2 py-0 h-4"
        >
          <CheckCircle2 className="h-2.5 w-2.5 mr-1 text-emerald-600" />
          Active Account
        </Badge>
      ) : (
        <Badge
          variant="destructive"
          className="text-[10px] font-semibold px-2 py-0 h-4 bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
        >
          <UserX className="h-2.5 w-2.5 mr-1" />
          Deactivated
        </Badge>
      )}

      {/* 2. Availability (Contextual sub-status when account is active) */}
      {showAvailability && isAccountActive && availabilityStatus && (
        <div className="pt-0.5">
          {getAvailabilityPill(availabilityStatus)}
        </div>
      )}
    </div>
  );
}
