"use client";

import * as React from "react";
import { complaintManagementService } from "../services/complaint-management-service";
import type {
  FederationComplaintItem,
  ComplaintStatusDisplay,
  ComplaintManagementData,
} from "../types";
import type { ToastMessage } from "@/components/ui/toast";

export function useComplaintManagement() {
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<ComplaintStatusDisplay | "ALL">("ALL");
  const [data, setData] = React.useState<ComplaintManagementData | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Dialog targets
  const [selectedComplaintForDetail, setSelectedComplaintForDetail] =
    React.useState<FederationComplaintItem | null>(null);
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
    async (query: string, filter: ComplaintStatusDisplay | "ALL") => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await complaintManagementService.getComplaints(query, filter);
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
    fetchComplaints(searchQuery, statusFilter);
  }, [searchQuery, statusFilter, fetchComplaints]);

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
      fetchComplaints(searchQuery, statusFilter);
      return true;
    } catch (err) {
      console.error("Failed to resolve complaint:", err);
      addToast(
        "Resolution Failed",
        "Could not update complaint status. Please retry.",
        "destructive"
      );
      return false;
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  return {
    complaints: data?.complaints || [],
    totalCount: data?.totalCount || 0,
    pendingCount: data?.pendingCount || 0,
    resolvedCount: data?.resolvedCount || 0,
    isDevelopmentFallback: data?.isDevelopmentFallback || false,
    dataSourceNotice: data?.dataSourceNotice,

    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    isLoading,
    error,
    refresh: () => fetchComplaints(searchQuery, statusFilter),

    // Dialogs
    selectedComplaintForDetail,
    setSelectedComplaintForDetail,
    targetComplaintForResolve,
    setTargetComplaintForResolve,
    isSubmittingResolution,

    // Operations
    handleResolveComplaint,

    // Feedback
    toasts,
    removeToast,
  };
}
