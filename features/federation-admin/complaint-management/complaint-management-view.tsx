"use client";

import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToastItem } from "@/components/ui/toast";
import { useComplaintManagement } from "./hooks/use-complaint-management";
import { ComplaintManagementHeader } from "./components/complaint-management-header";
import { ComplaintTable } from "./components/complaint-table";
import { ComplaintDetailDialog } from "./components/complaint-detail-dialog";
import { ResolveComplaintDialog } from "./components/resolve-complaint-dialog";

export function ComplaintManagementView() {
  const {
    complaints,
    totalCount,
    pendingCount,
    resolvedCount,
    isDevelopmentFallback,
    dataSourceNotice,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    isLoading,
    error,
    refresh,
    selectedComplaintForDetail,
    setSelectedComplaintForDetail,
    targetComplaintForResolve,
    setTargetComplaintForResolve,
    isSubmittingResolution,
    handleResolveComplaint,
    toasts,
    removeToast,
  } = useComplaintManagement();

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Feedback Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} message={toast} onDismiss={removeToast} />
        ))}
      </div>

      {/* Header */}
      <ComplaintManagementHeader
        totalCount={totalCount}
        pendingCount={pendingCount}
        resolvedCount={resolvedCount}
        onRefresh={refresh}
        isLoading={isLoading}
        isDevelopmentFallback={isDevelopmentFallback}
        dataSourceNotice={dataSourceNotice}
      />

      {/* Error state banner */}
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

      {/* Complaints Table */}
      <section aria-label="Customer Grievances and Disputes">
        <ComplaintTable
          complaints={complaints}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onViewDetails={(c) => setSelectedComplaintForDetail(c)}
          onResolve={(c) => setTargetComplaintForResolve(c)}
          isLoading={isLoading}
        />
      </section>

      {/* Detail Dialog */}
      <ComplaintDetailDialog
        complaint={selectedComplaintForDetail}
        isOpen={!!selectedComplaintForDetail}
        onClose={() => setSelectedComplaintForDetail(null)}
        onResolve={(c) => {
          setSelectedComplaintForDetail(null);
          setTargetComplaintForResolve(c);
        }}
      />

      {/* Resolve Confirmation Dialog */}
      <ResolveComplaintDialog
        complaint={targetComplaintForResolve}
        isOpen={!!targetComplaintForResolve}
        onClose={() => setTargetComplaintForResolve(null)}
        onConfirm={(notes) => handleResolveComplaint(targetComplaintForResolve!.id, notes)}
        isSubmitting={isSubmittingResolution}
      />
    </div>
  );
}
