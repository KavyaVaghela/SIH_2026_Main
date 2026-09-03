"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  ShieldCheck,
  Building2,
  Navigation,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/formatters/currency";
import { CANONICAL_STATUS_LABELS, type WorkerJobItem } from "../../types";

export interface BookingDetailModalProps {
  booking: WorkerJobItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BookingDetailModal({ booking, isOpen, onClose }: BookingDetailModalProps) {
  if (!booking) return null;

  const statusLabel = CANONICAL_STATUS_LABELS[booking.status] || booking.status;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex flex-wrap items-center gap-2">
          <span>{booking.serviceTitle}</span>
          <Badge variant="outline" className="text-xs font-semibold border-emerald-600/40 text-emerald-700 dark:text-emerald-300">
            {statusLabel}
          </Badge>
        </div>
      }
      description={`Booking Reference: ${booking.bookingNumber}`}
      footer={
        <div className="flex items-center justify-end space-x-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs sm:text-sm text-foreground">
        {/* Customer & Location Box */}
        <div className="p-3.5 rounded-lg border bg-muted/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center font-semibold text-foreground">
              <User className="h-4 w-4 mr-1.5 text-primary" />
              Customer: {booking.customerName}
            </span>
            {booking.customerPhone && (
              <span className="text-muted-foreground flex items-center">
                <Phone className="h-3.5 w-3.5 mr-1" />
                {booking.customerPhone}
              </span>
            )}
          </div>

          <div className="flex items-center text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 mr-1.5 text-emerald-600 shrink-0" />
            <span>Service Address: <strong className="text-foreground">{booking.customerArea}</strong></span>
          </div>

          <div className="flex items-center text-muted-foreground">
            <Navigation className="h-3.5 w-3.5 mr-1.5 text-blue-600 shrink-0" />
            <span>Distance: <strong>{booking.distanceKm} km</strong> from current cooperative base</span>
          </div>
        </div>

        {/* Schedule & Timing Box */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border bg-card space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Scheduled Date</span>
            <div className="flex items-center font-bold text-foreground">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
              {booking.scheduledDate}
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-card space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Slot Timing</span>
            <div className="flex items-center font-bold text-foreground">
              <Clock className="h-3.5 w-3.5 mr-1.5 text-teal-600" />
              {booking.scheduledTime}
            </div>
          </div>
        </div>

        {/* Problem Description */}
        <div className="space-y-1">
          <span className="font-semibold text-muted-foreground text-xs uppercase">Customer Problem Scope</span>
          <p className="p-3 rounded-lg border bg-muted/30 text-xs sm:text-sm leading-relaxed">
            {booking.problemDescription}
          </p>
        </div>

        {/* Financial Overview */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-700/20">
          <div>
            <span className="text-xs text-muted-foreground block">Platform Initial Estimate</span>
            <span className="text-base font-bold text-foreground">{formatINR(booking.totalAmount)}</span>
          </div>

          <div className="text-right">
            <span className="text-xs text-muted-foreground block">Net Worker Payout</span>
            <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
              {formatINR(booking.workerEarnings)}
            </span>
          </div>
        </div>

        {/* Cooperative Notice */}
        <div className="flex items-center text-xs text-muted-foreground pt-1">
          <Building2 className="h-3.5 w-3.5 mr-1.5 text-emerald-600 shrink-0" />
          <span>Assigned through: <strong>{booking.cooperativeName}</strong></span>
        </div>

        {/* Active Job Action if confirmed, accepted, or on the way */}
        {(booking.status === "BOOKING_CONFIRMED" ||
          booking.status === "WORKER_ACCEPTED" ||
          booking.status === "ON_THE_WAY" ||
          booking.status === "ARRIVED") && (
          <div className="pt-2">
            <Link href={`/worker/jobs/${booking.id}`}>
              <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs py-2.5">
                <Navigation className="h-3.5 w-3.5 mr-1.5" />
                Open Active Job &amp; Directions
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Dialog>
  );
}
