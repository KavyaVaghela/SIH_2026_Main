"use client";

import * as React from "react";
import { TrendingUp, Wallet, IndianRupee, CreditCard, Building } from "lucide-react";
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border bg-card shadow-xs p-5 space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-4 w-24" />
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (val: number) =>
    `₹${val.toLocaleString("en-IN")}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Earnings */}
      <Card className="border bg-card shadow-xs hover:border-emerald-500/30 transition-all">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Earnings
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(metrics.totalEarnings)}
            </span>
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-semibold flex items-center space-x-0.5"
            >
              <TrendingUp className="h-3 w-3 mr-0.5 text-emerald-600" />
              <span>+{metrics.totalEarningsGrowth}% vs. last month</span>
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Cumulative gross billing across all completed trades
          </p>
        </CardContent>
      </Card>

      {/* 2. This Month */}
      <Card className="border bg-card shadow-xs hover:border-blue-500/30 transition-all">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              This Month
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(metrics.thisMonth)}
            </span>
            <Badge
              variant="outline"
              className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 text-[10px] font-semibold flex items-center space-x-0.5"
            >
              <TrendingUp className="h-3 w-3 mr-0.5 text-blue-600" />
              <span>+{metrics.thisMonthGrowth}% vs. last month</span>
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Current billing cycle gross order fulfillment
          </p>
        </CardContent>
      </Card>

      {/* 3. Platform Commission */}
      <Card className="border bg-card shadow-xs hover:border-amber-500/30 transition-all">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Platform Commission
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(metrics.platformCommission)}
            </span>
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px] font-semibold flex items-center space-x-0.5"
            >
              <TrendingUp className="h-3 w-3 mr-0.5 text-amber-600" />
              <span>+{metrics.commissionGrowth}% vs. last month</span>
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Platform infrastructure & technology service fee split
          </p>
        </CardContent>
      </Card>

      {/* 4. Net Payout to Federation */}
      <Card className="border bg-card shadow-xs hover:border-indigo-500/30 transition-all">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Net Payout to Federation
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(metrics.netPayout)}
            </span>
            <Badge
              variant="outline"
              className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20 text-[10px] font-semibold flex items-center space-x-0.5"
            >
              <TrendingUp className="h-3 w-3 mr-0.5 text-indigo-600" />
              <span>+{metrics.netPayoutGrowth}% vs. last month</span>
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Disbursed fund credited to cooperative account
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
