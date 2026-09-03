"use client";

import * as React from "react";
import {
  AlertCircle,
  RefreshCw,
  UserPlus,
  Users,
  UserCheck,
  FileEdit,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToastItem } from "@/components/ui/toast";
import { useWorkforceManagement, type WorkforceTab } from "./hooks/use-workforce-management";
import { WorkforceManagementHeader } from "./components/workforce-management-header";
import { WorkerStatusSearch } from "./components/worker-status-search";
import { WorkerStatusTable } from "./components/worker-status-table";
import { AddWorkerDialog } from "./components/add-worker-dialog";
import { ActivateWorkerDialog } from "./components/activate-worker-dialog";
import { DeactivateWorkerDialog } from "./components/deactivate-worker-dialog";
import { WorkerApplicationTable } from "./components/worker-application-table";
import { WorkerApplicationDetailDialog } from "./components/worker-application-detail-dialog";
import { AcceptApplicationDialog } from "./components/accept-application-dialog";
import { RejectApplicationDialog } from "./components/reject-application-dialog";
import { WorkerChangeRequestTable } from "./components/worker-change-request-table";
import { WorkerChangeRequestDetailDialog } from "./components/worker-change-request-detail-dialog";
import { ApproveChangeRequestDialog } from "./components/approve-change-request-dialog";
import { RejectChangeRequestDialog } from "./components/reject-change-request-dialog";

