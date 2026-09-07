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
import { Dropdown } from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { BookingStatusBadge } from "./booking-status-badge";
import {
  Eye,
  Calendar,
  MoreVertical,
  User,
  Building2,
  MapPin,
  Clock,
  Briefcase,
} from "lucide-react";
import type { BookingListItem } from "../types";

interface BookingsTableProps {
  data: BookingListItem[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function BookingsTable({
  data,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  isLoading,
}: BookingsTableProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Worker</TableHead>
              <TableHead>Society</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Booking Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
          <Calendar className="h-6 w-6 text-emerald-800 dark:text-emerald-300" />
        </div>
        <h3 className="text-base font-bold text-foreground">No Platform Bookings Found</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          No bookings matched your filter criteria or search query. Try changing date ranges or clearing status filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-bold text-foreground">Booking ID</TableHead>
            <TableHead className="font-bold text-foreground">Customer</TableHead>
            <TableHead className="font-bold text-foreground">Assigned Worker</TableHead>
            <TableHead className="font-bold text-foreground">Cooperative Society</TableHead>
            <TableHead className="font-bold text-foreground">Service Requested</TableHead>
            <TableHead className="font-bold text-foreground">Location</TableHead>
            <TableHead className="font-bold text-foreground">Scheduled Date</TableHead>
            <TableHead className="font-bold text-foreground">Status</TableHead>
            <TableHead className="font-bold text-foreground">Payment</TableHead>
            <TableHead className="text-right font-bold text-foreground">Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((booking) => {
            const dropdownItems = [
              {
                label: "Inspect Booking Details",
                icon: <Eye className="h-3.5 w-3.5 text-emerald-700" />,
                onClick: () => {
                  window.location.href = `/super-admin/bookings/${booking.id}`;
                },
              },
              ...(booking.workerId
                ? [
                    {
                      label: `View Worker (${booking.workerName})`,
                      icon: <User className="h-3.5 w-3.5 text-emerald-700" />,
                      onClick: () => {
                        window.location.href = `/super-admin/workforce/${booking.workerId}`;
                      },
                    },
                  ]
                : []),
              {
                label: `View Society (${booking.societyName})`,
                icon: <Building2 className="h-3.5 w-3.5 text-emerald-700" />,
                onClick: () => {
                  window.location.href = `/super-admin/societies/${booking.societyId}`;
                },
              },
            ];

            return (
              <TableRow key={booking.id} className="hover:bg-muted/40 transition-colors">
                {/* Booking ID */}
                <TableCell>
                  <Link
                    href={`/super-admin/bookings/${booking.id}`}
                    className="font-mono font-bold text-xs text-foreground hover:text-emerald-700 hover:underline"
                  >
                    {booking.bookingNumber}
                  </Link>
                </TableCell>

                {/* Customer */}
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{booking.customerName}</p>
                    <p className="text-[11px] text-muted-foreground">{booking.customerPhone || "Phone N/A"}</p>
                  </div>
                </TableCell>

                {/* Assigned Worker */}
                <TableCell>
                  {booking.workerName ? (
                    <div className="space-y-0.5">
                      <Link
                        href={`/super-admin/workforce/${booking.workerId}`}
                        className="text-xs font-semibold text-foreground hover:text-emerald-700 hover:underline flex items-center"
                      >
                        <User className="h-3 w-3 mr-1 text-emerald-700 shrink-0" />
                        {booking.workerName}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">{booking.workerProfession}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 px-2 py-0.5 rounded-md font-medium inline-flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending Dispatch
                    </span>
                  )}
                </TableCell>

                {/* Society */}
                <TableCell className="text-xs font-medium text-foreground max-w-[160px] truncate" title={booking.societyName}>
                  <Link
                    href={`/super-admin/societies/${booking.societyId}`}
                    className="hover:underline hover:text-emerald-700"
                  >
                    {booking.societyName}
                  </Link>
                </TableCell>

                {/* Service */}
                <TableCell>
                  <div className="space-y-0.5 max-w-[180px]">
                    <p className="text-xs font-semibold text-foreground truncate" title={booking.serviceTitle}>
                      {booking.serviceTitle}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{booking.serviceCategory}</p>
                  </div>
                </TableCell>

                {/* Location */}
                <TableCell>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground max-w-[140px] truncate" title={booking.location}>
                    <MapPin className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                    <span className="truncate">{booking.location}</span>
                  </div>
                </TableCell>

                {/* Scheduled Date */}
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {booking.scheduledStartAt}
                </TableCell>

                {/* Status Badge */}
                <TableCell>
                  <BookingStatusBadge type="status" status={booking.status} />
                </TableCell>

                {/* Payment Status Badge */}
                <TableCell>
                  <BookingStatusBadge type="payment" status={booking.paymentStatus} />
                </TableCell>

                {/* Actions Dropdown */}
                <TableCell className="text-right">
                  <Dropdown
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open Menu</span>
                      </Button>
                    }
                    items={dropdownItems}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
