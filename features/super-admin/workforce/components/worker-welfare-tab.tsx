"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeartHandshake, ShieldCheck, Wallet, CheckCircle2 } from "lucide-react";
import type { WorkerWelfareStatus } from "../types";

interface WorkerWelfareTabProps {
  welfare: WorkerWelfareStatus | null;
}

export function WorkerWelfareTab({ welfare }: WorkerWelfareTabProps) {
  if (!welfare) {
    return (
      <div className="py-8 text-center text-muted-foreground text-xs">
        Welfare & Insurance details not enrolled or unavailable for this worker.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-xs p-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Member Escrow Contributions</span>
          <p className="text-2xl font-bold text-foreground mt-1">₹{welfare.totalContributions.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Automated job deduction</p>
        </Card>

        <Card className="border shadow-xs p-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Matched Platform Subsidies</span>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
            ₹{welfare.matchedSubsidies.toLocaleString()}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Cooperative welfare match</p>
        </Card>

        <Card className="border shadow-xs p-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Insurance Health Coverage</span>
          <div className="mt-2">
            {welfare.coverageStatus === "ACTIVE" ? (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600 inline" />
                Active Health Policy
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-bold">
                Pending Renewal
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Provider: {welfare.insuranceProvider || "N/A"}</p>
        </Card>
      </div>

      {/* Welfare Details */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-bold text-foreground flex items-center space-x-2">
            <HeartHandshake className="h-5 w-5 text-emerald-700" />
            <span>Cooperative Social Security & Health Insurance Record</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-muted-foreground">Welfare Fund Type</span>
              <p className="text-sm font-bold text-foreground">{welfare.fundType}</p>
            </div>

            <div>
              <span className="text-xs text-muted-foreground">Group Insurance Policy Number</span>
              <p className="text-sm font-mono font-bold text-foreground">
                {welfare.insurancePolicyNumber || "Enrolment Pending"}
              </p>
            </div>

            <div>
              <span className="text-xs text-muted-foreground">Insurance Provider</span>
              <p className="text-sm font-semibold text-foreground">
                {welfare.insuranceProvider || "National Group Scheme"}
              </p>
            </div>

            <div>
              <span className="text-xs text-muted-foreground">Last Transaction Date</span>
              <p className="text-sm font-medium text-foreground">{welfare.lastTransactionDate || "N/A"}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
            <p className="font-bold flex items-center">
              <ShieldCheck className="h-4 w-4 mr-1.5 text-emerald-700 inline" />
              Cooperative Member Protection Security
            </p>
            <p className="leading-relaxed">
              Every completed gig automatically contributes 2% towards the worker’s emergency healthcare escrow and accident insurance, matched by the KaushalyaSetu Federation Welfare Fund.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
