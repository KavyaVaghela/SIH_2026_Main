"use client";

import * as React from "react";
import { Landmark, ShieldCheck, ArrowUpRight, Clock, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WorkerEarningsSummary } from "../types";

export interface CooperativePayoutCardProps {
  summary: WorkerEarningsSummary;
}

export function CooperativePayoutCard({ summary }: CooperativePayoutCardProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="p-4 sm:p-5 border-b pb-3 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            <Landmark className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Cooperative Bank Settlement Account
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Direct automated NEFT/IMPS settlement to verified member account
            </p>
          </div>
        </div>

        <Badge variant="success" className="text-xs">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Bank Name</span>
            <p className="text-xs sm:text-sm font-bold text-foreground truncate">
              {summary.bankName}
            </p>
          </div>

          <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Account Number</span>
            <p className="text-xs sm:text-sm font-bold font-mono text-foreground">
              •••• •••• •••• {summary.accountEnding}
            </p>
          </div>

          <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Next Scheduled Payout</span>
            <p className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1 shrink-0" />
              {summary.nextPayoutTime}
            </p>
          </div>
        </div>

        <div className="flex items-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-700/20 text-xs text-muted-foreground gap-2">
          <Info className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Statutory Cooperative Welfare Protection:</strong> 5% cooperative welfare cess is systematically matched 100% by the Gujarat Labour Cooperative Federation into your health and pension corpus.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
