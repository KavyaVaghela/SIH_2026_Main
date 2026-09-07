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
import { WelfareStatusBadge } from "./welfare-status-badge";
import {
  Eye,
  HeartHandshake,
  MoreVertical,
  User,
  Building2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import type { WorkerWelfareRecord } from "../types";

interface WelfareRecordsTableProps {
  records: WorkerWelfareRecord[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onInspectRecord: (record: WorkerWelfareRecord) => void;
  isLoading?: boolean;
}

export function WelfareRecordsTable({
  records,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onInspectRecord,
  isLoading,
}: WelfareRecordsTableProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker</TableHead>
              <TableHead>Cooperative Society</TableHead>
              <TableHead>Coverage Type</TableHead>
              <TableHead>Policy Reference</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Current Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
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

  if (records.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
          <HeartHandshake className="h-6 w-6 text-emerald-800 dark:text-emerald-300" />
        </div>
        <h3 className="text-base font-bold text-foreground">No Welfare Records Found</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          No worker welfare or insurance records match your active search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-bold text-foreground">Worker Craftsman</TableHead>
            <TableHead className="font-bold text-foreground">Cooperative Society</TableHead>
            <TableHead className="font-bold text-foreground">Coverage Scheme</TableHead>
            <TableHead className="font-bold text-foreground">Policy Reference</TableHead>
            <TableHead className="font-bold text-foreground">Coverage Expiry</TableHead>
            <TableHead className="font-bold text-foreground">Current Status</TableHead>
            <TableHead className="text-right font-bold text-foreground">Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {records.map((record) => {
            const dropdownItems = [
              {
                label: "Inspect Welfare Record",
                icon: <Eye className="h-3.5 w-3.5 text-emerald-700" />,
                onClick: () => onInspectRecord(record),
              },
              {
                label: `View Worker Profile (${record.workerName})`,
                icon: <User className="h-3.5 w-3.5 text-emerald-700" />,
                onClick: () => {
                  window.location.href = `/super-admin/workforce/${record.workerId}`;
                },
              },
              {
                label: `View Society (${record.societyName})`,
                icon: <Building2 className="h-3.5 w-3.5 text-emerald-700" />,
                onClick: () => {
                  window.location.href = `/super-admin/societies/${record.societyId}`;
                },
              },
            ];

            return (
              <TableRow key={record.id} className="hover:bg-muted/40 transition-colors">
                {/* Worker Identity */}
                <TableCell>
                  <div className="space-y-0.5">
                    <Link
                      href={`/super-admin/workforce/${record.workerId}`}
                      className="font-bold text-xs text-foreground hover:text-emerald-700 hover:underline flex items-center"
                    >
                      <User className="h-3 w-3 mr-1 text-emerald-700 shrink-0" />
                      {record.workerName}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">{record.workerProfession}</p>
                  </div>
                </TableCell>

                {/* Cooperative Society */}
                <TableCell className="text-xs font-medium text-foreground max-w-[160px] truncate" title={record.societyName}>
                  <Link
                    href={`/super-admin/societies/${record.societyId}`}
                    className="hover:underline hover:text-emerald-700"
                  >
                    {record.societyName}
                  </Link>
                </TableCell>

                {/* Coverage Type */}
                <TableCell>
                  <div className="space-y-0.5 max-w-[180px]">
                    <span className="text-xs font-semibold text-foreground truncate block">
                      {record.coverageType}
                    </span>
                    {record.providerName && (
                      <span className="text-[10px] text-muted-foreground truncate block">
                        {record.providerName}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Policy Reference */}
                <TableCell>
                  {record.policyNumber ? (
                    <span className="font-mono text-xs font-bold text-foreground">
                      {record.policyNumber}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">None Assigned</span>
                  )}
                </TableCell>

                {/* Expiry Date & Countdown */}
                <TableCell>
                  {record.expiryDate ? (
                    <div className="space-y-0.5">
                      <span className="text-xs text-foreground font-medium block">
                        {record.expiryDate}
                      </span>
                      {record.daysUntilExpiry !== null && (
                        <span
                          className={`text-[10px] font-semibold block ${
                            record.daysUntilExpiry < 0
                              ? "text-rose-600"
                              : record.daysUntilExpiry <= 30
                              ? "text-amber-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {record.daysUntilExpiry < 0
                            ? `${Math.abs(record.daysUntilExpiry)} days overdue`
                            : `${record.daysUntilExpiry} days remaining`}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">N/A</span>
                  )}
                </TableCell>

                {/* Status Badge */}
                <TableCell>
                  <WelfareStatusBadge status={record.coverageStatus} />
                </TableCell>

                {/* Action Dropdown */}
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
