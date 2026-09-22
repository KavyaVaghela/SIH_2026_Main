import { complaintService } from "@/features/complaints/services/complaint-service";
import type {
  FederationComplaintItem,
  ComplaintStatusDisplay,
  ComplaintManagementData,
  SubsectionMetrics,
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
      let cases: GrievanceCase[] = [];

      // If running in browser, fetch through secure server API route to ensure federation scoping
      if (typeof window !== "undefined") {
        try {
          const params = new URLSearchParams();
          params.set("role", "FEDERATION_ADMIN");
          if (federationId) params.set("federationId", federationId);
          if (searchQuery) params.set("search", searchQuery);
          if (statusFilter !== "ALL") params.set("status", statusFilter);
          if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
          params.set("pageSize", "200");

          const res = await fetch(`/api/complaints?${params.toString()}`);
          if (res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.complaints)) {
              cases = json.complaints;
            }
          }
        } catch (apiErr) {
          console.warn("Notice: /api/complaints fetch failed, falling back to direct service:", apiErr);
        }
      }

      if (cases.length === 0) {
        const direct = await complaintService.listGrievances({
          role: "FEDERATION_ADMIN",
          federationId,
          searchQuery: searchQuery || undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          priority: priorityFilter !== "ALL" ? priorityFilter : undefined,
        });
        cases = direct.cases;
      }

      if (cases && cases.length > 0) {
        complaintsList = cases.map((c: GrievanceCase) => {
          const isResolved = c.status === "RESOLVED";
          const isRejected = c.status === "REJECTED";
          const isClosed = c.status === "CLOSED";
          const isCustomerComplainant = c.raisedByRole === "CUSTOMER";
          const isAgainstWorker = c.targetRole === "WORKER" || !!c.targetProfileId || !!c.targetWorkerId;
          const isCustVsWorker = isCustomerComplainant && isAgainstWorker;

          const displayStatus: ComplaintStatusDisplay = isResolved
            ? "RESOLVED"
            : isRejected
            ? "REJECTED"
            : isClosed
            ? "CLOSED"
            : c.status === "ACTION_REQUIRED"
            ? "ACTION_REQUIRED"
            : c.status === "ESCALATED"
            ? "ESCALATED"
            : c.status === "UNDER_REVIEW"
            ? "UNDER_REVIEW"
            : "PENDING";

          const workerResponseSubmission = c.timeline?.find(
            (t) => t.type === "RESPONSE_SUBMISSION" && (t.actorRole === "WORKER" || t.actorId === c.targetProfileId)
          );

          let workerResponseStatus: "AWAITING" | "RECEIVED" | "NOT_APPLICABLE" = "NOT_APPLICABLE";
          if (isCustVsWorker) {
            workerResponseStatus = c.responseRequests?.workerSubmitted ? "RECEIVED" : "AWAITING";
          }

          return {
            id: c.id,
            complaintNumber: c.complaintNumber,
            bookingId: c.bookingId || undefined,
            complainantRole: (c.raisedByRole || "CUSTOMER") as "CUSTOMER" | "WORKER" | "FEDERATION_ADMIN",
            customerName: c.raisedByName,
            customerPhone: c.raisedByPhone || "+91 98000 00000",
            workerId: c.targetWorkerId || c.targetProfileId || "WRK-AHM-0101",
            workerName: c.targetName || (c.raisedByRole === "FEDERATION_ADMIN" ? "Platform Administration" : "Federation Craftsman"),
            workerProfession: c.raisedByRole === "FEDERATION_ADMIN" ? "Super Administrator" : c.category.includes("Plumb") ? "Plumber" : "Skilled Craftsman",
            workerResponseStatus,
            workerStatement: workerResponseSubmission?.message,
            workerEvidenceUrls: workerResponseSubmission?.evidenceUrls,
            workerSubmittedAt: c.responseRequests?.workerSubmittedAt || workerResponseSubmission?.timestamp,
            subject: c.subject,
            description: c.description,
            category: c.category,
            subcategory: c.subcategory,
            submittedDate: c.createdAt ? c.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
            status: displayStatus,
            rawStatus: (isResolved || isRejected || isClosed) ? "RESOLVED" : "OPEN",
            lifecycleStatus: c.status,
            priority: c.priority,
            suggestedPriority: c.suggestedPriority,
            triageReason: c.triageReason,
            resolutionNotes: c.resolution?.actionTaken || undefined,
            resolvedAt: c.resolution?.resolvedAt ? c.resolution.resolvedAt.split("T")[0] : undefined,
            resolvedBy: c.resolution?.resolvedByName || undefined,
            rejectionReason: c.rejectionReason || undefined,
            rejectedAt: c.rejectedAt ? c.rejectedAt.split("T")[0] : undefined,
            rejectedBy: c.rejectedBy || undefined,
            closedAt: c.closedAt ? c.closedAt.split("T")[0] : undefined,
            closedBy: c.closedBy || undefined,
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

    const computeMetrics = (items: FederationComplaintItem[]): SubsectionMetrics => ({
      total: items.length,
      pending: items.filter((c) => c.lifecycleStatus === "OPEN").length,
      underReview: items.filter((c) => c.lifecycleStatus === "UNDER_REVIEW").length,
      waitingForResponse: items.filter(
        (c) => c.lifecycleStatus === "ACTION_REQUIRED" || c.workerResponseStatus === "AWAITING"
      ).length,
      resolved: items.filter((c) => c.lifecycleStatus === "RESOLVED").length,
      rejectedOrClosed: items.filter((c) => c.lifecycleStatus === "REJECTED" || c.lifecycleStatus === "CLOSED").length,
    });

    const userComplaints = filtered.filter((c) => c.complainantRole === "CUSTOMER");
    const workerComplaints = filtered.filter((c) => c.complainantRole === "WORKER");
    const myComplaints = filtered.filter((c) => c.complainantRole === "FEDERATION_ADMIN");

    const allUserComplaints = complaintsList.filter((c) => c.complainantRole === "CUSTOMER");
    const allWorkerComplaints = complaintsList.filter((c) => c.complainantRole === "WORKER");
    const allMyComplaints = complaintsList.filter((c) => c.complainantRole === "FEDERATION_ADMIN");

    const userMetrics = computeMetrics(allUserComplaints);
    const workerMetrics = computeMetrics(allWorkerComplaints);
    const myMetrics = computeMetrics(allMyComplaints);

    const totalCount = complaintsList.length;
    const pendingCount = complaintsList.filter((c) => c.lifecycleStatus === "OPEN").length;
    const underReviewCount = complaintsList.filter((c) => c.lifecycleStatus === "UNDER_REVIEW").length;
    const actionRequiredCount = complaintsList.filter((c) => c.lifecycleStatus === "ACTION_REQUIRED").length;
    const escalatedCount = complaintsList.filter((c) => c.lifecycleStatus === "ESCALATED").length;
    const resolvedCount = complaintsList.filter((c) => c.lifecycleStatus === "RESOLVED").length;
    const highOrCriticalCount = complaintsList.filter((c) => c.priority === "HIGH" || c.priority === "CRITICAL").length;

    return {
      complaints: filtered,
      userComplaints,
      workerComplaints,
      myComplaints,
      userMetrics,
      workerMetrics,
      myMetrics,
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
   * Filters complaint items by subsection.
   */
  getComplaintsForSubsection(
    items: FederationComplaintItem[],
    section: "WORKER_COMPLAINTS" | "USER_COMPLAINTS" | "MY_COMPLAINTS"
  ): FederationComplaintItem[] {
    if (section === "WORKER_COMPLAINTS") {
      return items.filter((c) => c.complainantRole === "WORKER");
    }
    if (section === "MY_COMPLAINTS") {
      return items.filter((c) => c.complainantRole === "FEDERATION_ADMIN");
    }
    return items.filter((c) => c.complainantRole === "CUSTOMER");
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
  ): Promise<{ success: boolean; complaintId: string; updatedCase: GrievanceCase }> {
    const updatedCase = await complaintService.resolveGrievance(
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
      updatedCase,
    };
  }

  /**
   * Rejects a grievance case.
   */
  async rejectComplaint(
    complaintId: string,
    reason: string,
    actorId: string = "fed-admin-1",
    actorName: string = "Federation Grievance Officer"
  ): Promise<{ success: boolean; complaintId: string; updatedCase: GrievanceCase }> {
    const updatedCase = await complaintService.rejectGrievance(
      complaintId,
      reason,
      actorId,
      "FEDERATION_ADMIN",
      actorName
    );
    return {
      success: true,
      complaintId,
      updatedCase,
    };
  }

  /**
   * Administratively closes a grievance case.
   */
  async closeComplaint(
    complaintId: string,
    notes: string,
    actorId: string = "fed-admin-1",
    actorName: string = "Federation Grievance Officer"
  ): Promise<{ success: boolean; complaintId: string; updatedCase: GrievanceCase }> {
    const updatedCase = await complaintService.closeGrievance(
      complaintId,
      notes,
      actorId,
      "FEDERATION_ADMIN",
      actorName
    );
    return {
      success: true,
      complaintId,
      updatedCase,
    };
  }

  /**
   * Requests a response statement from the worker.
   */
  async requestWorkerResponse(
    complaintId: string,
    message: string,
    actorId: string = "fed-admin-1",
    actorName: string = "Federation Grievance Officer"
  ): Promise<{ success: boolean; complaintId: string; updatedCase: GrievanceCase }> {
    const updatedCase = await complaintService.requestPartyResponse(
      complaintId,
      "WORKER",
      message,
      actorId,
      "FEDERATION_ADMIN",
      actorName
    );
    return {
      success: true,
      complaintId,
      updatedCase,
    };
  }
}

export const complaintManagementService = new ComplaintManagementService();
