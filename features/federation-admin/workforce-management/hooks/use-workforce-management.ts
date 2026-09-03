"use client";

import * as React from "react";
import { workforceManagementService } from "../services/workforce-management-service";
import type {
  ManagedWorkerItem,
  AddWorkerPayload,
  WorkforceManagementData,
  WorkerApplicationItem,
  WorkerApplicationStatus,
  WorkerChangeRequestItem,
  WorkerChangeRequestStatus,
} from "../types";
import type { ToastMessage } from "@/components/ui/toast";

export type WorkforceTab = "roster" | "applications" | "change-requests";

export function useWorkforceManagement() {
  // Navigation tabs
  const [activeTab, setActiveTab] = React.useState<WorkforceTab>("roster");

  // Roster states (Task 4)
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [data, setData] = React.useState<WorkforceManagementData | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState<boolean>(false);
  const [targetWorkerForActivation, setTargetWorkerForActivation] =
    React.useState<ManagedWorkerItem | null>(null);
  const [targetWorkerForDeactivation, setTargetWorkerForDeactivation] =
    React.useState<ManagedWorkerItem | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = React.useState<boolean>(false);

  // New Worker Requests states (Task 5)
  const [applications, setApplications] = React.useState<WorkerApplicationItem[]>([]);
  const [applicationSearch, setApplicationSearch] = React.useState<string>("");
  const [applicationStatusFilter, setApplicationStatusFilter] =
    React.useState<WorkerApplicationStatus | "ALL">("ALL");
  const [selectedAppForDetail, setSelectedAppForDetail] =
    React.useState<WorkerApplicationItem | null>(null);
  const [targetAppForAccept, setTargetAppForAccept] =
    React.useState<WorkerApplicationItem | null>(null);
  const [targetAppForReject, setTargetAppForReject] =
    React.useState<WorkerApplicationItem | null>(null);

  // Worker Information Change Requests states (Task 5)
  const [changeRequests, setChangeRequests] = React.useState<WorkerChangeRequestItem[]>([]);
  const [changeRequestSearch, setChangeRequestSearch] = React.useState<string>("");
  const [changeRequestStatusFilter, setChangeRequestStatusFilter] =
    React.useState<WorkerChangeRequestStatus | "ALL">("ALL");
  const [selectedReqForDetail, setSelectedReqForDetail] =
    React.useState<WorkerChangeRequestItem | null>(null);
  const [targetReqForApprove, setTargetReqForApprove] =
    React.useState<WorkerChangeRequestItem | null>(null);
  const [targetReqForReject, setTargetReqForReject] =
    React.useState<WorkerChangeRequestItem | null>(null);

  // Floating feedback toasts
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = React.useCallback(
    (title: string, description: string, variant: ToastMessage["variant"] = "success") => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastMessage = { id, title, description, variant };
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch roster
  const fetchWorkers = React.useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await workforceManagementService.getManagedWorkers(query);
      setData(result);
    } catch (err) {
      console.error("Failed to load workforce management data:", err);
      setError("Unable to load worker status roster. Please check connectivity.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch applications
  const fetchApplications = React.useCallback(
    async (query: string, filter: WorkerApplicationStatus | "ALL") => {
      try {
        const result = await workforceManagementService.getWorkerApplications(query, filter);
        setApplications(result);
      } catch (err) {
        console.error("Failed to load worker applications:", err);
      }
    },
    []
  );

  // Fetch change requests
  const fetchChangeRequests = React.useCallback(
    async (query: string, filter: WorkerChangeRequestStatus | "ALL") => {
      try {
        const result = await workforceManagementService.getWorkerChangeRequests(query, filter);
        setChangeRequests(result);
      } catch (err) {
        console.error("Failed to load worker change requests:", err);
      }
    },
    []
  );

  React.useEffect(() => {
    fetchWorkers(searchQuery);
  }, [searchQuery, fetchWorkers]);

  React.useEffect(() => {
    fetchApplications(applicationSearch, applicationStatusFilter);
  }, [applicationSearch, applicationStatusFilter, fetchApplications]);

  React.useEffect(() => {
    fetchChangeRequests(changeRequestSearch, changeRequestStatusFilter);
  }, [changeRequestSearch, changeRequestStatusFilter, fetchChangeRequests]);

  // Task 4 Operations
  const handleAddWorker = async (payload: AddWorkerPayload): Promise<boolean> => {
    setIsSubmittingAction(true);
    try {
      const createdWorker = await workforceManagementService.addWorker(payload);
      addToast(
        "Worker Added Successfully",
        `${createdWorker.fullName} (${createdWorker.id}) has been inducted into the federation roster with Active account status.`,
        "success"
      );
      setIsAddDialogOpen(false);
      fetchWorkers(searchQuery);
      return true;
    } catch (err) {
      console.error("Failed to register worker:", err);
      addToast(
        "Registration Failed",
        "Unable to add worker. Please verify the entered details and retry.",
        "destructive"
      );
      return false;
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleActivateWorker = async (): Promise<boolean> => {
    if (!targetWorkerForActivation) return false;
    setIsSubmittingAction(true);
    try {
      await workforceManagementService.updateWorkerAccountStatus(
        targetWorkerForActivation.id,
        "ACTIVE"
      );
      addToast(
        "Account Reactivated",
        `Worker account for ${targetWorkerForActivation.fullName} (${targetWorkerForActivation.id}) is now Active. Availability remains unchanged.`,
        "success"
      );
      setTargetWorkerForActivation(null);
      fetchWorkers(searchQuery);
      return true;
    } catch (err) {
      console.error("Failed to activate worker:", err);
      addToast(
        "Activation Failed",
        "Could not activate worker account. Please retry.",
        "destructive"
      );
      return false;
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleDeactivateWorker = async (): Promise<boolean> => {
    if (!targetWorkerForDeactivation) return false;
    setIsSubmittingAction(true);
    try {
      await workforceManagementService.updateWorkerAccountStatus(
        targetWorkerForDeactivation.id,
        "DEACTIVATED"
      );
      addToast(
        "Account Deactivated",
        `Worker account for ${targetWorkerForDeactivation.fullName} (${targetWorkerForDeactivation.id}) has been deactivated. Dispatch availability remains separate.`,
        "warning"
      );
      setTargetWorkerForDeactivation(null);
      fetchWorkers(searchQuery);
      return true;
    } catch (err) {
      console.error("Failed to deactivate worker:", err);
      addToast(
        "Deactivation Failed",
        "Could not deactivate worker account. Please retry.",
        "destructive"
      );
      return false;
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Task 5 Operations: Applications
  const handleAcceptApplication = async (): Promise<boolean> => {
    if (!targetAppForAccept) return false;
    setIsSubmittingAction(true);
    try {
      const res = await workforceManagementService.acceptWorkerApplication(targetAppForAccept.id);
      addToast(
        "Application Accepted",
        `${res.worker.fullName} has been approved and inducted into the federation roster with Worker ID ${res.worker.id}.`,
        "success"
      );
      setTargetAppForAccept(null);
      setSelectedAppForDetail(null);
      fetchApplications(applicationSearch, applicationStatusFilter);
      fetchWorkers(searchQuery);
      return true;
    } catch (err) {
      console.error("Failed to accept application:", err);
      addToast("Action Failed", "Unable to accept application. Please retry.", "destructive");
      return false;
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleRejectApplication = async (reason: string): Promise<boolean> => {
    if (!targetAppForReject) return false;
    setIsSubmittingAction(true);
    try {
      await workforceManagementService.rejectWorkerApplication(targetAppForReject.id, reason);
      addToast(
        "Application Rejected",
        `Application ${targetAppForReject.id} for ${targetAppForReject.applicantName} was rejected and archived.`,
        "warning"
      );
      setTargetAppForReject(null);
      setSelectedAppForDetail(null);
      fetchApplications(applicationSearch, applicationStatusFilter);
      return true;
    } catch (err) {
      console.error("Failed to reject application:", err);
      addToast("Action Failed", "Unable to reject application. Please retry.", "destructive");
      return false;
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Task 5 Operations: Change Requests
  const handleApproveChangeRequest = async (): Promise<boolean> => {
    if (!targetReqForApprove) return false;
    setIsSubmittingAction(true);
    try {
      await workforceManagementService.approveWorkerChangeRequest(targetReqForApprove.id);
      addToast(
        "Change Request Approved",
        `Canonical information for ${targetReqForApprove.workerName} (${targetReqForApprove.workerId}) updated to "${targetReqForApprove.requestedValue}".`,
        "success"
      );
      setTargetReqForApprove(null);
      setSelectedReqForDetail(null);
      fetchChangeRequests(changeRequestSearch, changeRequestStatusFilter);
      fetchWorkers(searchQuery);
      return true;
    } catch (err) {
      console.error("Failed to approve change request:", err);
      addToast("Action Failed", "Unable to approve change request. Please retry.", "destructive");
      return false;
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleRejectChangeRequest = async (reason: string): Promise<boolean> => {
    if (!targetReqForReject) return false;
    setIsSubmittingAction(true);
    try {
      await workforceManagementService.rejectWorkerChangeRequest(targetReqForReject.id, reason);
      addToast(
        "Change Request Rejected",
        `Request ${targetReqForReject.id} was rejected. Canonical information remains unmodified.`,
        "warning"
      );
      setTargetReqForReject(null);
      setSelectedReqForDetail(null);
      fetchChangeRequests(changeRequestSearch, changeRequestStatusFilter);
      return true;
    } catch (err) {
      console.error("Failed to reject change request:", err);
      addToast("Action Failed", "Unable to reject change request. Please retry.", "destructive");
      return false;
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const pendingApplicationsCount = applications.filter((a) => a.status === "PENDING").length;
  const pendingChangeRequestsCount = changeRequests.filter((r) => r.status === "PENDING").length;

  return {
    // Navigation
    activeTab,
    setActiveTab,
    pendingApplicationsCount,
    pendingChangeRequestsCount,

    // Roster & Status (Task 4)
    workers: data?.workers || [],
    totalCount: data?.totalCount || 0,
    activeCount: data?.activeCount || 0,
    deactivatedCount: data?.deactivatedCount || 0,
    isDevelopmentFallback: data?.isDevelopmentFallback || false,
    dataSourceNotice: data?.dataSourceNotice,
    searchQuery,
    onSearchChange: setSearchQuery,
    isLoading,
    error,
    refresh: () => {
      fetchWorkers(searchQuery);
      fetchApplications(applicationSearch, applicationStatusFilter);
      fetchChangeRequests(changeRequestSearch, changeRequestStatusFilter);
    },
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
  };
}
