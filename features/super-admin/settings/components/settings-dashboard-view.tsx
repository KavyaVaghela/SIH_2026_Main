"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlatformSettings } from "../hooks/use-platform-settings";
import { NotificationPreferencesSection } from "./notification-preferences-section";
import { ServiceManagementTable } from "./service-management-table";

export function SettingsDashboardView() {
  const {
    settings,
    isLoading,
    isSaving,
    successMessage,
    errorMessage,
    retryFetch,
    handleToggleService,
    handleToggleNotification,
  } = usePlatformSettings();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <PageHeader
        title="Platform Governance & Operational Settings"
        description="Administer master trade catalog availability in the live marketplace and manage administrative alert signals."
        breadcrumbs={[
          { label: "Super Admin", href: "/super-admin" },
          { label: "Settings" },
        ]}
      />

      {/* Success Feedback Alert */}
      {successMessage && (
        <div
          role="status"
          className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 text-xs font-semibold flex items-center space-x-2 animate-in fade-in-0"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Feedback Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in-0"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={retryFetch}
            className="h-7 text-xs border-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50"
          >
            <RefreshCw className="h-3 w-3 mr-1.5" aria-hidden="true" />
            Retry
          </Button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && settings.services.length === 0 ? (
        <div className="space-y-6">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* 1. Master Trade Services Catalog Controls (Real Database-backed) */}
          <ServiceManagementTable
            services={settings.services}
            onToggleService={handleToggleService}
            isSaving={isSaving}
          />

          {/* 2. Administrative Alert Preferences (Local Workspace) */}
          <NotificationPreferencesSection
            preferences={settings.notificationPreferences}
            onTogglePreference={handleToggleNotification}
            isSaving={isSaving}
          />
        </>
      )}
    </div>
  );
}
