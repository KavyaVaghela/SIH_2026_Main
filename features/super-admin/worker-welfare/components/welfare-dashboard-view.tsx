"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { RefreshCw, HeartHandshake } from "lucide-react";
import { useWelfare } from "../hooks/use-welfare";
import { WelfareStatsGrid } from "./welfare-stats-grid";
import { WelfareFilters } from "./welfare-filters";
import { WelfareAlertsPanel } from "./welfare-alerts-panel";
import { WelfareRecordsTable } from "./welfare-records-table";
import { WelfareDetailModal } from "./welfare-detail-modal";

export function WelfareDashboardView() {
  const {
    filters,
    stats,
    records,
    alerts,
    totalCount,
    societies,
    selectedRecord,
    isLoading,
    error,
    updateFilters,
    resetFilters,
    openDetail,
    closeDetail,
    refresh,
  } = useWelfare();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <PageHeader
        title="Worker Welfare & Social Protection"
        description="Oversee cooperative health insurance coverage, social security escrow matching, policy renewal compliance, and craftsmen hazard protections."
        breadcrumbs={[
          { label: "Super Admin", href: "/super-admin" },
          { label: "Worker Welfare" },
        ]}
        actions={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
              className="border-emerald-800/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-semibold"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh Welfare Ledger
            </Button>
          </div>
        }
      />

      {/* 4-KPI Metric Row */}
      <WelfareStatsGrid
        stats={stats}
        onFilterSelect={(status) => updateFilters({ status })}
        isLoading={isLoading}
      />

      {/* Dedicated Compliance Alerts Section */}
      <WelfareAlertsPanel
        alerts={alerts}
        onViewAlertDetail={(alert) => {
          const matched = records.find((r) => r.id === alert.recordId || r.workerId === alert.workerId);
          if (matched) {
            openDetail(matched);
          }
        }}
        isLoading={isLoading}
      />

      {/* Filter Toolbar */}
      <WelfareFilters
        filters={filters}
        societies={societies}
        onFilterChange={updateFilters}
        onReset={resetFilters}
      />

      {/* Main Records Table */}
      <WelfareRecordsTable
        records={records}
        totalCount={totalCount}
        currentPage={filters.page}
        pageSize={filters.pageSize}
        onPageChange={(page) => updateFilters({ page })}
        onInspectRecord={openDetail}
        isLoading={isLoading}
      />

      {/* Welfare Detail Inspection Modal */}
      <WelfareDetailModal
        record={selectedRecord}
        onClose={closeDetail}
      />
    </div>
  );
}
