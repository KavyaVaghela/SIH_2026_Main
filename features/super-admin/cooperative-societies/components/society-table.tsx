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
import { SocietyStatusBadge } from "./society-status-badge";
import {
  Eye,
  CheckCircle2,
  AlertTriangle,
  MoreVertical,
  Star,
  Users,
  Building2,
  Activity,
  BarChart2,
} from "lucide-react";
import type { SocietyListItem, SocietyStatus } from "../types";

interface SocietyTableProps {
  data: SocietyListItem[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onStatusAction: (society: SocietyListItem, targetStatus: SocietyStatus) => void;
  isLoading?: boolean;
}

export function SocietyTable({
  data,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onStatusAction,
  isLoading,
}: SocietyTableProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Society Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Society Admin</TableHead>
              <TableHead>Workers</TableHead>
              <TableHead>Active Jobs</TableHead>
              <TableHead>Bookings</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reg Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
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
          <Building2 className="h-6 w-6 text-emerald-800 dark:text-emerald-300" />
        </div>
        <h3 className="text-base font-bold text-foreground">No Cooperative Societies Found</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          No societies matched your active search query or filter parameters. Try clearing your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-bold text-foreground">Society Name & Code</TableHead>
            <TableHead className="font-bold text-foreground">Location</TableHead>
            <TableHead className="font-bold text-foreground">Society Admin</TableHead>
            <TableHead className="font-bold text-foreground">Workers</TableHead>
            <TableHead className="font-bold text-foreground">Active Jobs</TableHead>
            <TableHead className="font-bold text-foreground">Bookings</TableHead>
            <TableHead className="font-bold text-foreground">Rating</TableHead>
            <TableHead className="font-bold text-foreground">Status</TableHead>
            <TableHead className="font-bold text-foreground">Reg Date</TableHead>
            <TableHead className="text-right font-bold text-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((society) => {
            const dropdownItems = [
              {
                label: "View Society Details",
                icon: <Eye className="h-3.5 w-3.5 text-emerald-700" />,
                onClick: () => {
                  window.location.href = `/super-admin/societies/${society.id}`;
                },
              },
              {
                label: "View Performance",
                icon: <BarChart2 className="h-3.5 w-3.5 text-emerald-700" />,
                onClick: () => {
                  window.location.href = `/super-admin/societies/${society.id}?tab=performance`;
                },
              },
              ...(society.status !== "ACTIVE"
                ? [
                    {
                      label: "Approve & Activate",
                      icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />,
                      onClick: () => onStatusAction(society, "ACTIVE"),
                    },
                  ]
                : []),
              ...(society.status === "ACTIVE"
                ? [
                    {
                      label: "Suspend Society",
                      icon: <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />,
                      destructive: true,
                      onClick: () => onStatusAction(society, "SUSPENDED"),
                    },
                  ]
                : []),
            ];

            return (
              <TableRow key={society.id} className="hover:bg-muted/40 transition-colors">
                <TableCell>
                  <div className="space-y-0.5">
                    <Link
                      href={`/super-admin/societies/${society.id}`}
                      className="font-bold text-sm text-foreground hover:text-emerald-700 hover:underline"
                    >
                      {society.name}
                    </Link>
                    <div className="flex items-center space-x-2 text-[11px] text-muted-foreground">
                      <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">
                        {society.code}
                      </span>
                      <span>{society.registrationNumber}</span>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-xs text-muted-foreground font-medium">
                  {society.location}
                </TableCell>

                <TableCell>
                  <div className="text-xs space-y-0.5">
                    <p className="font-semibold text-foreground">{society.adminName}</p>
                    <p className="text-[11px] text-muted-foreground">{society.contactPhone}</p>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-foreground">
                    <Users className="h-3.5 w-3.5 text-emerald-700" />
                    <span>{society.totalWorkers}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center space-x-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                    <Activity className="h-3.5 w-3.5" />
                    <span>{society.activeJobs}</span>
                  </div>
                </TableCell>

                <TableCell className="text-xs font-medium text-foreground">
                  {society.totalBookings.toLocaleString()}
                </TableCell>

                <TableCell>
                  <div className="flex items-center space-x-1 text-xs font-bold text-foreground">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span>{society.averageRating}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <SocietyStatusBadge status={society.status} isActive={society.isActive} />
                </TableCell>

                <TableCell className="text-xs text-muted-foreground">
                  {society.registrationDate}
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
