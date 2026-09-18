"use client";

import * as React from "react";
import { complaintManagementService } from "../services/complaint-management-service";
import { createClient } from "@/lib/supabase/client";
import type {
  FederationComplaintItem,
  ComplaintManagementData,
  ComplaintSubsection,
} from "../types";
import type { GrievanceCase } from "@/types/complaints/v2";
import type { ToastMessage } from "@/components/ui/toast";

export function useComplaintManagement() {
  const [activeSection, setActiveSection] = React.useState<ComplaintSubsection>("USER_COMPLAINTS");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("ALL");
  const [data, setData] = React.useState<ComplaintManagementData | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Dialog targets
  const [selectedComplaintForDetail, setSelectedComplaintForDetail] =
    React.useState<FederationComplaintItem | null>(null);
  const [selectedGrievanceCase, setSelectedGrievanceCase] =
    React.useState<GrievanceCase | null>(null);
  const [targetComplaintForResolve, setTargetComplaintForResolve] =
    React.useState<FederationComplaintItem | null>(null);
  const [isSubmittingResolution, setIsSubmittingResolution] = React.useState<boolean>(false);

  // Feedback toasts
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

  const fetchComplaints = React.useCallback(
    async (query: string, sFilter: string, pFilter: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await complaintManagementService.getComplaints(
          query,
          sFilter,
          pFilter
        );
        setData(result);
      } catch (err) {
        console.error("Failed to load complaint management data:", err);
        setError("Unable to load grievance records. Please check connectivity.");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  React.useEffect(() => {
    fetchComplaints(searchQuery, statusFilter, priorityFilter);
  }, [searchQuery, statusFilter, priorityFilter, fetchComplaints]);

  // Supabase Realtime subscription on complaints table
  React.useEffect(() => {
    try {
      const supabase = createClient();
      const channel = supabase
        .channel("complaints-realtime-fed-admin")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "complaints",
          },
          () => {
            fetchComplaints(searchQuery, statusFilter, priorityFilter);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn("Realtime setup notice:", err);
    }
  }, [searchQuery, statusFilter, priorityFilter, fetchComplaints]);

  const handleResolveComplaint = async (
    complaintId: string,
    resolutionNotes: string,
    internalNotes?: string
  ): Promise<boolean> => {
    setIsSubmittingResolution(true);
    try {
      await complaintManagementService.resolveComplaint(
        complaintId,
        resolutionNotes,
        internalNotes
      );
      addToast(
        "Complaint Marked as Resolved",
        `Dispute record ${complaintId} has been successfully settled and archived.`,
        "success"
      );
      setTargetComplaintForResolve(null);
      setSelectedComplaintForDetail(null);
      setSelectedGrievanceCase(null);
      fetchComplaints(searchQuery, statusFilter, priorityFilter);
      return true;
    } catch (err: any) {
      console.error("Failed to resolve complaint:", err);
      addToast(
        "Resolution Failed",
        err.message || "Could not update complaint status. Please retry.",
        "destructive"
      );
      return false;
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  const handleRejectComplaint = async (
    complaintId: string,
    reason: string
  ): Promise<boolean> => {
    setIsSubmittingResolution(true);
    try {
      await complaintManagementService.rejectComplaint(complaintId, reason);
      addToast(
        "Complaint Formally Rejected",
        `Dispute record ${complaintId} has been rejected.`,
        "success"
      );
      setSelectedComplaintForDetail(null);
      setSelectedGrievanceCase(null);
      fetchComplaints(searchQuery, statusFilter, priorityFilter);
      return true;
    } catch (err: any) {
      console.error("Failed to reject complaint:", err);
      addToast(
        "Rejection Failed",
        err.message || "Could not reject complaint. Ensure worker response is submitted if required.",
        "destructive"
      );
      return false;
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  const handleCloseComplaint = async (
    complaintId: string,
    notes: string
  ): Promise<boolean> => {
    setIsSubmittingResolution(true);
    try {
      await complaintManagementService.closeComplaint(complaintId, notes);
      addToast(
        "Complaint Administratively Closed",
        `Dispute record ${complaintId} has been closed.`,
        "success"
      );
      setSelectedComplaintForDetail(null);
      setSelectedGrievanceCase(null);
      fetchComplaints(searchQuery, statusFilter, priorityFilter);
      return true;
    } catch (err: any) {
      console.error("Failed to close complaint:", err);
      addToast(
        "Closure Failed",
        err.message || "Could not close complaint. Ensure worker response is submitted if required.",
        "destructive"
      );
      return false;
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  const handleRequestWorkerResponse = async (
    complaintId: string,
    message: string
  ): Promise<boolean> => {
    setIsSubmittingResolution(true);
    try {
      await complaintManagementService.requestWorkerResponse(complaintId, message);
      addToast(
        "Response Requested",
        `Formal statement request sent to worker for ${complaintId}.`,
        "success"
      );
      fetchComplaints(searchQuery, statusFilter, priorityFilter);
      return true;
    } catch (err: any) {
      console.error("Failed to request worker response:", err);
      addToast(
        "Request Failed",
        err.message || "Could not request statement from worker.",
        "destructive"
      );
      return false;
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  const refresh = () => fetchComplaints(searchQuery, statusFilter, priorityFilter);

  const activeComplaints =
    activeSection === "USER_COMPLAINTS"
      ? data?.userComplaints || []
      : data?.workerComplaints || [];

  return {
    complaints: data?.complaints || [],
    userComplaints: data?.userComplaints || [],
    workerComplaints: data?.workerComplaints || [],
    activeComplaints,
    activeSection,
    setActiveSection,
    userMetrics: data?.userMetrics || {
      total: 0,
      pending: 0,
      underReview: 0,
      waitingForResponse: 0,
      resolved: 0,
      rejectedOrClosed: 0,
    },
    workerMetrics: data?.workerMetrics || {
      total: 0,
      pending: 0,
      underReview: 0,
      waitingForResponse: 0,
      resolved: 0,
      rejectedOrClosed: 0,
    },
    totalCount: data?.totalCount || 0,
    pendingCount: data?.pendingCount || 0,
    underReviewCount: data?.underReviewCount || 0,
    actionRequiredCount: data?.actionRequiredCount || 0,
    escalatedCount: data?.escalatedCount || 0,
    resolvedCount: data?.resolvedCount || 0,
    highOrCriticalCount: data?.highOrCriticalCount || 0,
    isDevelopmentFallback: data?.isDevelopmentFallback || false,
    dataSourceNotice: data?.dataSourceNotice,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    isLoading,
    error,
    refresh,
    selectedComplaintForDetail,
    setSelectedComplaintForDetail,
    selectedGrievanceCase,
    setSelectedGrievanceCase,
    targetComplaintForResolve,
    setTargetComplaintForResolve,
    isSubmittingResolution,
    handleResolveComplaint,
    handleRejectComplaint,
    handleCloseComplaint,
    handleRequestWorkerResponse,
    toasts,
    addToast,
    removeToast,
  };
}

