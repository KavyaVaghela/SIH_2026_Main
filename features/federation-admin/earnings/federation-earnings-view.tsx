"use client";

import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useFederationEarnings } from "./hooks/use-federation-earnings";
import { EarningsHeader } from "./components/earnings-header";
import { EarningsKpiCards } from "./components/earnings-kpi-cards";
import { EarningsTrendChart } from "./components/earnings-trend-chart";
import { EarningsCategoryChart } from "./components/earnings-category-chart";
import { RecentEarningsTable } from "./components/recent-earnings-table";
import { QuickInsightsPanel } from "./components/quick-insights-panel";

export function FederationEarningsView() {
  const {
    data,
    isLoading,
    error,
    selectedMonthKey,
    setSelectedMonthKey,
    refresh,
  } = useFederationEarnings();

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Page Header with Chips, Date Filter (2026-01 to 2026-09), Sync Time & Refresh */}
      <EarningsHeader
        selectedMonthKey={selectedMonthKey}
        onMonthChange={setSelectedMonthKey}
        onRefresh={refresh}
        isLoading={isLoading}
        lastUpdated={data?.lastUpdated}
      />

      {/* Error state alert */}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-sm">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            className="border-rose-500/40 text-rose-800 dark:text-rose-300 hover:bg-rose-500/20"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      )}

      {/* 2. Key Performance Metric Cards */}
      <section aria-label="KPI Financial Metrics">
        <EarningsKpiCards metrics={data?.kpis} isLoading={isLoading} />
      </section>

      {/* 3. Visual Charts Grid (Monthly Trend & Category Breakdown) */}
      <section aria-label="Revenue Visualizations" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EarningsTrendChart data={data?.trend} isLoading={isLoading} />
        <EarningsCategoryChart data={data?.categories} totalEarnings={data?.kpis.totalEarnings} isLoading={isLoading} />
      </section>

      {/* 4. Recent Earnings Ledger & Quick Insights */}
      <section aria-label="Transactions and Insights" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentEarningsTable transactions={data?.recentTransactions} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1">
          <QuickInsightsPanel insights={data?.insights} isLoading={isLoading} />
        </div>
      </section>
    </div>
  );
}
