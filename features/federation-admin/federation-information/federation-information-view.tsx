"use client";

import * as React from "react";
import { AlertCircle, RefreshCw, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToastItem } from "@/components/ui/toast";

import { useFederationInformation } from "./hooks/use-federation-information";
import { FederationInformationHeader } from "./components/federation-information-header";
import { FederationOverviewCard } from "./components/federation-overview-card";
import { RegistrationDetailsCard } from "./components/registration-details-card";
import { FederationDocumentsCard } from "./components/federation-documents-card";
import { FederationLeaderCard } from "./components/federation-leader-card";
import { ChangeRequestList } from "./components/change-request-list";
import { ChangeRequestDialog } from "./components/change-request-dialog";
import { ChangeRequestDetailDialog } from "./components/change-request-detail-dialog";

export function FederationInformationView() {
  const {
    data,
    isLoading,
    error,
    refresh,
    isChangeDialogOpen,
    selectedFieldForChange,
    openChangeDialog,
    closeChangeDialog,
    selectedRequestForDetail,
    isDetailDialogOpen,
    openDetailDialog,
    closeDetailDialog,
    isSubmitting,
    handleSubmitChangeRequest,
    toasts,
    removeToast,
  } = useFederationInformation();

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Feedback Notifications Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} message={toast} onDismiss={removeToast} />
        ))}
      </div>

      {/* Header */}
      <FederationInformationHeader
        officialDetails={data?.officialDetails}
        onOpenChangeDialog={() => openChangeDialog("name")}
        onRefresh={refresh}
        isLoading={isLoading}
        lastUpdated={data?.lastUpdated}
        isDevelopmentFallback={data?.isDevelopmentFallback}
        dataSourceNotice={data?.dataSourceNotice}
      />

      {/* Error state */}
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

      {/* Loading Skeleton */}
      {isLoading && !data && (
        <div className="space-y-6">
          <div className="rounded-lg border border-border p-6 space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          </div>
          <div className="rounded-lg border border-border p-6 space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-36 w-full" />
          </div>
        </div>
      )}

      {/* Main Content */}
      {data && (
        <div className="space-y-8">
          {/* SECTION A: Federation Overview */}
          <section aria-label="Federation Overview">
            <FederationOverviewCard
              details={data.officialDetails}
              onRequestChange={(field) => openChangeDialog(field)}
            />
          </section>

          {/* SECTION B: Statutory Registration Details & Official Documents */}
          <section aria-label="Registration and Documents" className="space-y-6">
            <RegistrationDetailsCard authority={data.registrationAuthority} />
            <FederationDocumentsCard
              documents={data.documents}
              onRequestChange={(field) => openChangeDialog(field)}
            />
          </section>

          {/* SECTION C: Current Admin / Leadership */}
          <section aria-label="Current Administration and Leadership">
            <FederationLeaderCard leader={data.leader} />
          </section>

          {/* SECTION 9: Information Change Requests */}
          <section aria-label="Information Change Requests">
            <ChangeRequestList
              requests={data.changeRequests}
              onViewDetails={openDetailDialog}
              onRequestChange={() => openChangeDialog("name")}
            />
          </section>
        </div>
      )}

      {/* Change Request Dialog */}
      {data && (
        <ChangeRequestDialog
          isOpen={isChangeDialogOpen}
          onClose={closeChangeDialog}
          officialDetails={data.officialDetails}
          initialField={selectedFieldForChange}
          onSubmit={handleSubmitChangeRequest}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Change Request Audit Detail Dialog */}
      <ChangeRequestDetailDialog
        isOpen={isDetailDialogOpen}
        onClose={closeDetailDialog}
        request={selectedRequestForDetail}
      />
    </div>
  );
}
