"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle2,
  Activity,
  AlertTriangle,
  CreditCard,
  CheckCircle,
  XCircle,
  Truck,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { BookingStatus, PaymentStatus, BookingLifecycleStage } from "../types";

interface BookingStatusBadgeProps {
  type?: "status" | "payment" | "stage";
  status: BookingStatus | PaymentStatus | BookingLifecycleStage | string;
  className?: string;
}

export function BookingStatusBadge({
  type = "status",
  status,
  className = "",
}: BookingStatusBadgeProps) {
  // Payment Status Badges
  if (type === "payment") {
    switch (status) {
      case "PAID":
        return (
          <Badge
            variant="outline"
            className={`bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 text-[11px] font-semibold ${className}`}
          >
            <CheckCircle className="h-3 w-3 mr-1 text-emerald-600" />
            Paid & Settled
          </Badge>
        );
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className={`bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 text-[11px] font-semibold ${className}`}
          >
            <Clock className="h-3 w-3 mr-1 text-amber-600" />
            Escrow Pending
          </Badge>
        );
      case "REFUNDED":
        return (
          <Badge
            variant="outline"
            className={`bg-blue-50 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 text-[11px] font-semibold ${className}`}
          >
            <CreditCard className="h-3 w-3 mr-1 text-blue-600" />
            Refunded
          </Badge>
        );
      case "FAILED":
      default:
        return (
          <Badge
            variant="outline"
            className={`bg-rose-50 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 text-[11px] font-semibold ${className}`}
          >
            <XCircle className="h-3 w-3 mr-1 text-rose-600" />
            Payment Failed
          </Badge>
        );
    }
  }

  // Lifecycle Stage Badges
  if (type === "stage") {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className={`bg-amber-50 text-amber-800 border-amber-200 text-[11px] font-bold ${className}`}>
            <Clock className="h-3 w-3 mr-1 text-amber-600" /> Pending Dispatch
          </Badge>
        );
      case "ACCEPTED":
        return (
          <Badge variant="outline" className={`bg-blue-50 text-blue-800 border-blue-200 text-[11px] font-bold ${className}`}>
            <CheckCircle2 className="h-3 w-3 mr-1 text-blue-600" /> Worker Assigned
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge variant="outline" className={`bg-indigo-50 text-indigo-800 border-indigo-200 text-[11px] font-bold ${className}`}>
            <Activity className="h-3 w-3 mr-1 text-indigo-600 animate-pulse" /> Active In-Progress
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge variant="outline" className={`bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px] font-bold ${className}`}>
            <ShieldCheck className="h-3 w-3 mr-1 text-emerald-600" /> Service Completed
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="outline" className={`bg-rose-50 text-rose-800 border-rose-200 text-[11px] font-bold ${className}`}>
            <AlertTriangle className="h-3 w-3 mr-1 text-rose-600" /> Cancelled
          </Badge>
        );
    }
  }

  // Canonical Booking Status Badges
  switch (status) {
    case "REQUEST_SENT":
      return (
        <Badge variant="outline" className={`bg-slate-100 text-slate-800 border-slate-200 text-[11px] font-medium ${className}`}>
          <Clock className="h-3 w-3 mr-1 text-slate-500" />
          Request Sent
        </Badge>
      );
    case "WORKER_REVIEWING":
    case "WORKER_INTERESTED":
      return (
        <Badge variant="outline" className={`bg-blue-50 text-blue-800 border-blue-200 text-[11px] font-medium ${className}`}>
          <Clock className="h-3 w-3 mr-1 text-blue-500" />
          Worker Reviewing
        </Badge>
      );
    case "CUSTOMER_CONFIRMATION_PENDING":
    case "BOOKING_CONFIRMED":
      return (
        <Badge variant="outline" className={`bg-amber-50 text-amber-800 border-amber-200 text-[11px] font-semibold ${className}`}>
          <Clock className="h-3 w-3 mr-1 text-amber-600" />
          Confirmation Pending
        </Badge>
      );
    case "WORKER_ACCEPTED":
      return (
        <Badge variant="outline" className={`bg-sky-50 text-sky-800 border-sky-200 text-[11px] font-semibold ${className}`}>
          <CheckCircle2 className="h-3 w-3 mr-1 text-sky-600" />
          Worker Accepted
        </Badge>
      );
    case "ON_THE_WAY":
      return (
        <Badge variant="outline" className={`bg-indigo-50 text-indigo-800 border-indigo-200 text-[11px] font-semibold ${className}`}>
          <Truck className="h-3 w-3 mr-1 text-indigo-600" />
          On The Way
        </Badge>
      );
    case "ARRIVED":
      return (
        <Badge variant="outline" className={`bg-indigo-50 text-indigo-800 border-indigo-200 text-[11px] font-semibold ${className}`}>
          <Truck className="h-3 w-3 mr-1 text-indigo-600" />
          Arrived On-Site
        </Badge>
      );
    case "OTP_VERIFIED":
      return (
        <Badge variant="outline" className={`bg-purple-50 text-purple-800 border-purple-200 text-[11px] font-semibold ${className}`}>
          <ShieldCheck className="h-3 w-3 mr-1 text-purple-600" />
          OTP Verified
        </Badge>
      );
    case "SERVICE_STARTED":
      return (
        <Badge variant="outline" className={`bg-amber-50 text-amber-800 border-amber-200 text-[11px] font-semibold ${className}`}>
          <Zap className="h-3 w-3 mr-1 text-amber-600 animate-pulse" />
          Job In Progress
        </Badge>
      );
    case "SERVICE_COMPLETED":
    case "BILL_GENERATED":
    case "PAYMENT_PENDING":
    case "PAYMENT_RECEIVED":
    case "BOOKING_COMPLETED":
      return (
        <Badge variant="outline" className={`bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px] font-semibold ${className}`}>
          <CheckCircle className="h-3 w-3 mr-1 text-emerald-600" />
          Completed
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="outline" className={`bg-rose-50 text-rose-800 border-rose-200 text-[11px] font-semibold ${className}`}>
          <AlertTriangle className="h-3 w-3 mr-1 text-rose-600" />
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={`bg-muted text-muted-foreground text-[11px] ${className}`}>
          {String(status).replace(/_/g, " ")}
        </Badge>
      );
  }
}
