"use client";

import * as React from "react";
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import type { SocietyBookingItem } from "../types";

interface SocietyBookingsTabProps {
  bookings: SocietyBookingItem[];
}

export function SocietyBookingsTab({ bookings }: SocietyBookingsTabProps) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center space-y-2">
        <Calendar className="h-8 w-8 text-muted-foreground mx-auto" />
        <h4 className="text-sm font-bold text-foreground">No Booking Records</h4>
        <p className="text-xs text-muted-foreground">
          No service bookings have been logged for this society yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-emerald-700" />
          <span>Society Service Bookings History ({bookings.length})</span>
        </h3>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Booking Ref</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Assigned Worker</TableHead>
            <TableHead>Service Title</TableHead>
            <TableHead>Scheduled Date</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id} className="hover:bg-muted/40">
              <TableCell className="font-mono text-xs font-bold text-foreground">
                <Link
                  href={`/super-admin/bookings/${booking.id}`}
                  className="hover:text-emerald-700 hover:underline"
                >
                  {booking.bookingNumber}
                </Link>
              </TableCell>

              <TableCell className="text-xs font-semibold text-foreground">
                {booking.customerName}
              </TableCell>

              <TableCell className="text-xs text-muted-foreground">
                {booking.workerName || "Unassigned"}
              </TableCell>

              <TableCell className="text-xs font-medium text-foreground">
                {booking.serviceTitle}
              </TableCell>

              <TableCell className="text-xs text-muted-foreground">
                {booking.scheduledStartAt}
              </TableCell>

              <TableCell className="text-xs font-mono font-bold text-foreground">
                ₹{booking.totalAmount}
              </TableCell>

              <TableCell>
                {booking.status === "SERVICE_COMPLETED" || booking.status === "BOOKING_COMPLETED" ? (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                    Completed
                  </Badge>
                ) : booking.status === "SERVICE_STARTED" || booking.status === "ON_THE_WAY" ? (
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 text-[10px] font-bold">
                    In Progress
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-blue-50 text-blue-800 text-[10px] font-bold">
                    Confirmed
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
