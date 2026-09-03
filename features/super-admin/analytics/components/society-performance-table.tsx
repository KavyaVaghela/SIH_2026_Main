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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Star, Info, ArrowUpRight } from "lucide-react";
import type { SocietyPerformanceMetric } from "../types";

interface SocietyPerformanceTableProps {
  societies: SocietyPerformanceMetric[];
  isLoading?: boolean;
}

export function SocietyPerformanceTable({
  societies,
  isLoading,
}: SocietyPerformanceTableProps) {
  if (isLoading) {
    return (
      <Card className="border shadow-sm p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-44 w-full rounded-xl" />
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            <CardTitle className="text-base font-bold text-foreground">
              Cooperative Society Performance Benchmark Table
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Multi-metric operational review across all registered federations
          </CardDescription>
        </div>

        <Link
          href="/super-admin/societies"
          className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:underline flex items-center self-start sm:self-auto"
        >
          Societies Module
          <ArrowUpRight className="h-3.5 w-3.5 ml-0.5" />
        </Link>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Transparent Formula Callout */}
        <div className="p-3 rounded-lg bg-muted/40 border text-xs text-muted-foreground leading-relaxed flex items-start space-x-2">
          <Info className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
          <p>
            <span className="font-bold text-foreground">Transparent Composite Benchmark Formula: </span>
            Benchmark Score is derived strictly from:{" "}
            <span className="font-semibold text-foreground">Completion Rate (35%)</span> +{" "}
            <span className="font-semibold text-foreground">Rating × 20 (30%)</span> +{" "}
            <span className="font-semibold text-foreground">Worker Utilization (20%)</span> +{" "}
            <span className="font-semibold text-foreground">(100 − Cancellation Rate) (15%)</span>.
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-bold text-foreground">Cooperative Society</TableHead>
              <TableHead className="font-bold text-foreground">Location</TableHead>
              <TableHead className="font-bold text-foreground">Total Bookings</TableHead>
              <TableHead className="font-bold text-foreground">Completion %</TableHead>
              <TableHead className="font-bold text-foreground">Utilization %</TableHead>
              <TableHead className="font-bold text-foreground">Rating</TableHead>
              <TableHead className="font-bold text-foreground">Cancellations</TableHead>
              <TableHead className="font-bold text-foreground">Complaints</TableHead>
              <TableHead className="font-bold text-foreground text-right">Benchmark Score</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {societies.map((soc) => (
              <TableRow key={soc.societyId} className="hover:bg-muted/30">
                <TableCell>
                  <Link
                    href={`/super-admin/societies/${soc.societyId}`}
                    className="font-bold text-xs text-foreground hover:text-emerald-700 hover:underline block"
                  >
                    {soc.societyName}
                  </Link>
                  {soc.highlightBadge && (
                    <span className="text-[10px] text-muted-foreground">{soc.highlightBadge}</span>
                  )}
                </TableCell>

                <TableCell className="text-xs text-muted-foreground">
                  {soc.location}
                </TableCell>

                <TableCell className="font-mono font-bold text-xs text-foreground">
                  {soc.totalBookings}
                </TableCell>

                <TableCell className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {soc.completionRate}%
                </TableCell>

                <TableCell className="font-mono text-xs font-semibold text-sky-700 dark:text-sky-400">
                  {soc.workerUtilization}%
                </TableCell>

                <TableCell className="font-mono text-xs font-bold text-amber-600">
                  <span className="flex items-center">
                    <Star className="h-3 w-3 mr-0.5 fill-amber-500 text-amber-500" />
                    {soc.customerRating}
                  </span>
                </TableCell>

                <TableCell className="font-mono text-xs text-foreground">
                  {soc.cancellationRate}%
                </TableCell>

                <TableCell className="font-mono text-xs">
                  {soc.complaintsCount > 5 ? (
                    <span className="text-amber-600 font-bold">{soc.complaintsCount} logged</span>
                  ) : (
                    <span className="text-muted-foreground">{soc.complaintsCount}</span>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-1.5">
                    <Badge className="bg-emerald-800 text-white text-[10px] font-bold">
                      Grade {soc.benchmarkGrade}
                    </Badge>
                    <span className="font-mono font-bold text-xs text-foreground">
                      {soc.benchmarkScore}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
