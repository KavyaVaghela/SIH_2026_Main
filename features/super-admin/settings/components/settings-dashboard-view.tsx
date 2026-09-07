"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { usePlatformSettings } from "../hooks/use-platform-settings";
import { PlatformControlsSection } from "./platform-controls-section";
import { NotificationPreferencesSection } from "./notification-preferences-section";
import { ServiceManagementTable } from "./service-management-table";
import { SettingConfirmationDialog } from "./setting-confirmation-dialog";

export function SettingsDashboardView() {
  const {
    settings,
    isLoading,
    isSaving,
    successMessage,
    errorMessage,
    pendingConfirmation,
    handleToggleRegistrations,
    handleToggleEmergency,
    confirmPendingAction,
    cancelPendingAction,
    handleToggleService,
    handleToggleNotification,
  } = usePlatformSettings();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <PageHeader
        title="Platform Controls & Governance Settings"
        description="Administer core marketplace operational gates, trade service offerings, and administrative notification triggers."
        breadcrumbs={[
          { label: "Super Admin", href: "/super-admin" },
          { label: "Settings" },
        ]}
      />

      {/* Success Feedback Alert */}
      {successMessage && (
        <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 text-xs font-semibold flex items-center space-x-2 animate-in fade-in-0">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Feedback Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 text-xs font-semibold flex items-center space-x-2 animate-in fade-in-0">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Core Platform Controls */}
      <PlatformControlsSection
        societyRegistrationEnabled={settings.societyRegistrationEnabled}
        emergencyBookingEnabled={settings.emergencyBookingEnabled}
        onToggleRegistrations={handleToggleRegistrations}
        onToggleEmergency={handleToggleEmergency}
        isSaving={isSaving}
      />

      {/* 2. Notification Preferences */}
      <NotificationPreferencesSection
        preferences={settings.notificationPreferences}
        onTogglePreference={handleToggleNotification}
        isSaving={isSaving}
      />

      {/* 3. Master Trade Services Catalog Controls */}
      <ServiceManagementTable
        services={settings.services}
        onToggleService={handleToggleService}
        isSaving={isSaving}
      />

      {/* High-Impact Action Safety Confirmation Dialog */}
      <SettingConfirmationDialog
        confirmation={pendingConfirmation}
        onConfirm={confirmPendingAction}
        onCancel={cancelPendingAction}
        isSaving={isSaving}
      />
    </div>
  );
}
