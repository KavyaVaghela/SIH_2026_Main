"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EarningsSummaryGrid } from "./earnings-summary-grid";
import { CooperativePayoutCard } from "./cooperative-payout-card";
import { EarningsHistoryTable } from "./earnings-history-table";
import { EarningsChartCard } from "./earnings-chart-card";
import { EarningsBreakdownCard } from "./earnings-breakdown-card";
import { workerJobService } from "../services/worker-job-service";
import type { WorkerEarningsSummary, WorkerEarningsRecord } from "../types";

export function EarningsView() {
  const [loading, setLoading] = React.useState(true);
  const [summary, setSummary] = React.useState<WorkerEarningsSummary>({
    todaysEarnings: 0,
    thisWeekEarnings: 0,
    thisMonthEarnings: 0,
    completedJobsCount: 0,
    bankName: "State Bank of India",
    accountEnding: "4821",
    ifscPrefix: "SBIN000",
    nextPayoutTime: "Daily at 8:00 PM IST",
  });
  const [records, setRecords] = React.useState<WorkerEarningsRecord[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = React.useState<
    Array<{ category: string; amount: number; count: number }>
  >([]);
  const [dailyChart, setDailyChart] = React.useState<
    Array<{ day: string; date: string; amount: number }>
  >([]);

  const loadEarnings = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await workerJobService.getWorkerEarnings("w-1");
      setSummary(data.summary);
      setRecords(data.records);
      setCategoryBreakdown(data.categoryBreakdown);
      setDailyChart(data.dailyChart);
    } catch (err) {
      console.error("Failed to load real worker earnings", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Earnings &amp; Payouts"
          description="Loading real-time settled cooperative payouts..."
          breadcrumbs={[
            { label: "Worker Portal", href: "/worker" },
            { label: "Earnings" },
          ]}
        />
        <div className="p-12 text-center text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-sm font-medium">Fetching verified payout records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Earnings &amp; Payouts"
        description="Cooperative earnings tracking, daily payout settlements, and statutory fund contributions."
        breadcrumbs={[
          { label: "Worker Portal", href: "/worker" },
          { label: "Earnings" },
        ]}
      />

      {/* 1. Summary Cards (Today, This Week, This Month, Completed Jobs) */}
      <EarningsSummaryGrid summary={summary} />

      {/* 2. Charts & Category Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EarningsChartCard dailyData={dailyChart} />
        <EarningsBreakdownCard categories={categoryBreakdown} />
      </div>

      {/* 3. Cooperative Payout & Direct Bank Account */}
      <CooperativePayoutCard summary={summary} />

      {/* 4. Recent Earnings Breakdown Table */}
      <EarningsHistoryTable records={records} />
    </div>
  );
}