export function WorkforceManagementView() {
  const {
    // Navigation
    activeTab,
    setActiveTab,
    pendingApplicationsCount,
    pendingChangeRequestsCount,

    // Roster & Status (Task 4)
    workers,
    totalCount,
    activeCount,
    deactivatedCount,
    isDevelopmentFallback,
    dataSourceNotice,
    searchQuery,
    onSearchChange,
    isLoading,
    error,
    refresh,
    isAddDialogOpen,
    setIsAddDialogOpen,
    targetWorkerForActivation,
    setTargetWorkerForActivation,
    targetWorkerForDeactivation,
    setTargetWorkerForDeactivation,
    isSubmittingAction,
    handleAddWorker,
    handleActivateWorker,
    handleDeactivateWorker,

    // Applications (Task 5)
    applications,
    applicationSearch,
    setApplicationSearch,
    applicationStatusFilter,
    setApplicationStatusFilter,
    selectedAppForDetail,
    setSelectedAppForDetail,
    targetAppForAccept,
    setTargetAppForAccept,
    targetAppForReject,
    setTargetAppForReject,
    handleAcceptApplication,
    handleRejectApplication,

    // Change Requests (Task 5)
    changeRequests,
    changeRequestSearch,
    setChangeRequestSearch,
    changeRequestStatusFilter,
    setChangeRequestStatusFilter,
    selectedReqForDetail,
    setSelectedReqForDetail,
    targetReqForApprove,
    setTargetReqForApprove,
    targetReqForReject,
    setTargetReqForReject,
    handleApproveChangeRequest,
    handleRejectChangeRequest,

    // Feedback
    toasts,
    removeToast,
  } = useWorkforceManagement();

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Feedback Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} message={toast} onDismiss={removeToast} />
        ))}
      </div>

      {/* Header */}
      <WorkforceManagementHeader
        totalCount={totalCount}
        activeCount={activeCount}
        deactivatedCount={deactivatedCount}
        onOpenAddWorker={() => setIsAddDialogOpen(true)}
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

      {/* TAB NAVIGATION: 3 Administrative Pillars */}
      <div className="flex items-center space-x-2 border-b border-border/60 pb-px text-xs">
        <button
          onClick={() => setActiveTab("roster")}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-t-lg font-medium transition-colors border-b-2 ${
            activeTab === "roster"
              ? "border-emerald-700 text-emerald-800 dark:text-emerald-300 bg-muted/40 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Worker Status & Roster</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-muted font-mono">
            {totalCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("applications")}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-t-lg font-medium transition-colors border-b-2 ${
            activeTab === "applications"
              ? "border-emerald-700 text-emerald-800 dark:text-emerald-300 bg-muted/40 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20"
          }`}
        >
          <UserCheck className="h-3.5 w-3.5" />
          <span>New Worker Requests</span>
          {pendingApplicationsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold">
              {pendingApplicationsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("change-requests")}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-t-lg font-medium transition-colors border-b-2 ${
            activeTab === "change-requests"
              ? "border-emerald-700 text-emerald-800 dark:text-emerald-300 bg-muted/40 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20"
          }`}
        >
          <FileEdit className="h-3.5 w-3.5" />
          <span>Worker Information Changes</span>
          {pendingChangeRequestsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500/20 text-blue-800 dark:text-blue-300 font-semibold">
              {pendingChangeRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: WORKER STATUS MANAGEMENT (TASK 4) */}
      {/* ==================================================== */}
      {activeTab === "roster" && (
        <section aria-label="Worker Status Management" className="space-y-4 animate-in fade-in-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-foreground">
                  Worker Account Status Management
                </h2>
                <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                  Direct Administrative Authority
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Activate or deactivate federation workers. Account status governs authorization to accept jobs, while dispatch availability is managed separately.
              </p>
            </div>

            <WorkerStatusSearch value={searchQuery} onChange={onSearchChange} />
          </div>

          <WorkerStatusTable
            workers={workers}
            isLoading={isLoading}
            onActivateClick={(w) => setTargetWorkerForActivation(w)}
            onDeactivateClick={(w) => setTargetWorkerForDeactivation(w)}
            isSubmittingAction={isSubmittingAction}
          />
        </section>
      )}

      {/* ==================================================== */}
      {/* TAB 2: NEW WORKER REQUESTS (TASK 5) */}
      {/* ==================================================== */}
      {activeTab === "applications" && (
        <section aria-label="New Worker Requests" className="space-y-4 animate-in fade-in-50">
          <div className="border-b border-border/60 pb-3 space-y-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-foreground">
                New Worker Membership Requests
              </h2>
              <Badge variant="outline" className="border-blue-500/30 text-blue-700 dark:text-blue-300 text-[10px]">
                Federation Verification Queue
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground max-w-3xl">
              Review craftsmen and tradespeople applying to join your federation. Accepting an application inducts the applicant with verified Active status, while rejecting archives the record with a statutory reason.
            </p>
          </div>

          <WorkerApplicationTable
            applications={applications}
            searchQuery={applicationSearch}
            onSearchChange={setApplicationSearch}
            statusFilter={applicationStatusFilter}
            onStatusFilterChange={setApplicationStatusFilter}
            onViewDetails={(app) => setSelectedAppForDetail(app)}
            onAccept={(app) => setTargetAppForAccept(app)}
            onReject={(app) => setTargetAppForReject(app)}
            isLoading={isLoading}
          />
        </section>
      )}

      {/* ==================================================== */}
      {/* TAB 3: WORKER INFORMATION CHANGE REQUESTS (TASK 5) */}
      {/* ==================================================== */}
      {activeTab === "change-requests" && (
        <section aria-label="Worker Change Requests" className="space-y-4 animate-in fade-in-50">
          <div className="border-b border-border/60 pb-3 space-y-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-foreground">
                Worker Information Change Requests
              </h2>
              <Badge variant="outline" className="border-purple-500/30 text-purple-700 dark:text-purple-300 text-[10px]">
                Verified Credential Governance
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground max-w-3xl">
              Workers cannot freely alter verified trades, skills, or rates. Review worker-initiated modifications against supporting evidence. Approved updates immediately mutate canonical records, while rejected requests preserve canonical data unmodified.
            </p>
          </div>

          <WorkerChangeRequestTable
            requests={changeRequests}
            searchQuery={changeRequestSearch}
            onSearchChange={setChangeRequestSearch}
            statusFilter={changeRequestStatusFilter}
            onStatusFilterChange={setChangeRequestStatusFilter}
            onReviewRequest={(req) => setSelectedReqForDetail(req)}
            isLoading={isLoading}
          />
        </section>
      )}

      {/* ==================================================== */}
      {/* DIALOGS */}
      {/* ==================================================== */}

      {/* Task 4 Dialogs */}
      <AddWorkerDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleAddWorker}
        isSubmitting={isSubmittingAction}
      />

      <ActivateWorkerDialog
        worker={targetWorkerForActivation}
        isOpen={!!targetWorkerForActivation}
        onClose={() => setTargetWorkerForActivation(null)}
        onConfirm={handleActivateWorker}
        isSubmitting={isSubmittingAction}
      />

      <DeactivateWorkerDialog
        worker={targetWorkerForDeactivation}
        isOpen={!!targetWorkerForDeactivation}
        onClose={() => setTargetWorkerForDeactivation(null)}
        onConfirm={handleDeactivateWorker}
        isSubmitting={isSubmittingAction}
      />

      {/* Task 5 Application Dialogs */}
      <WorkerApplicationDetailDialog
        application={selectedAppForDetail}
        isOpen={!!selectedAppForDetail}
        onClose={() => setSelectedAppForDetail(null)}
        onAccept={(app) => {
          setSelectedAppForDetail(null);
          setTargetAppForAccept(app);
        }}
        onReject={(app) => {
          setSelectedAppForDetail(null);
          setTargetAppForReject(app);
        }}
      />

      <AcceptApplicationDialog
        application={targetAppForAccept}
        isOpen={!!targetAppForAccept}
        onClose={() => setTargetAppForAccept(null)}
        onConfirm={handleAcceptApplication}
        isSubmitting={isSubmittingAction}
      />

      <RejectApplicationDialog
        application={targetAppForReject}
        isOpen={!!targetAppForReject}
        onClose={() => setTargetAppForReject(null)}
        onConfirm={handleRejectApplication}
        isSubmitting={isSubmittingAction}
      />

      {/* Task 5 Change Request Dialogs */}
      <WorkerChangeRequestDetailDialog
        request={selectedReqForDetail}
        isOpen={!!selectedReqForDetail}
        onClose={() => setSelectedReqForDetail(null)}
        onApprove={(req) => {
          setSelectedReqForDetail(null);
          setTargetReqForApprove(req);
        }}
        onReject={(req) => {
          setSelectedReqForDetail(null);
          setTargetReqForReject(req);
        }}
      />

      <ApproveChangeRequestDialog
        request={targetReqForApprove}
        isOpen={!!targetReqForApprove}
        onClose={() => setTargetReqForApprove(null)}
        onConfirm={handleApproveChangeRequest}
        isSubmitting={isSubmittingAction}
      />

      <RejectChangeRequestDialog
        request={targetReqForReject}
        isOpen={!!targetReqForReject}
        onClose={() => setTargetReqForReject(null)}
        onConfirm={handleRejectChangeRequest}
        isSubmitting={isSubmittingAction}
      />
    </div>
  );
}
