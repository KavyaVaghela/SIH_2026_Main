"use client";

import * as React from "react";
import { ShieldCheck, HeartPulse, CheckCircle2, FileCheck2, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/formatters/currency";

export interface InsuranceCoverageCardProps {
  insuranceStatus: "Active" | "Inactive";
  coverageAmount: number;
  policyNumber: string;
  providerName: string;
  welfareSchemeStatus: "Enrolled" | "Pending";
  emergencyAssistanceStatus: "Eligible" | "Not Eligible";
}

export function InsuranceCoverageCard({
  insuranceStatus,
  coverageAmount,
  policyNumber,
  providerName,
  welfareSchemeStatus,
  emergencyAssistanceStatus,
}: InsuranceCoverageCardProps) {
  const isInsuranceActive = insuranceStatus === "Active";

  return (
    <Card className="border-border shadow-sm overflow-hidden">
      <CardHeader className="p-4 sm:p-5 border-b pb-3 flex flex-row items-center justify-between space-y-0 bg-emerald-950/5 dark:bg-emerald-950/30">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Cooperative Health & Accident Insurance
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Underwritten by {providerName}
            </p>
          </div>
        </div>

        <Badge variant={isInsuranceActive ? "success" : "destructive"} className="text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {insuranceStatus}
        </Badge>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Coverage Amount */}
          <div className="p-3.5 rounded-lg border bg-card space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Coverage
            </span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatINR(coverageAmount)}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Hospitalization & accidental sum insured
            </p>
          </div>

          {/* Welfare Scheme Status */}
          <div className="p-3.5 rounded-lg border bg-card space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Welfare Scheme
            </span>
            <div className="flex items-center space-x-2 pt-0.5">
              <span className="text-base font-bold text-foreground">
                {welfareSchemeStatus}
              </span>
              <Badge variant="outline" className="border-emerald-600/40 text-emerald-700 dark:text-emerald-400 text-[10px]">
                Coop Fund
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Gujarat Labour Cooperative Welfare Trust
            </p>
          </div>

          {/* Emergency Assistance */}
          <div className="p-3.5 rounded-lg border bg-card space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Emergency Assistance
            </span>
            <div className="flex items-center space-x-2 pt-0.5">
              <span className="text-base font-bold text-foreground">
                {emergencyAssistanceStatus}
              </span>
              <Badge variant="success" className="text-[10px]">
                Verified
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Instant medical crisis relief qualified
            </p>
          </div>
        </div>

        {/* Policy Number Details Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-muted/20 text-xs text-muted-foreground gap-2">
          <span>
            Statutory Policy ID: <strong className="font-mono text-foreground">{policyNumber}</strong>
          </span>
          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
            Active Annual Policy Term (2026 - 2027)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
