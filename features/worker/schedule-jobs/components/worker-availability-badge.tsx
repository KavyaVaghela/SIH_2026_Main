"use client";

import * as React from "react";
import { ShieldCheck, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { WorkerAvailabilityStatus } from "@/supabase/types/database.types";

export interface WorkerAvailabilityBadgeProps {
  status: WorkerAvailabilityStatus;
}

export function WorkerAvailabilityBadge({ status }: WorkerAvailabilityBadgeProps) {
  if (status === "AVAILABLE") {
    return (
      <Badge variant="success" className="text-xs font-semibold py-0.5 px-2.5 shadow-sm">
        <span className="h-2 w-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
        Dispatch Availability: AVAILABLE
      </Badge>
    );
  }

  if (status === "BUSY") {
    return (
      <Badge variant="warning" className="text-xs font-semibold py-0.5 px-2.5">
        <Clock className="h-3 w-3 mr-1" />
        Dispatch Status: BUSY ON ASSIGNMENT
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="text-xs font-semibold py-0.5 px-2.5 text-muted-foreground">
      <AlertCircle className="h-3 w-3 mr-1" />
      Status: UNAVAILABLE
    </Badge>
  );
}
