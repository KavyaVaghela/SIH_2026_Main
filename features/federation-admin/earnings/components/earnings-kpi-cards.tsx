"use client";

import * as React from "react";
import {
  TrendingUp,
  Wallet,
  IndianRupee,
  CreditCard,
  Building,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { EarningsKpiMetric } from "../types";

interface EarningsKpiCardsProps {
  metrics?: EarningsKpiMetric;
  isLoading?: boolean;
}

export function EarningsKpiCards({ metrics, isLoading }: EarningsKpiCardsProps) {
  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="border bg-card shadow-xs p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-16" />
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (val: number) =>
    `₹${val.toLocaleString("en-IN")}`;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Total Service Value */}
      <Card className="border bg-card shadow-xs hover:border-emerald-500/30 transition-all">
        <CardContent className="p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              Service Value
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <IndianRupee className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono tracking-tight text-foreground">
            {formatCurrency(metrics.totalEarnings)}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            Worker gross orders
          </p>
        </CardContent>
      </Card>

      {/* 2. Worker Earnings Disbursed */}
      <Card className="border bg-card shadow-xs hover:border-blue-500/30 transition-all">
        <CardContent className="p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              Worker Payouts
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600">
              <Wallet className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono tracking-tight text-blue-700 dark:text-blue-400">
            {formatCurrency(metrics.netPayout)}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            Direct craftsman payout
          </p>
        </CardContent>
      </Card>

      {/* 3. Federation Service Share */}
      <Card className="border bg-card shadow-xs hover:border-purple-500/30 transition-all">
        <CardContent className="p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              Fed. Service Share
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600">
              <Building className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono tracking-tight text-purple-700 dark:text-purple-400">
            {formatCurrency(metrics.federationServiceShare ?? 0)}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            Cooperative retained share
          </p>
        </CardContent>
      </Card>

      {/* 4. Platform Sustainability Fee */}
      <Card className="border bg-card shadow-xs hover:border-amber-500/30 transition-all">
        <CardContent className="p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              Sustainability (5%)
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <CreditCard className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono tracking-tight text-foreground">
            {formatCurrency(metrics.platformCommission)}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            Nominal platform fee
          </p>
        </CardContent>
      </Card>

      {/* 5. Tax (GST 18%) */}
      <Card className="border bg-card shadow-xs hover:border-sky-500/30 transition-all">
        <CardContent className="p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              Tax (18% GST)
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-600">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono tracking-tight text-sky-700 dark:text-sky-400">
            {formatCurrency(metrics.taxCollected ?? 0)}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            Statutory tax compliance
          </p>
        </CardContent>
      </Card>

      {/* 6. Completed Transactions */}
      <Card className="border bg-card shadow-xs hover:border-emerald-500/30 transition-all">
        <CardContent className="p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              Completed Orders
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono tracking-tight text-foreground">
            {metrics.completedTransactionsCount ?? 0}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            Audited gig settlements
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
