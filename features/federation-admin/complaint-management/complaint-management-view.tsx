"use client";

import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToastItem } from "@/components/ui/toast";
import { useComplaintManagement } from "./hooks/use-complaint-management";
import { ComplaintManagementHeader } from "./components/complaint-management-header";
import { ComplaintTable } from "./components/complaint-table";
import { GrievanceDetailWorkspace } from "./components/grievance-detail-workspace";
import { ResolveComplaintDialog } from "./components/resolve-complaint-dialog";
import type { GrievanceCase } from "@/types/complaints/v2";

export function ComplaintManagementView() {
  const {
    complaints,
    totalCount,
    pendingCount,
    underReviewCount,
    actionRequiredCount,
    escalatedCount,
    resolvedCount,
    highOrCriticalCount,
    isDevelopmentFallback,
    dataSourceNotice,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    isLoading,
    error,
    refresh,
    targetComplaintForResolve,
    setTargetComplaintForResolve,
    isSubmittingResolution,
    handleResolveComplaint,
    toasts,
    removeToast,
  } = useComplaintManagement();

  const [activeWorkspaceCase, setActiveWorkspaceCase] = React.useState<GrievanceCase | null>(null);

  const handleOpenWorkspace = async (item: any) => {
    if (item.grievanceCase) {
      setActiveWorkspaceCase(item.grievanceCase);
      return;
    }

    try {
      const res = await fetch(`/api/complaints/${item.id}?role=FEDERATION_ADMIN`);
      const data = await res.json();
      if (data.success && data.complaint) {
        setActiveWorkspaceCase(data.complaint);
      } else {
        // Build fallback case object from item
        setActiveWorkspaceCase({
          id: item.id,
          complaintNumber: item.complaintNumber,
          bookingId: item.bookingId || null,
          raisedBy: "cust-1",
          raisedByRole: "CUSTOMER",
          raisedByName: item.customerName,
          raisedByPhone: item.customerPhone,
          targetRole: "WORKER",
          targetName: item.workerName,
          targetWorkerId: item.workerId,
          federationId: "b765df3b-c418-4a15-b79f-3cbc09e475dc",
          category: item.category,
          subcategory: item.subcategory,
          subject: item.subject,
          description: item.description,
          priority: item.priority || "MEDIUM",
          suggestedPriority: item.suggestedPriority || "MEDIUM",
          triageReason: item.triageReason,
          status: item.lifecycleStatus || "UNDER_REVIEW",
          evidenceUrls: [],
          timeline: [
            {
              id: "tl-1",
              type: "PUBLIC_UPDATE",
              visibility: "PUBLIC",
              actorId: "cust-1",
              actorRole: "CUSTOMER",
              actorName: item.customerName,
              message: item.description,
              timestamp: new Date().toISOString(),
            },
          ],
          auditTrail: [
            {
              id: "aud-1",
              complaintId: item.id,
              actorId: "cust-1",
              actorRole: "CUSTOMER",
              actorName: item.customerName,
              action: "CREATE",
              timestamp: new Date().toISOString(),
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Feedback Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} message={toast} onDismiss={removeToast} />
        ))}
      </div>

      {/* Header with full KPIs */}
      <ComplaintManagementHeader
        totalCount={totalCount}
        pendingCount={pendingCount}
        underReviewCount={underReviewCount}
        actionRequiredCount={actionRequiredCount}
        escalatedCount={escalatedCount}
        resolvedCount={resolvedCount}
        highOrCriticalCount={highOrCriticalCount}
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
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          onViewDetails={handleOpenWorkspace}
          onResolve={(c) => setTargetComplaintForResolve(c)}
          isLoading={isLoading}
        />
      </section>

      {/* Full SIH Case-Management Workspace */}
      <GrievanceDetailWorkspace
        grievance={activeWorkspaceCase}
        isOpen={!!activeWorkspaceCase}
        onClose={() => setActiveWorkspaceCase(null)}
        onRefresh={() => {
          refresh();
          if (activeWorkspaceCase) {
            handleOpenWorkspace(activeWorkspaceCase);
          }
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
