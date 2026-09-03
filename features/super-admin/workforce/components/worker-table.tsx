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
import { WorkerStatusBadge } from "./worker-status-badge";
import {
  Eye,
  Star,
  Users,
  Briefcase,
  MoreVertical,
  Calendar,
  BarChart2,
  HeartHandshake,
} from "lucide-react";
import type { WorkerListItem } from "../types";

interface WorkerTableProps {
  data: WorkerListItem[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function WorkerTable({
  data,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  isLoading,
}: WorkerTableProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker Name</TableHead>
              <TableHead>Society</TableHead>
              <TableHead>Primary Skill</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Jobs (Comp / Total)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
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
          <Users className="h-6 w-6 text-emerald-800 dark:text-emerald-300" />
        </div>
        <h3 className="text-base font-bold text-foreground">No Cooperative Workers Found</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          No worker records matched your search query or filter parameters. Try clearing your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-bold text-foreground">Worker Name & Contact</TableHead>
            <TableHead className="font-bold text-foreground">Cooperative Society</TableHead>
            <TableHead className="font-bold text-foreground">Primary Skill</TableHead>
            <TableHead className="font-bold text-foreground">Experience</TableHead>
            <TableHead className="font-bold text-foreground">Availability</TableHead>
            <TableHead className="font-bold text-foreground">Verification</TableHead>
            <TableHead className="font-bold text-foreground">Rating</TableHead>
            <TableHead className="font-bold text-foreground">Jobs (Done / Total)</TableHead>
            <TableHead className="text-right font-bold text-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((worker) => {
            const dropdownItems = [
              {
                label: "View Profile Overview",
                icon: <Eye className="h-3.5 w-3.5 text-emerald-700" />,
                onClick: () => {
                  window.location.href = `/super-admin/workforce/${worker.id}`;
                },
              },
              {
                label: "View Bookings History",
                icon: <Calendar className="h-3.5 w-3.5 text-emerald-700" />,
                onClick: () => {
                  window.location.href = `/super-admin/workforce/${worker.id}?tab=bookings`;
                },
              },
              {
                label: "View Performance Benchmark",
                icon: <BarChart2 className="h-3.5 w-3.5 text-emerald-700" />,
                onClick: () => {
                  window.location.href = `/super-admin/workforce/${worker.id}?tab=performance`;
                },
              },
              {
                label: "View Welfare / Insurance",
                icon: <HeartHandshake className="h-3.5 w-3.5 text-emerald-700" />,
                onClick: () => {
                  window.location.href = `/super-admin/workforce/${worker.id}?tab=welfare`;
                },
              },
            ];

            return (
              <TableRow key={worker.id} className="hover:bg-muted/40 transition-colors">
                <TableCell>
                  <div className="space-y-0.5">
                    <Link
                      href={`/super-admin/workforce/${worker.id}`}
                      className="font-bold text-sm text-foreground hover:text-emerald-700 hover:underline"
                    >
                      {worker.fullName}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">{worker.phone || worker.email}</p>
                  </div>
                </TableCell>

                <TableCell className="text-xs font-semibold text-foreground max-w-[200px] truncate">
                  {worker.societyName}
                </TableCell>

                <TableCell>
                  <div className="flex items-center space-x-1.5 text-xs font-medium text-foreground">
                    <Briefcase className="h-3.5 w-3.5 text-emerald-700" />
                    <span>{worker.profession}</span>
                  </div>
                </TableCell>

                <TableCell className="text-xs text-muted-foreground">
                  {worker.experienceYears} Yrs
                </TableCell>

                <TableCell>
                  <WorkerStatusBadge type="availability" status={worker.availabilityStatus} />
                </TableCell>

                <TableCell>
                  <WorkerStatusBadge type="verification" status={worker.verificationStatus} />
                </TableCell>

                <TableCell>
                  <div className="flex items-center space-x-1 text-xs font-bold text-foreground">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span>{worker.averageRating}</span>
                  </div>
                </TableCell>

                <TableCell className="text-xs font-mono font-semibold text-foreground">
                  {worker.completedJobs} / {worker.totalJobs}
                </TableCell>

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
