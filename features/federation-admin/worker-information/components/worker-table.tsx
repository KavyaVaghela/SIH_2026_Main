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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Users, FolderOpen } from "lucide-react";
import { WorkerStatusBadge } from "./worker-status-badge";
import { WorkerPerformanceBadge } from "./worker-performance-badge";
import type { WorkerListItem } from "../types";

interface WorkerTableProps {
  workers: WorkerListItem[];
  isLoading?: boolean;
  onResetFilters?: () => void;
}

export function WorkerTable({
  workers,
  isLoading,
  onResetFilters,
}: WorkerTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (workers.length === 0) {
    return (
      <div className="text-center py-12 px-4 border border-dashed border-border/80 rounded-lg bg-card space-y-3">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <FolderOpen className="h-5 w-5" />
        </div>
        <h4 className="text-sm font-semibold text-foreground">
          No Workers Found
        </h4>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          No workers in this federation match your current search query or filter selection.
        </p>
        {onResetFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="text-xs"
          >
            Reset Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 text-[11px]">
              <TableHead className="font-semibold text-foreground w-[130px]">Worker ID</TableHead>
              <TableHead className="font-semibold text-foreground">Member Name</TableHead>
              <TableHead className="font-semibold text-foreground">Trade / Profession</TableHead>
              <TableHead className="font-semibold text-foreground">Operational Area</TableHead>
              <TableHead className="font-semibold text-foreground">Account Status</TableHead>
              <TableHead className="font-semibold text-foreground">Performance</TableHead>
              <TableHead className="font-semibold text-foreground text-right w-[110px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workers.map((worker) => (
              <TableRow
                key={worker.id}
                className="hover:bg-muted/20 transition-colors group text-xs"
              >
                {/* 1. Worker ID */}
                <TableCell className="font-mono font-medium text-muted-foreground">
                  {worker.id}
                </TableCell>

                {/* 2. Name & Avatar */}
                <TableCell>
                  <div className="flex items-center space-x-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                      {worker.fullName.charAt(0)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-foreground truncate group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors">
                        {worker.fullName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Joined {worker.joiningDate}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* 3. Profession */}
                <TableCell>
                  <span className="font-medium text-foreground">
                    {worker.profession}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    {worker.experienceYears} yrs experience
                  </span>
                </TableCell>

                {/* 4. Area */}
                <TableCell className="text-muted-foreground">
                  <span>{worker.area}</span>
                  <span className="text-[10px] text-muted-foreground/80 block">
                    {worker.city}
                  </span>
                </TableCell>

                {/* 5. Status */}
                <TableCell>
                  <WorkerStatusBadge
                    accountStatus={worker.accountStatus}
                    availabilityStatus={worker.availabilityStatus}
                    showAvailability={true}
                  />
                </TableCell>

                {/* 6. Performance */}
                <TableCell>
                  <WorkerPerformanceBadge
                    rating={worker.averageRating}
                    tier={worker.performanceTier}
                  />
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    {worker.completedJobs} of {worker.totalJobs} jobs
                  </span>
                </TableCell>

                {/* 7. Action: View Worker */}
                <TableCell className="text-right">
                  <Link
                    href={`/federation-admin/worker-information/${encodeURIComponent(worker.id)}`}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-border hover:bg-muted font-medium text-emerald-800 dark:text-emerald-300"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="p-3 bg-muted/20 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Showing {workers.length} registered members</span>
        <span className="italic">Read-only view • Member lifecycle managed in Workforce Management</span>
      </div>
    </div>
  );
}
