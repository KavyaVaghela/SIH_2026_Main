"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useSuperAdminNotifications } from "../hooks/use-super-admin-notifications";
import { NotificationsStatsBar } from "./notifications-stats-bar";
import { NotificationsFilterTabs } from "./notifications-filter-tabs";
import { NotificationsList } from "./notifications-list";

export function NotificationsDashboardView() {
  const {
    notifications,
    stats,
    totalCount,
    filters,
    isLoading,
    updateFilters,
    resetFilters,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    refresh,
  } = useSuperAdminNotifications();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <PageHeader
        title="Administrative Notifications & Operational Alerts"
        description="Monitor real-time cooperative ecosystem alerts, severe market imbalances, compliance flags, and high-priority escalation notices."
        breadcrumbs={[
          { label: "Super Admin", href: "/super-admin" },
          { label: "Notifications" },
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
              Refresh Alert Feed
            </Button>
          </div>
        }
      />

      {/* Stats Counter Bar */}
      <NotificationsStatsBar
        stats={stats}
        onMarkAllAsRead={markAllAsRead}
        isLoading={isLoading}
      />

      {/* Filter Tabs */}
      <NotificationsFilterTabs
        filters={filters}
        onFilterChange={updateFilters}
        onReset={resetFilters}
      />

      {/* Notifications Feed */}
      <NotificationsList
        notifications={notifications}
        totalCount={totalCount}
        currentPage={filters.page}
        pageSize={filters.pageSize}
        onPageChange={(page) => updateFilters({ page })}
        onMarkAsRead={markAsRead}
        onMarkAsUnread={markAsUnread}
        isLoading={isLoading}
      />
    </div>
  );
}
