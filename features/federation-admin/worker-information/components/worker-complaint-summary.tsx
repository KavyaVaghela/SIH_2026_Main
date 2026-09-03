"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Clock, ShieldCheck, Scale } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WorkerComplaintSummary } from "../types";

interface WorkerComplaintSummaryProps {
  complaints: WorkerComplaintSummary;
}

export function WorkerComplaintSummaryCard({ complaints }: WorkerComplaintSummaryProps) {
  const hasPending = complaints.pendingComplaints > 0;

  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Customer Dispute & Complaint Record
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Conciliated grievances and statutory dispute history
              </CardDescription>
            </div>
          </div>

          <Badge
            variant="outline"
            className={`text-[11px] font-medium self-start sm:self-auto ${
              hasPending
                ? "border-amber-600/30 text-amber-800 dark:text-amber-300 bg-amber-50/50"
                : "border-emerald-600/30 text-emerald-800 dark:text-emerald-300 bg-emerald-50/50"
            }`}
          >
            <ShieldCheck className="h-3 w-3 mr-1" />
            Resolution Rate: {complaints.resolutionRate}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Total Complaints */}
          <div className="p-2.5 rounded border border-border/60 bg-muted/20 space-y-0.5">
            <span className="text-muted-foreground text-[11px]">Total Customer Grievances</span>
            <p className="font-semibold text-foreground text-base">
              {complaints.totalComplaints}
            </p>
            <span className="text-[10px] text-muted-foreground block">Lifetime recorded tickets</span>
          </div>

          {/* Pending Complaints */}
          <div className="p-2.5 rounded border border-border/60 bg-muted/20 space-y-0.5">
            <span className="text-muted-foreground text-[11px] flex items-center space-x-1">
              <Clock className="h-3 w-3 text-amber-600" />
              <span>Pending / Under Review</span>
            </span>
            <p className="font-semibold text-amber-700 dark:text-amber-400 text-base">
              {complaints.pendingComplaints}
            </p>
            <span className="text-[10px] text-muted-foreground block">Active arbitration</span>
          </div>

          {/* Resolved Complaints */}
          <div className="p-2.5 rounded border border-border/60 bg-muted/20 space-y-0.5">
            <span className="text-muted-foreground text-[11px] flex items-center space-x-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              <span>Amicably Resolved</span>
            </span>
            <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-base">
              {complaints.resolvedComplaints}
            </p>
            <span className="text-[10px] text-muted-foreground block">Closed with customer</span>
          </div>
        </div>

        <div className="p-2.5 rounded bg-muted/40 text-[11px] text-muted-foreground flex items-center space-x-2">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>
            Formal dispute arbitration and customer conciliation proceedings are administered in the Complaint Management module.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
