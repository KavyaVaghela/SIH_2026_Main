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
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingDown, ArrowUpRight, AlertTriangle, Calendar } from "lucide-react";
import type { UnderutilizedWorkerItem, UnderutilizedTimeframe } from "../types";

interface UnderutilizedWorkersPanelProps {
  workers: UnderutilizedWorkerItem[];
  timeframe: UnderutilizedTimeframe;
  onTimeframeChange: (tf: UnderutilizedTimeframe) => void;
  isLoading?: boolean;
}

export function UnderutilizedWorkersPanel({
  workers,
  timeframe,
  onTimeframeChange,
  isLoading,
}: UnderutilizedWorkersPanelProps) {
  return (
    <Card className="border shadow-sm border-rose-200/80 dark:border-rose-900/60 bg-gradient-to-br from-card via-card to-rose-950/5 dark:to-rose-950/20">
      <CardHeader className="pb-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            <CardTitle className="text-base font-bold text-foreground">
              Underutilized Skilled Workers Intelligence
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Identifies skilled cooperative workers receiving very few or zero job allocations during the selected window.
          </CardDescription>
        </div>

        {/* Timeframe Toggle Buttons */}
        <div className="flex items-center space-x-1 bg-muted/60 p-1 rounded-lg border self-start sm:self-auto shrink-0">
          {(["7d", "30d", "90d"] as UnderutilizedTimeframe[]).map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? "default" : "ghost"}
              size="sm"
              onClick={() => onTimeframeChange(tf)}
              className={
                timeframe === tf
                  ? "bg-rose-700 text-white hover:bg-rose-800 h-7 px-3 text-xs font-semibold shadow-xs"
                  : "h-7 px-3 text-xs text-muted-foreground hover:text-foreground"
              }
            >
              {tf === "7d" ? "Last 7 Days" : tf === "30d" ? "Last 30 Days" : "Last 90 Days"}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-bold text-foreground">Worker Name</TableHead>
              <TableHead className="font-bold text-foreground">Primary Skill</TableHead>
              <TableHead className="font-bold text-foreground">Cooperative Society</TableHead>
              <TableHead className="font-bold text-foreground">Last Job Date</TableHead>
              <TableHead className="font-bold text-foreground">Jobs in Period ({timeframe})</TableHead>
              <TableHead className="font-bold text-foreground">Utilization Index</TableHead>
              <TableHead className="text-right font-bold text-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {workers.map((worker) => (
              <TableRow key={worker.id} className="hover:bg-rose-50/30 dark:hover:bg-rose-950/20">
                <TableCell>
                  <div className="space-y-0.5">
                    <Link
                      href={`/super-admin/workforce/${worker.id}`}
                      className="font-bold text-sm text-foreground hover:text-rose-600 hover:underline"
                    >
                      {worker.fullName}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">{worker.phone}</p>
                  </div>
                </TableCell>

                <TableCell className="text-xs font-semibold text-foreground">
                  {worker.primarySkill}
                </TableCell>

                <TableCell className="text-xs text-muted-foreground">
                  {worker.societyName}
                </TableCell>

                <TableCell className="text-xs text-muted-foreground flex items-center mt-2">
                  <Calendar className="h-3.5 w-3.5 mr-1 text-rose-500" />
                  {worker.lastJobDate}
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="bg-rose-50 text-rose-900 border-rose-200 text-xs font-bold">
                    {worker.jobsInSelectedPeriod} Jobs
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-muted h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-600 h-full rounded-full"
                        style={{ width: `${worker.utilizationScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-400">
                      {worker.utilizationScore}%
                    </span>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <Link
                    href={`/super-admin/workforce/${worker.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "h-7 px-2.5 text-xs font-semibold border-rose-300 text-rose-800 hover:bg-rose-50"
                    )}
                  >
                    Inspect Worker
                    <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="p-3 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-xs text-rose-900 dark:text-rose-200 flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-bold">Super Admin Allocation Action: </span>
            Underutilized skilled workers can be re-prioritized for local demand surges in District 4 or offered skill refresh subsidies through their respective society admins.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
