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
import { ComplaintStatusBadge, ComplaintCategoryBadge } from "./complaint-status-badge";
import {
  Eye,
  MessageSquare,
  MoreVertical,
  User,
  Building2,
  Calendar,
  Briefcase,
} from "lucide-react";
import type { ComplaintDetails } from "../types";

interface ComplaintsTableProps {
  complaints: ComplaintDetails[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function ComplaintsTable({
  complaints,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  isLoading,
}: ComplaintsTableProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Complaint ID</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Worker</TableHead>
              <TableHead>Society</TableHead>
              <TableHead>Date Logged</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
          <MessageSquare className="h-6 w-6 text-emerald-800 dark:text-emerald-300" />
        </div>
        <h3 className="text-base font-bold text-foreground">No Grievances Found</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          No customer or worker complaints matched your search terms or filter selections.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-bold text-foreground">Complaint ID</TableHead>
            <TableHead className="font-bold text-foreground">Category</TableHead>
            <TableHead className="font-bold text-foreground">Customer</TableHead>
            <TableHead className="font-bold text-foreground">Worker Craftsman</TableHead>
            <TableHead className="font-bold text-foreground">Cooperative Society</TableHead>
            <TableHead className="font-bold text-foreground">Date Logged</TableHead>
            <TableHead className="font-bold text-foreground">Current Status</TableHead>
            <TableHead className="text-right font-bold text-foreground">Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {complaints.map((complaint) => {
            const dropdownItems = [
              {
                label: "Inspect Dispute Case",
                icon: <Eye className="h-3.5 w-3.5 text-emerald-700" />,
                onClick: () => {
                  window.location.href = `/super-admin/complaints/${complaint.id}`;
                },
              },
              ...(complaint.bookingId
                ? [
                    {
                      label: `View Booking (${complaint.bookingNumber})`,
                      icon: <Calendar className="h-3.5 w-3.5 text-emerald-700" />,
                      onClick: () => {
                        window.location.href = `/super-admin/bookings/${complaint.bookingId}`;
                      },
                    },
                  ]
                : []),
              ...(complaint.workerId
                ? [
                    {
                      label: `View Worker (${complaint.workerName})`,
                      icon: <User className="h-3.5 w-3.5 text-emerald-700" />,
                      onClick: () => {
                        window.location.href = `/super-admin/workforce/${complaint.workerId}`;
                      },
                    },
                  ]
                : []),
              {
                label: `View Society (${complaint.societyName})`,
                icon: <Building2 className="h-3.5 w-3.5 text-emerald-700" />,
                onClick: () => {
                  window.location.href = `/super-admin/societies/${complaint.societyId}`;
                },
              },
            ];

            return (
              <TableRow
                key={complaint.id}
                className={`hover:bg-muted/40 transition-colors ${
                  complaint.isSafetyCritical ? "bg-rose-50/20 dark:bg-rose-950/10" : ""
                }`}
              >
                {/* Complaint ID */}
                <TableCell>
                  <Link
                    href={`/super-admin/complaints/${complaint.id}`}
                    className="font-mono font-bold text-xs text-foreground hover:text-emerald-700 hover:underline"
                  >
                    {complaint.complaintNumber}
                  </Link>
                </TableCell>

                {/* Category */}
                <TableCell>
                  <ComplaintCategoryBadge
                    category={complaint.category}
                    label={complaint.categoryLabel}
                  />
                </TableCell>

                {/* Customer */}
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{complaint.customerName}</p>
                    <p className="text-[11px] text-muted-foreground">{complaint.customerPhone}</p>
                  </div>
                </TableCell>

                {/* Worker */}
                <TableCell>
                  {complaint.workerId ? (
                    <div className="space-y-0.5">
                      <Link
                        href={`/super-admin/workforce/${complaint.workerId}`}
                        className="text-xs font-semibold text-foreground hover:text-emerald-700 hover:underline flex items-center"
                      >
                        <User className="h-3 w-3 mr-1 text-emerald-700 shrink-0" />
                        {complaint.workerName}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">{complaint.workerProfession}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Unspecified</span>
                  )}
                </TableCell>

                {/* Society */}
                <TableCell className="text-xs font-medium text-foreground max-w-[160px] truncate" title={complaint.societyName}>
                  <Link
                    href={`/super-admin/societies/${complaint.societyId}`}
                    className="hover:underline hover:text-emerald-700"
                  >
                    {complaint.societyName}
                  </Link>
                </TableCell>

                {/* Date */}
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {complaint.createdAt}
                </TableCell>

                {/* Status */}
                <TableCell>
                  <ComplaintStatusBadge status={complaint.status} />
                </TableCell>

                {/* Actions */}
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
