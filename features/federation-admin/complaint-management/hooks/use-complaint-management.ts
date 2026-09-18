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

  const [currentAdminProfile, setCurrentAdminProfile] = React.useState<{
    id: string;
    fullName: string;
    email: string;
    federationId: string;
    federationName: string;
  }>({
    id: "096b0708-3193-41a6-9f49-03ff8903a0ed",
    fullName: "Federation Dispute Officer",
    email: "federation@example.com",
    federationId: "b765df3b-c418-4a15-b79f-3cbc09e475dc",
    federationName: "Ahmedabad Skilled Workers Federation",
  });

  const [isRaiseComplaintOpen, setIsRaiseComplaintOpen] = React.useState<boolean>(false);

  // Dynamically resolve authenticated Federation Admin profile and federation_id
  React.useEffect(() => {
    async function resolveFedIdentity() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: prof } = await (supabase.from("profiles") as any)
            .select("id, full_name, email, phone, role")
            .eq("id", user.id)
            .maybeSingle();

          let fedId = "b765df3b-c418-4a15-b79f-3cbc09e475dc";
          let fedName = "Ahmedabad Skilled Workers Federation";

          if (user.email) {
            const { data: fed } = await (supabase.from("federations") as any)
              .select("id, name")
              .eq("contact_email", user.email)
              .maybeSingle();
            if (fed) {
              fedId = fed.id;
              fedName = fed.name;
            }
          }

          setCurrentAdminProfile({
            id: user.id,
            fullName: prof?.full_name || "Federation Dispute Officer",
            email: user.email || "",
            federationId: fedId,
            federationName: fedName,
          });
        }
      } catch (err) {
        console.warn("Notice: Could not resolve authenticated federation identity:", err);
      }
    }
    resolveFedIdentity();
  }, []);

  const fetchComplaints = React.useCallback(
    async (query: string, sFilter: string, pFilter: string, fedId?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const targetFedId = fedId || currentAdminProfile.federationId;
        const result = await complaintManagementService.getComplaints(
          query,
          sFilter,
          pFilter,
          targetFedId
        );
        setData(result);
      } catch (err) {
        console.error("Failed to load complaint management data:", err);
        setError("Unable to load grievance records. Please check connectivity.");
      } finally {
        setIsLoading(false);
      }
    },
    [currentAdminProfile.federationId]
  );

  React.useEffect(() => {
    fetchComplaints(searchQuery, statusFilter, priorityFilter, currentAdminProfile.federationId);
  }, [searchQuery, statusFilter, priorityFilter, currentAdminProfile.federationId, fetchComplaints]);

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
            fetchComplaints(searchQuery, statusFilter, priorityFilter, currentAdminProfile.federationId);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn("Realtime setup notice:", err);
    }
  }, [searchQuery, statusFilter, priorityFilter, currentAdminProfile.federationId, fetchComplaints]);

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
        internalNotes,
        currentAdminProfile.id,
        currentAdminProfile.fullName
      );
      addToast(
        "Complaint Marked as Resolved",
        `Dispute record ${complaintId} has been successfully settled and archived.`,
        "success"
      );
      setTargetComplaintForResolve(null);
      setSelectedComplaintForDetail(null);
      setSelectedGrievanceCase(null);
      fetchComplaints(searchQuery, statusFilter, priorityFilter, currentAdminProfile.federationId);
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
      await complaintManagementService.rejectComplaint(
        complaintId,
        reason,
        currentAdminProfile.id,
        currentAdminProfile.fullName
      );
      addToast(
        "Complaint Formally Rejected",
        `Dispute record ${complaintId} has been rejected.`,
        "success"
      );
      setSelectedComplaintForDetail(null);
      setSelectedGrievanceCase(null);
      fetchComplaints(searchQuery, statusFilter, priorityFilter, currentAdminProfile.federationId);
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
      await complaintManagementService.closeComplaint(
        complaintId,
        notes,
        currentAdminProfile.id,
        currentAdminProfile.fullName
      );
      addToast(
        "Complaint Administratively Closed",
        `Dispute record ${complaintId} has been closed.`,
        "success"
      );
      setSelectedComplaintForDetail(null);
      setSelectedGrievanceCase(null);
      fetchComplaints(searchQuery, statusFilter, priorityFilter, currentAdminProfile.federationId);
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
      fetchComplaints(searchQuery, statusFilter, priorityFilter, currentAdminProfile.federationId);
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

  const handleRaiseComplaint = async (formData: FormData): Promise<boolean> => {
    setIsSubmittingResolution(true);
    try {
      formData.set("raisedBy", currentAdminProfile.id);
      formData.set("raisedByRole", "FEDERATION_ADMIN");
      formData.set("raisedByName", currentAdminProfile.fullName);
      formData.set("federationId", currentAdminProfile.federationId);

      const res = await fetch("/api/complaints", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to submit federation complaint.");
      }

      addToast(
        "Complaint Submitted",
        `Complaint #${result.complaint?.complaintNumber || ""} submitted to Super Admin.`,
        "success"
      );
      setIsRaiseComplaintOpen(false);
      fetchComplaints(searchQuery, statusFilter, priorityFilter, currentAdminProfile.federationId);
      return true;
    } catch (err: any) {
      console.error("Failed to raise complaint:", err);
      addToast("Submission Failed", err.message || "Failed to submit complaint.", "destructive");
      return false;
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  const refresh = () => fetchComplaints(searchQuery, statusFilter, priorityFilter, currentAdminProfile.federationId);

  const activeComplaints =
    activeSection === "USER_COMPLAINTS"
      ? data?.userComplaints || []
      : activeSection === "WORKER_COMPLAINTS"
      ? data?.workerComplaints || []
      : data?.myComplaints || [];

  return {
    complaints: data?.complaints || [],
    userComplaints: data?.userComplaints || [],
    workerComplaints: data?.workerComplaints || [],
    myComplaints: data?.myComplaints || [],
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
    myMetrics: data?.myMetrics || {
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
    currentAdminProfile,
    isRaiseComplaintOpen,
    setIsRaiseComplaintOpen,
    handleRaiseComplaint,
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

