import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusType =
  | "pending"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "available"
  | "busy"
  | "offline"
  | "verified"
  | "paid"
  | "unpaid"
  | "overdue";

export interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" | "success" | "warning" | "info" }> = {
  pending: { label: "Pending", variant: "warning" },
  assigned: { label: "Assigned", variant: "info" },
  in_progress: { label: "In Progress", variant: "info" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  available: { label: "Available", variant: "success" },
  busy: { label: "Busy", variant: "warning" },
  offline: { label: "Offline", variant: "secondary" },
  verified: { label: "Cooperative Verified", variant: "success" },
  paid: { label: "Paid", variant: "success" },
  unpaid: { label: "Unpaid", variant: "warning" },
  overdue: { label: "Overdue", variant: "destructive" },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const normalizedKey = status.toLowerCase();
  const config = statusConfig[normalizedKey] || {
    label: label || status,
    variant: "secondary" as const,
  };

  return (
    <Badge variant={config.variant} className={cn("capitalize font-medium shadow-none", className)}>
      {label || config.label}
    </Badge>
  );
}
