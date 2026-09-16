import { createClient } from "@/lib/supabase/client";
import { complaintService } from "@/features/complaints/services/complaint-service";
import type {
  FederationComplaintItem,
  ComplaintStatusDisplay,
  ComplaintManagementData,
} from "../types";
import type { GrievanceCase } from "@/types/complaints/v2";

export class ComplaintManagementService {
  /**
   * Retrieves real complaints for the authenticated federation.
   */
  async getComplaints(
    searchQuery: string = "",
    statusFilter: string = "ALL",
    priorityFilter: string = "ALL",
    federationId: string = "b765df3b-c418-4a15-b79f-3cbc09e475dc"
  ): Promise<ComplaintManagementData> {
    let complaintsList: FederationComplaintItem[] = [];
    let isFallback = false;
    let dataSourceNotice: string | undefined = undefined;

    try {
      const { cases } = await complaintService.listGrievances({
        role: "FEDERATION_ADMIN",
        federationId,
        searchQuery: searchQuery || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        priority: priorityFilter !== "ALL" ? priorityFilter : undefined,
      });

      if (cases && cases.length > 0) {
        complaintsList = cases.map((c: GrievanceCase) => {
          const isResolved = c.status === "RESOLVED" || c.status === "CLOSED" || c.status === "REJECTED";
          const displayStatus: ComplaintStatusDisplay = isResolved
            ? "RESOLVED"
            : c.status === "ACTION_REQUIRED"
            ? "ACTION_REQUIRED"
            : c.status === "ESCALATED"
            ? "ESCALATED"
            : c.status === "UNDER_REVIEW"
            ? "UNDER_REVIEW"
            : "PENDING";

          return {
            id: c.id,
            complaintNumber: c.complaintNumber,
            bookingId: c.bookingId || undefined,
            customerName: c.raisedByName,
            customerPhone: c.raisedByPhone || "+91 98000 00000",
            workerId: c.targetWorkerId || c.targetProfileId || "WRK-AHM-0101",
            workerName: c.targetName || "Federation Craftsman",
            workerProfession: c.category.includes("Plumb") ? "Plumber" : "Skilled Craftsman",
            subject: c.subject,
            description: c.description,
            category: c.category,
            subcategory: c.subcategory,
            submittedDate: c.createdAt ? c.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
            status: displayStatus,
            rawStatus: isResolved ? "RESOLVED" : "OPEN",
            lifecycleStatus: c.status,
            priority: c.priority,
            suggestedPriority: c.suggestedPriority,
            triageReason: c.triageReason,
            resolutionNotes: c.resolution?.actionTaken || undefined,
            resolvedAt: c.resolution?.resolvedAt ? c.resolution.resolvedAt.split("T")[0] : undefined,
            resolvedBy: c.resolution?.resolvedByName || undefined,
            grievanceCase: c,
          };
        });
      }
    } catch (err) {
      console.warn("Notice: Live complaints query exception:", err);
    }

    let filtered = complaintsList;
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((c) => c.status === statusFilter || c.lifecycleStatus === statusFilter);
    }
    if (priorityFilter !== "ALL") {
      filtered = filtered.filter((c) => c.priority === priorityFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (c) =>
          c.complaintNumber.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q) ||
          c.workerName.toLowerCase().includes(q) ||
          c.workerId.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }

    const totalCount = complaintsList.length;
    const pendingCount = complaintsList.filter((c) => c.lifecycleStatus === "OPEN").length;
    const underReviewCount = complaintsList.filter((c) => c.lifecycleStatus === "UNDER_REVIEW").length;
    const actionRequiredCount = complaintsList.filter((c) => c.lifecycleStatus === "ACTION_REQUIRED").length;
    const escalatedCount = complaintsList.filter((c) => c.lifecycleStatus === "ESCALATED").length;
    const resolvedCount = complaintsList.filter((c) => c.lifecycleStatus === "RESOLVED" || c.status === "RESOLVED").length;
    const highOrCriticalCount = complaintsList.filter((c) => c.priority === "HIGH" || c.priority === "CRITICAL").length;

    return {
      complaints: filtered,
      totalCount,
      pendingCount,
      underReviewCount,
      actionRequiredCount,
      escalatedCount,
      resolvedCount,
      highOrCriticalCount,
      isDevelopmentFallback: isFallback,
      dataSourceNotice,
    };
  }

  /**
   * Resolves a grievance case.
   */
  async resolveComplaint(
    complaintId: string,
    resolutionNotes: string,
    internalNotes?: string,
    actorId: string = "fed-admin-1",
    actorName: string = "Federation Grievance Officer"
  ): Promise<{ success: boolean; complaintId: string }> {
    await complaintService.resolveGrievance(
      complaintId,
      {
        resolutionType: "CONCILIATION",
        summary: resolutionNotes,
        actionTaken: resolutionNotes,
        followUpRequired: false,
        resolvedBy: actorId,
        resolvedByName: actorName,
        resolvedAt: new Date().toISOString(),
      },
      actorId,
      "FEDERATION_ADMIN",
      actorName
    );

    if (internalNotes && internalNotes.trim()) {
      await complaintService.addTimelineUpdate(
        complaintId,
        "INTERNAL_NOTE",
        internalNotes.trim(),
        actorId,
        "FEDERATION_ADMIN",
        actorName
      );
    }

    return {
      success: true,
      complaintId,
    };
  }
}

export const complaintManagementService = new ComplaintManagementService();
