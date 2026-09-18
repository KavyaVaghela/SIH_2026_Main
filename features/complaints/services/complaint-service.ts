import type { ComplaintStatus, UserRole } from "@/supabase/types/database.types";
import type {
  GrievanceCase,
  GrievanceLifecycleStatus,
  GrievancePriority,
  GrievancePartyRole,
  GrievanceTimelineEvent,
  GrievanceAuditEntry,
  GrievanceResolution,
  CreateGrievancePayload,
  GrievanceBookingContext,
} from "@/types/complaints/v2";
import { AppError } from "@/lib/errors";
import { notificationService } from "@/features/notifications/services/notification-service";

export interface Complaint {
  id: string;
  complaintNumber: string;
  bookingId?: string | null;
  raisedBy: string;
  targetProfileId?: string | null;
  category: string;
  description: string;
  status: ComplaintStatus;
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateComplaintPayload {
  raisedBy: string;
  raisedByRole?: GrievancePartyRole;
  category: string;
  description: string;
  bookingId?: string;
  targetProfileId?: string;
  targetRole?: GrievancePartyRole;
  federationId?: string;
  initialEvidenceUrls?: string[];
}

export interface IComplaintService {
  createComplaint(payload: CreateComplaintPayload): Promise<Complaint>;
  getComplaint(complaintId: string): Promise<Complaint | null>;
  listComplaints(actorId: string, role: UserRole): Promise<Complaint[]>;
  updateStatus(
    complaintId: string,
    status: ComplaintStatus,
    actorRole: UserRole,
    resolutionNotes?: string
  ): Promise<Complaint>;
}

export const ALLOWED_STATUS_TRANSITIONS: Record<
  GrievanceLifecycleStatus,
  GrievanceLifecycleStatus[]
> = {
  OPEN: ["UNDER_REVIEW", "REJECTED", "CLOSED"],
  UNDER_REVIEW: ["ACTION_REQUIRED", "ESCALATED", "RESOLVED", "REJECTED", "CLOSED"],
  ACTION_REQUIRED: ["UNDER_REVIEW", "ESCALATED", "REJECTED", "CLOSED"],
  ESCALATED: ["UNDER_REVIEW", "RESOLVED", "REJECTED"],
  RESOLVED: ["CLOSED"],
  REJECTED: [],
  CLOSED: [],
};

export function isCustomerVsWorkerComplaint(c: GrievanceCase): boolean {
  const isCustomerComplainant = c.raisedByRole === "CUSTOMER";
  const isAgainstWorker = c.targetRole === "WORKER" || !!c.targetProfileId || !!c.targetWorkerId;
  return isCustomerComplainant && isAgainstWorker;
}

export function assertWorkerResponseGate(c: GrievanceCase): void {
  if (isCustomerVsWorkerComplaint(c) && !c.responseRequests?.workerSubmitted) {
    throw new AppError(
      "Worker response is required before final action can be taken.",
      "WORKER_RESPONSE_REQUIRED",
      400
    );
  }
}

export function assertComplaintNotTerminated(c: GrievanceCase): void {
  if (c.status === "REJECTED" || c.status === "CLOSED") {
    throw new AppError(
      "This complaint has been terminated and cannot be modified.",
      "TERMINATED_CASE",
      400
    );
  }
}


export function computeSmartTriage(
  category: string,
  subcategory?: string,
  description?: string
): { suggestedPriority: GrievancePriority; triageReason: string; suggestedQueue: string } {
  const cat = (category || "").toLowerCase();
  const sub = (subcategory || "").toLowerCase();
  const desc = (description || "").toLowerCase();
  const combined = `${cat} ${sub} ${desc}`;

  if (
    combined.includes("safety") ||
    combined.includes("hazard") ||
    combined.includes("electric shock") ||
    combined.includes("fire") ||
    combined.includes("harass") ||
    combined.includes("violence") ||
    combined.includes("threat") ||
    combined.includes("unsafe")
  ) {
    return {
      suggestedPriority: "CRITICAL",
      triageReason: "Safety hazard, physical threat, or harassment pattern detected.",
      suggestedQueue: "Federation Safety & Disciplinary Queue",
    };
  }

  if (
    combined.includes("payment") ||
    combined.includes("billing") ||
    combined.includes("price") ||
    combined.includes("tariff") ||
    combined.includes("overcharge") ||
    combined.includes("fraud") ||
    combined.includes("damage") ||
    combined.includes("leak") ||
    combined.includes("broken")
  ) {
    return {
      suggestedPriority: "HIGH",
      triageReason: "Financial reconciliation discrepancy or physical property damage reported.",
      suggestedQueue: "Federation Financial & Claims Queue",
    };
  }

  if (
    combined.includes("platform") ||
    combined.includes("technical") ||
    combined.includes("infrastructure") ||
    combined.includes("server") ||
    combined.includes("app crash")
  ) {
    return {
      suggestedPriority: "HIGH",
      triageReason: "Platform technical infrastructure anomaly reported.",
      suggestedQueue: "Super Admin Platform Operations",
    };
  }

  if (
    combined.includes("conduct") ||
    combined.includes("misconduct") ||
    combined.includes("rude") ||
    combined.includes("behaviour") ||
    combined.includes("quality")
  ) {
    return {
      suggestedPriority: "MEDIUM",
      triageReason: "Workmanship or interpersonal conduct conciliation required.",
      suggestedQueue: "Federation Grievance Conciliation Queue",
    };
  }

  if (
    combined.includes("delay") ||
    combined.includes("schedule") ||
    combined.includes("no-show") ||
    combined.includes("time")
  ) {
    return {
      suggestedPriority: "MEDIUM",
      triageReason: "Service scheduling SLA or transit delay recorded.",
      suggestedQueue: "Federation Operations Dispatch Queue",
    };
  }

  return {
    suggestedPriority: "LOW",
    triageReason: "Standard cooperative inquiry or service clarification.",
    suggestedQueue: "Federation General Member Support",
  };
}

export function generateComplaintReference(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `KS-GRV-${year}-${randomSuffix}`;
}

export function mapLifecycleToDbStatus(status: GrievanceLifecycleStatus): ComplaintStatus {
  switch (status) {
    case "OPEN":
      return "OPEN";
    case "UNDER_REVIEW":
    case "ACTION_REQUIRED":
    case "ESCALATED":
      return "IN_REVIEW";
    case "RESOLVED":
    case "REJECTED":
    case "CLOSED":
      return "RESOLVED";
    default:
      return "OPEN";
  }
}

export class ComplaintService implements IComplaintService {
  private activeCases: Map<string, GrievanceCase> = new Map();

  private async getSupabaseClient() {
    if (typeof window === "undefined") {
      try {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        return createAdminClient();
      } catch {
        // ignore
      }
    }
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  }

  private parseStructuredEnvelope(raw: any): Partial<GrievanceCase> | null {
    if (!raw) return null;
    if (typeof raw === "object") return raw;
    if (typeof raw === "string" && (raw.startsWith("{") || raw.startsWith("["))) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Transforms raw DB row into a rich GrievanceCase entity.
   */
  private mapDbRowToGrievanceCase(row: any): GrievanceCase {
    const envelope = (this.parseStructuredEnvelope(row.description) || {}) as any;
    const resolutionEnvelope = (this.parseStructuredEnvelope(row.resolution_notes) || {}) as any;

    const category = row.category || envelope.category || "General";
    const subcategory = envelope.subcategory;
    const detailedDesc = envelope.description || (typeof row.description === "string" && !row.description.startsWith("{") ? row.description : "Grievance statement recorded.");
    const subject = envelope.subject || row.category || "Service Issue";

    const triage = computeSmartTriage(category, subcategory, detailedDesc);
    const rawStatus = row.status as ComplaintStatus;
    let status: GrievanceLifecycleStatus = envelope.status || (rawStatus === "RESOLVED" ? "RESOLVED" : rawStatus === "IN_REVIEW" ? "UNDER_REVIEW" : "OPEN");

    const timeline: GrievanceTimelineEvent[] = envelope.timeline || [
      {
        id: `tl-init-${row.id}`,
        type: "PUBLIC_UPDATE",
        visibility: "PUBLIC",
        actorId: row.raised_by,
        actorRole: envelope.raisedByRole || "CUSTOMER",
        actorName: envelope.raisedByName || "Complainant",
        message: "Grievance submitted.",
        timestamp: row.created_at,
      },
    ];

    const auditTrail: GrievanceAuditEntry[] = envelope.auditTrail || [
      {
        id: `aud-init-${row.id}`,
        complaintId: row.id,
        actorId: row.raised_by,
        actorRole: envelope.raisedByRole || "CUSTOMER",
        actorName: envelope.raisedByName || "Complainant",
        action: "CREATE",
        notes: "Grievance initialized.",
        timestamp: row.created_at,
      },
    ];

    return {
      id: row.id,
      complaintNumber: row.complaint_number || `KS-GRV-${row.id.slice(0, 8)}`,
      bookingId: row.booking_id || null,
      raisedBy: row.raised_by,
      raisedByRole: (envelope.raisedByRole || (row.raised_by_profile?.role === "WORKER" ? "WORKER" : "CUSTOMER")) as GrievancePartyRole,
      raisedByName: envelope.raisedByName || row.raised_by_profile?.full_name || "Complainant",
      raisedByPhone: envelope.raisedByPhone || row.raised_by_profile?.phone,
      targetProfileId: row.target_profile_id || null,
      targetRole: envelope.targetRole || "WORKER",
      targetName: envelope.targetName || row.target_profile?.full_name || "Assigned Worker",
      targetPhone: envelope.targetPhone || row.target_profile?.phone,
      targetWorkerId: envelope.targetWorkerId,
      federationId: envelope.federationId || row.bookings?.federation_id || "b765df3b-c418-4a15-b79f-3cbc09e475dc",
      federationName: envelope.federationName || row.bookings?.federations?.name || "Gujarat Labour Cooperative Federation",
      category,
      subcategory,
      subject,
      description: detailedDesc,
      priority: envelope.priority || triage.suggestedPriority,
      suggestedPriority: envelope.suggestedPriority || triage.suggestedPriority,
      triageReason: envelope.triageReason || triage.triageReason,
      suggestedQueue: envelope.suggestedQueue || triage.suggestedQueue,
      status,
      assignedOfficerId: envelope.assignedOfficerId || null,
      assignedOfficerName: envelope.assignedOfficerName || null,
      assignedAt: envelope.assignedAt || null,
      evidenceUrls: envelope.evidenceUrls || [],
      timeline,
      internalNotes: timeline.filter((item) => item.visibility === "INTERNAL"),
      auditTrail,
      resolution: envelope.resolution || (row.resolution_notes ? {
        resolutionType: resolutionEnvelope.resolutionType || "CONCILIATION",
        summary: resolutionEnvelope.summary || row.resolution_notes,
        actionTaken: resolutionEnvelope.actionTaken || row.resolution_notes,
        compensationReference: resolutionEnvelope.compensationReference,
        followUpRequired: resolutionEnvelope.followUpRequired || false,
        resolvedBy: resolutionEnvelope.resolvedBy || "Federation Officer",
        resolvedByName: resolutionEnvelope.resolvedByName || "Federation Officer",
        resolvedAt: row.resolved_at || row.updated_at,
      } : null),
      escalation: envelope.escalation || null,
      responseRequests: envelope.responseRequests || null,
      rejectionReason: envelope.rejectionReason || null,
      rejectedAt: envelope.rejectedAt || null,
      rejectedBy: envelope.rejectedBy || null,
      closedAt: envelope.closedAt || null,
      closedBy: envelope.closedBy || null,
      bookingContext: envelope.bookingContext || (row.bookings ? {
        bookingId: row.bookings.id,
        bookingNumber: row.bookings.booking_number,
        serviceTitle: row.bookings.services?.title,
        scheduledStartAt: row.bookings.scheduled_start_at,
        bookingStatus: row.bookings.status,
        systemEstimate: row.bookings.total_amount ? Number(row.bookings.total_amount) : undefined,
        workerEstimate: row.bookings.total_amount ? Number(row.bookings.total_amount) : undefined,
        finalBill: row.bookings.total_amount ? Number(row.bookings.total_amount) : undefined,
        paymentStatus: row.bookings.payments?.[0]?.status || "PENDING",
      } : null),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Filters out internal notes for customers and workers.
   */
  private sanitizeForViewer(grievance: GrievanceCase, viewerRole?: GrievancePartyRole): GrievanceCase {
    if (viewerRole === "CUSTOMER" || viewerRole === "WORKER") {
      return {
        ...grievance,
        timeline: grievance.timeline.filter((item) => item.visibility !== "INTERNAL"),
        internalNotes: [],
        auditTrail: grievance.auditTrail.filter((item) => item.action !== "INTERNAL_NOTE"),
      };
    }
    return {
      ...grievance,
      internalNotes: grievance.timeline.filter((item) => item.visibility === "INTERNAL"),
    };
  }

  /**
   * Phase 5 Primary Creation: Creates a full Grievance Case with smart triage,
   * audit trail, and persistence to database.
   */
  async createGrievance(payload: CreateGrievancePayload): Promise<GrievanceCase> {
    const supabase = await this.getSupabaseClient();
    const complaintNumber = generateComplaintReference();
    const triage = computeSmartTriage(payload.category, payload.subcategory, payload.description);
    const finalPriority = payload.priority || triage.suggestedPriority;
    const now = new Date().toISOString();

    let federationId = payload.federationId || "b765df3b-c418-4a15-b79f-3cbc09e475dc";
    let bookingContext: GrievanceBookingContext | null = null;
    let targetProfileId = payload.targetProfileId;
    let targetRole = payload.targetRole || (payload.raisedByRole === "WORKER" ? "CUSTOMER" : "WORKER");
    let targetName = payload.targetName;

    // If linked to a booking, fetch rich booking details and authorized parties
    if (payload.bookingId) {
      if (!payload.bookingId.startsWith("bk-mock")) {
        try {
          const { data: bData } = await (supabase.from("bookings") as any)
            .select(`
              id,
              booking_number,
              status,
              total_amount,
              scheduled_start_at,
              federation_id,
              worker_id,
              customer_id,
              services (title),
              workers (id, profile_id, profiles:profile_id (full_name, phone)),
              profiles!bookings_customer_id_fkey (full_name, phone),
              payments (status)
            `)
            .eq("id", payload.bookingId)
            .maybeSingle();

          if (payload.raisedByRole === "WORKER") {
            if (!bData) {
              throw new AppError("Selected booking does not belong to the authenticated worker.", "FORBIDDEN", 403);
            }
            const workerMatches =
              (bData.worker_id && bData.worker_id === payload.raisedBy) ||
              (bData.workers?.id && bData.workers.id === payload.raisedBy) ||
              (bData.workers?.profile_id && bData.workers.profile_id === payload.raisedBy);

            if (!workerMatches) {
              throw new AppError("Selected booking does not belong to the authenticated worker.", "FORBIDDEN", 403);
            }
          }

          if (bData) {
            federationId = bData.federation_id || federationId;
            const workerProf = bData.workers?.profiles || {};
            const custProf = bData.profiles || {};

            if (payload.raisedByRole === "WORKER") {
              targetProfileId = bData.customer_id || targetProfileId;
              targetRole = "CUSTOMER";
              targetName = custProf.full_name || targetName || "Customer";
              if (!payload.category || payload.category === "General") {
                payload.category = bData.services?.title || "Service Job Issue";
              }
            } else if (!targetProfileId && payload.raisedBy === bData.customer_id) {
              targetProfileId = bData.workers?.profile_id || undefined;
              targetRole = "WORKER";
              targetName = workerProf.full_name || targetName || "Worker";
            }

            bookingContext = {
              bookingId: bData.id,
              bookingNumber: bData.booking_number,
              serviceTitle: bData.services?.title,
              scheduledStartAt: bData.scheduled_start_at,
              bookingStatus: bData.status,
              systemEstimate: bData.total_amount ? Number(bData.total_amount) : undefined,
              workerEstimate: bData.total_amount ? Number(bData.total_amount) : undefined,
              finalBill: bData.total_amount ? Number(bData.total_amount) : undefined,
              paymentStatus: bData.payments?.[0]?.status || "PENDING",
              customerName: custProf.full_name,
              workerName: workerProf.full_name,
            };
          }
        } catch (err: any) {
          if (err.statusCode === 403 || err.status === 403) throw err;
          console.warn("Could not fetch booking context for grievance:", err);
        }
      } else if (payload.raisedByRole === "WORKER") {
        throw new AppError("Selected booking does not belong to the authenticated worker.", "FORBIDDEN", 403);
      }
    }

    if (!targetName && bookingContext) {
      targetName = payload.raisedByRole === "WORKER" ? bookingContext.customerName : bookingContext.workerName;
    }
    if (!targetName) {
      targetName = targetRole === "CUSTOMER" ? "Household Customer" : "Trade Professional";
    }

    const timelineItem: GrievanceTimelineEvent = {
      id: `tl-${Date.now()}-1`,
      type: "PUBLIC_UPDATE",
      visibility: "PUBLIC",
      actorId: payload.raisedBy,
      actorRole: payload.raisedByRole || "CUSTOMER",
      actorName: payload.raisedByName || "Complainant",
      message: `Complaint submitted under category: ${payload.category}.`,
      timestamp: now,
    };

    const auditItem: GrievanceAuditEntry = {
      id: `aud-${Date.now()}-1`,
      complaintId: "",
      actorId: payload.raisedBy,
      actorRole: payload.raisedByRole || "CUSTOMER",
      actorName: payload.raisedByName || "Complainant",
      action: "CREATE",
      notes: `Grievance case initialized. System suggested priority: ${triage.suggestedPriority}.`,
      timestamp: now,
    };

    const structuredPayload = {
      version: 1,
      complaintNumber,
      category: payload.category,
      subcategory: payload.subcategory,
      subject: payload.subject,
      description: payload.description,
      priority: finalPriority,
      suggestedPriority: triage.suggestedPriority,
      triageReason: triage.triageReason,
      suggestedQueue: triage.suggestedQueue,
      status: "OPEN" as GrievanceLifecycleStatus,
      raisedByRole: payload.raisedByRole || "CUSTOMER",
      raisedByName: payload.raisedByName || "Complainant",
      raisedByPhone: payload.raisedByPhone,
      targetRole,
      targetName,
      targetWorkerId: payload.targetWorkerId,
      federationId,
      evidenceUrls: payload.evidenceUrls || [],
      bookingContext,
      timeline: [timelineItem],
      auditTrail: [auditItem],
    };

    let createdId = payload.id || `cmp-${Date.now()}`;
    try {
      const insertRecord: any = {
        complaint_number: complaintNumber,
        booking_id: payload.bookingId && !payload.bookingId.startsWith("bk-mock") ? payload.bookingId : null,
        raised_by: payload.raisedBy,
        target_profile_id: targetProfileId && !targetProfileId.startsWith("p-") ? targetProfileId : null,
        category: payload.category,
        description: JSON.stringify(structuredPayload),
        status: "OPEN",
      };
      if (payload.id) {
        insertRecord.id = payload.id;
      }

      const { data, error } = await (supabase.from("complaints") as any)
        .insert(insertRecord)
        .select()
        .single();

      if (!error && data) {
        createdId = data.id;
        auditItem.complaintId = createdId;
      } else if (error) {
        console.warn("DB insert error on complaints, falling back to memory:", error.message);
      }
    } catch (err) {
      console.warn("Failed DB complaint insert:", err);
    }

    const grievanceCase: GrievanceCase = {
      id: createdId,
      complaintNumber,
      bookingId: payload.bookingId || null,
      raisedBy: payload.raisedBy,
      raisedByRole: payload.raisedByRole || "CUSTOMER",
      raisedByName: payload.raisedByName || "Complainant",
      raisedByPhone: payload.raisedByPhone,
      targetProfileId: targetProfileId || null,
      targetRole,
      targetName,
      targetPhone: undefined,
      targetWorkerId: payload.targetWorkerId,
      federationId,
      category: payload.category,
      subcategory: payload.subcategory,
      subject: payload.subject,
      description: payload.description,
      priority: finalPriority,
      suggestedPriority: triage.suggestedPriority,
      triageReason: triage.triageReason,
      suggestedQueue: triage.suggestedQueue,
      status: "OPEN",
      evidenceUrls: payload.evidenceUrls || [],
      timeline: [timelineItem],
      auditTrail: [auditItem],
      bookingContext,
      createdAt: now,
      updatedAt: now,
    };

    this.activeCases.set(grievanceCase.id, grievanceCase);

    // Notify Federation Admin
    try {
      await notificationService.sendNotification({
        profileId: federationId,
        title: `New Grievance Case: ${complaintNumber}`,
        message: `${payload.subject} (${finalPriority} Priority) filed in queue.`,
        type: finalPriority === "CRITICAL" ? "error" : "warning",
        metadata: { complaintId: grievanceCase.id, complaintNumber },
      });
    } catch {
      // ignore
    }

    return grievanceCase;
  }

  /**
   * Retrieves single grievance case by ID, optionally sanitizing internal notes for restricted roles.
   */
  async getGrievanceById(
    id: string,
    viewerRole?: GrievancePartyRole,
    viewerId?: string,
    viewerFederationId?: string
  ): Promise<GrievanceCase | null> {
    const cached = this.activeCases.get(id);

    try {
      const supabase = await this.getSupabaseClient();
      const { data, error } = await (supabase.from("complaints") as any)
        .select(`
          id,
          complaint_number,
          booking_id,
          raised_by,
          target_profile_id,
          category,
          description,
          status,
          resolution_notes,
          resolved_at,
          created_at,
          updated_at,
          raised_by_profile:raised_by (full_name, phone, role),
          target_profile:target_profile_id (full_name, phone, role),
          bookings (
            id,
            booking_number,
            status,
            total_amount,
            scheduled_start_at,
            federation_id,
            services (title),
            federations (name),
            payments (status)
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (!error && data) {
        const mapped = this.mapDbRowToGrievanceCase(data);
        this.activeCases.set(mapped.id, mapped);

        if (viewerRole && viewerId) {
          if (
            viewerRole !== "SUPER_ADMIN" &&
            viewerRole !== "FEDERATION_ADMIN" &&
            mapped.raisedBy !== viewerId &&
            mapped.targetProfileId !== viewerId
          ) {
            throw new AppError("Access denied: You are not authorized to view this grievance case.", "FORBIDDEN", 403);
          }
          if (viewerRole === "FEDERATION_ADMIN" && viewerFederationId && mapped.federationId && mapped.federationId !== viewerFederationId) {
            throw new AppError("Access denied: You are not authorized to view complaints outside your federation.", "FORBIDDEN", 403);
          }
        }

        return this.sanitizeForViewer(mapped, viewerRole);
      }
    } catch (err: any) {
      if (err.status === 403 || err.statusCode === 403) throw err;
      console.warn("DB getGrievanceById notice:", err);
    }

    if (cached) {
      if (viewerRole && viewerId) {
        if (
          viewerRole !== "SUPER_ADMIN" &&
          viewerRole !== "FEDERATION_ADMIN" &&
          cached.raisedBy !== viewerId &&
          cached.targetProfileId !== viewerId
        ) {
          throw new AppError("Access denied: You are not authorized to view this grievance case.", "FORBIDDEN", 403);
        }
        if (viewerRole === "FEDERATION_ADMIN" && viewerFederationId && cached.federationId && cached.federationId !== viewerFederationId) {
          throw new AppError("Access denied: You are not authorized to view complaints outside your federation.", "FORBIDDEN", 403);
        }
      }
      return this.sanitizeForViewer(cached, viewerRole);
    }

    return null;
  }

  /**
   * Lists grievances scoped by role, federation, search queries, and status.
   */
  async listGrievances(options: {
    actorId?: string;
    role: GrievancePartyRole;
    federationId?: string;
    status?: string;
    category?: string;
    priority?: string;
    isEscalated?: boolean;
    searchQuery?: string;
    complainantRole?: "CUSTOMER" | "WORKER" | "FEDERATION_ADMIN";
    filterType?: "MY_COMPLAINTS" | "COMPLAINTS_FROM_CUSTOMERS";
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ cases: GrievanceCase[]; totalCount: number }> {
    const supabase = await this.getSupabaseClient();
    let loadedCases: GrievanceCase[] = [];

    try {
      const { data, error } = await (supabase.from("complaints") as any)
        .select(`
          id,
          complaint_number,
          booking_id,
          raised_by,
          target_profile_id,
          category,
          description,
          status,
          resolution_notes,
          resolved_at,
          created_at,
          updated_at,
          raised_by_profile:raised_by (full_name, phone, role),
          target_profile:target_profile_id (full_name, phone, role),
          bookings (
            id,
            booking_number,
            status,
            total_amount,
            scheduled_start_at,
            federation_id,
            services (title),
            federations (name),
            payments (status)
          )
        `)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        loadedCases = data.map((row: any) => this.mapDbRowToGrievanceCase(row));
        loadedCases.forEach((c) => this.activeCases.set(c.id, c));
      }
    } catch (err) {
      console.warn("DB listGrievances notice:", err);
    }

    if (loadedCases.length === 0) {
      loadedCases = Array.from(this.activeCases.values());
    }

    // Role-based isolation filtering
    let scoped = loadedCases;
    if (options.role === "CUSTOMER") {
      scoped = scoped.filter((c) => c.raisedBy === options.actorId || c.targetProfileId === options.actorId);
    } else if (options.role === "WORKER") {
      let workerRecordId: string | null = null;
      let workerProfileId = options.actorId;
      if (options.actorId) {
        try {
          const { data: wRow } = await (supabase.from("workers") as any)
            .select("id, profile_id")
            .or(`id.eq.${options.actorId},profile_id.eq.${options.actorId}`)
            .maybeSingle();
          if (wRow) {
            workerRecordId = wRow.id;
            workerProfileId = wRow.profile_id;
          }
        } catch {
          // ignore
        }
      }

      const isWorkerRaised = (c: GrievanceCase) => {
        if (c.raisedByRole !== "WORKER") return false;
        return (
          c.raisedBy === options.actorId ||
          c.raisedBy === workerProfileId ||
          (workerRecordId !== null && c.raisedBy === workerRecordId)
        );
      };

      const isWorkerTarget = (c: GrievanceCase) => {
        if (c.raisedByRole !== "CUSTOMER") return false;
        return (
          c.targetProfileId === options.actorId ||
          c.targetProfileId === workerProfileId ||
          c.targetWorkerId === options.actorId ||
          (workerRecordId !== null && (c.targetProfileId === workerRecordId || c.targetWorkerId === workerRecordId))
        );
      };

      if (options.filterType === "MY_COMPLAINTS") {
        scoped = scoped.filter((c) => isWorkerRaised(c));
      } else if (options.filterType === "COMPLAINTS_FROM_CUSTOMERS") {
        scoped = scoped.filter((c) => isWorkerTarget(c));
      } else {
        scoped = scoped.filter((c) => isWorkerRaised(c) || isWorkerTarget(c));
      }
    } else if (options.role === "FEDERATION_ADMIN" && options.federationId) {
      scoped = scoped.filter((c) => c.federationId === options.federationId);
    }
    // SUPER_ADMIN has cross-federation access

    // Complainant subsection filtering (Worker Complaints vs User Complaints)
    if (options.complainantRole) {
      scoped = scoped.filter((c) => c.raisedByRole === options.complainantRole);
    }

    // Criteria filtering
    if (options.role === "SUPER_ADMIN" && options.federationId && options.federationId !== "ALL") {
      scoped = scoped.filter((c) => c.federationId === options.federationId);
    }
    if (options.dateFrom) {
      const fromTime = new Date(options.dateFrom).getTime();
      scoped = scoped.filter((c) => new Date(c.createdAt).getTime() >= fromTime);
    }
    if (options.dateTo) {
      const toTime = new Date(options.dateTo).getTime();
      scoped = scoped.filter((c) => new Date(c.createdAt).getTime() <= toTime);
    }
    if (options.status && options.status !== "ALL") {
      scoped = scoped.filter((c) => c.status === options.status);
    }
    if (options.category && options.category !== "ALL") {
      scoped = scoped.filter((c) => c.category === options.category);
    }
    if (options.priority && options.priority !== "ALL") {
      scoped = scoped.filter((c) => c.priority === options.priority);
    }
    if (options.isEscalated !== undefined) {
      scoped = scoped.filter((c) => !!c.escalation?.isEscalated === options.isEscalated);
    }
    if (options.searchQuery?.trim()) {
      const q = options.searchQuery.toLowerCase().trim();
      scoped = scoped.filter(
        (c) =>
          c.complaintNumber.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.raisedByName.toLowerCase().includes(q) ||
          (c.targetName && c.targetName.toLowerCase().includes(q))
      );
    }

    const totalCount = scoped.length;
    const page = options.page || 1;
    const pageSize = options.pageSize || 50;
    const startIndex = (page - 1) * pageSize;
    const paginated = scoped.slice(startIndex, startIndex + pageSize);

    const sanitized = paginated.map((c) => this.sanitizeForViewer(c, options.role));

    return { cases: sanitized, totalCount };
  }

  /**
   * Enforces valid state machine transition and logs append-only audit entry.
   */
  async updateLifecycleStatus(
    id: string,
    newStatus: GrievanceLifecycleStatus,
    actorId: string,
    actorRole: GrievancePartyRole,
    actorName: string,
    reason?: string
  ): Promise<GrievanceCase> {
    const currentCase = await this.getGrievanceById(id);
    if (!currentCase) {
      throw new AppError(`Grievance case ${id} not found.`, "NOT_FOUND", 404);
    }

    // Role check: Only federation or super admin can change status directly
    if (actorRole !== "FEDERATION_ADMIN" && actorRole !== "SUPER_ADMIN") {
      throw new AppError("Only Federation Admin or Super Admin can update case lifecycle status.", "FORBIDDEN", 403);
    }

    assertComplaintNotTerminated(currentCase);

    if (currentCase.status === newStatus) {
      return currentCase;
    }

    // Enforce worker response gate on final actions
    if (newStatus === "RESOLVED" || newStatus === "REJECTED" || newStatus === "CLOSED") {
      assertWorkerResponseGate(currentCase);
    }

    // Enforce state machine transitions
    const allowed = ALLOWED_STATUS_TRANSITIONS[currentCase.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        `Invalid status transition from ${currentCase.status} to ${newStatus}.`,
        "INVALID_STATE_TRANSITION",
        400
      );
    }

    const now = new Date().toISOString();
    const oldStatus = currentCase.status;

    const timelineItem: GrievanceTimelineEvent = {
      id: `tl-${Date.now()}`,
      type: "STATUS_CHANGE",
      visibility: "PUBLIC",
      actorId,
      actorRole,
      actorName,
      message: `Status transitioned from ${oldStatus} to ${newStatus}.${reason ? ` Reason: ${reason}` : ""}`,
      timestamp: now,
    };

    const auditItem: GrievanceAuditEntry = {
      id: `aud-${Date.now()}`,
      complaintId: id,
      actorId,
      actorRole,
      actorName,
      action: "STATUS_CHANGE",
      oldValue: oldStatus,
      newValue: newStatus,
      notes: reason,
      timestamp: now,
    };

    const updatedCase: GrievanceCase = {
      ...currentCase,
      status: newStatus,
      rejectionReason: newStatus === "REJECTED" ? (reason || "Formally rejected") : currentCase.rejectionReason,
      rejectedAt: newStatus === "REJECTED" ? now : currentCase.rejectedAt,
      rejectedBy: newStatus === "REJECTED" ? (actorName || actorId) : currentCase.rejectedBy,
      closedAt: newStatus === "CLOSED" ? now : currentCase.closedAt,
      closedBy: newStatus === "CLOSED" ? (actorName || actorId) : currentCase.closedBy,
      timeline: [...currentCase.timeline, timelineItem],
      auditTrail: [...currentCase.auditTrail, auditItem],
      updatedAt: now,
    };

    this.activeCases.set(id, updatedCase);
    await this.persistGrievanceToDb(updatedCase);

    // Notify Complainant
    try {
      await notificationService.sendNotification({
        profileId: updatedCase.raisedBy,
        title: `Grievance Update: ${updatedCase.complaintNumber}`,
        message: `Case status is now: ${newStatus.replace(/_/g, " ")}.`,
        type: newStatus === "RESOLVED" ? "success" : "info",
        metadata: { complaintId: id, status: newStatus },
      });
    } catch {
      // ignore
    }

    return updatedCase;
  }

  /**
   * Adjusts grievance priority with audit log.
   */
  async adjustPriority(
    id: string,
    newPriority: GrievancePriority,
    actorId: string,
    actorRole: GrievancePartyRole,
    actorName: string,
    reason: string
  ): Promise<GrievanceCase> {
    if (actorRole !== "FEDERATION_ADMIN" && actorRole !== "SUPER_ADMIN") {
      throw new AppError("Only Federation Admin or Super Admin can adjust case priority.", "FORBIDDEN", 403);
    }

    const currentCase = await this.getGrievanceById(id);
    if (!currentCase) throw new AppError(`Case ${id} not found.`, "NOT_FOUND", 404);

    assertComplaintNotTerminated(currentCase);

    const oldPriority = currentCase.priority;
    if (oldPriority === newPriority) return currentCase;

    const now = new Date().toISOString();
    const auditItem: GrievanceAuditEntry = {
      id: `aud-${Date.now()}`,
      complaintId: id,
      actorId,
      actorRole,
      actorName,
      action: "PRIORITY_CHANGE",
      oldValue: oldPriority,
      newValue: newPriority,
      notes: reason,
      timestamp: now,
    };

    const timelineItem: GrievanceTimelineEvent = {
      id: `tl-${Date.now()}`,
      type: "PRIORITY_CHANGE",
      visibility: "PUBLIC",
      actorId,
      actorRole,
      actorName,
      message: `Priority adjusted from ${oldPriority} to ${newPriority}. Note: ${reason}`,
      timestamp: now,
    };

    const updated: GrievanceCase = {
      ...currentCase,
      priority: newPriority,
      timeline: [...currentCase.timeline, timelineItem],
      auditTrail: [...currentCase.auditTrail, auditItem],
      updatedAt: now,
    };

    this.activeCases.set(id, updated);
    await this.persistGrievanceToDb(updated);
    return updated;
  }

  /**
   * Assigns a designated grievance officer to the case.
   */
  async assignOfficer(
    id: string,
    officerId: string,
    officerName: string,
    actorId: string,
    actorRole: GrievancePartyRole,
    actorName: string
  ): Promise<GrievanceCase> {
    const currentCase = await this.getGrievanceById(id);
    if (!currentCase) throw new AppError(`Case ${id} not found.`, "NOT_FOUND", 404);

    assertComplaintNotTerminated(currentCase);

    const now = new Date().toISOString();
    const oldOfficer = currentCase.assignedOfficerName || "Unassigned";

    const auditItem: GrievanceAuditEntry = {
      id: `aud-${Date.now()}`,
      complaintId: id,
      actorId,
      actorRole,
      actorName,
      action: "ASSIGN",
      oldValue: oldOfficer,
      newValue: officerName,
      timestamp: now,
    };

    const timelineItem: GrievanceTimelineEvent = {
      id: `tl-${Date.now()}`,
      type: "ASSIGNMENT",
      visibility: "PUBLIC",
      actorId,
      actorRole,
      actorName,
      message: `Case assigned to Federation Grievance Officer: ${officerName}.`,
      timestamp: now,
    };

    const updated: GrievanceCase = {
      ...currentCase,
      assignedOfficerId: officerId,
      assignedOfficerName: officerName,
      assignedAt: now,
      timeline: [...currentCase.timeline, timelineItem],
      auditTrail: [...currentCase.auditTrail, auditItem],
      updatedAt: now,
    };

    this.activeCases.set(id, updated);
    await this.persistGrievanceToDb(updated);
    return updated;
  }

  /**
   * Appends a timeline update (either PUBLIC_UPDATE or INTERNAL_NOTE).
   */
  async addTimelineUpdate(
    id: string,
    type: "PUBLIC_UPDATE" | "INTERNAL_NOTE",
    message: string,
    actorId: string,
    actorRole: GrievancePartyRole,
    actorName: string,
    evidenceUrls?: string[]
  ): Promise<GrievanceCase> {
    const currentCase = await this.getGrievanceById(id);
    if (!currentCase) throw new AppError(`Case ${id} not found.`, "NOT_FOUND", 404);

    const isAuthorized =
      actorRole === "SUPER_ADMIN" ||
      actorRole === "FEDERATION_ADMIN" ||
      currentCase.raisedBy === actorId ||
      currentCase.targetProfileId === actorId ||
      currentCase.targetWorkerId === actorId;

    if (!isAuthorized) {
      throw new AppError("Access denied: You are not authorized to update this complaint.", "FORBIDDEN", 403);
    }

    if (type === "INTERNAL_NOTE" && actorRole !== "FEDERATION_ADMIN" && actorRole !== "SUPER_ADMIN") {
      throw new AppError("Only Federation and Super Admin can post internal notes.", "FORBIDDEN", 403);
    }

    assertComplaintNotTerminated(currentCase);

    const now = new Date().toISOString();
    const timelineItem: GrievanceTimelineEvent = {
      id: `tl-${Date.now()}`,
      type,
      visibility: type === "INTERNAL_NOTE" ? "INTERNAL" : "PUBLIC",
      actorId,
      actorRole,
      actorName,
      message,
      evidenceUrls: evidenceUrls || [],
      timestamp: now,
    };

    const auditItem: GrievanceAuditEntry = {
      id: `aud-${Date.now()}`,
      complaintId: id,
      actorId,
      actorRole,
      actorName,
      action: type,
      notes: type === "INTERNAL_NOTE" ? "Internal investigative memo recorded." : message,
      timestamp: now,
    };

    const updated: GrievanceCase = {
      ...currentCase,
      timeline: [...currentCase.timeline, timelineItem],
      internalNotes:
        type === "INTERNAL_NOTE"
          ? [...(currentCase.internalNotes || []), timelineItem]
          : currentCase.internalNotes,
      auditTrail: [...currentCase.auditTrail, auditItem],
      updatedAt: now,
    };

    this.activeCases.set(id, updated);
    await this.persistGrievanceToDb(updated);
    return updated;
  }

  /**
   * Federation officer requests a response/clarification from Worker or Customer.
   */
  async requestPartyResponse(
    id: string,
    targetParty: GrievancePartyRole,
    message: string,
    actorId: string,
    actorRole: GrievancePartyRole,
    actorName: string
  ): Promise<GrievanceCase> {
    if (actorRole !== "FEDERATION_ADMIN" && actorRole !== "SUPER_ADMIN") {
      throw new AppError("Only Federation or Super Admin can issue formal response requests.", "FORBIDDEN", 403);
    }

    const currentCase = await this.getGrievanceById(id);
    if (!currentCase) throw new AppError(`Case ${id} not found.`, "NOT_FOUND", 404);

    assertComplaintNotTerminated(currentCase);

    const now = new Date().toISOString();
    const timelineItem: GrievanceTimelineEvent = {
      id: `tl-${Date.now()}`,
      type: "RESPONSE_REQUEST",
      visibility: "PUBLIC",
      actorId,
      actorRole,
      actorName,
      targetParty,
      message,
      timestamp: now,
    };

    const auditItem: GrievanceAuditEntry = {
      id: `aud-${Date.now()}`,
      complaintId: id,
      actorId,
      actorRole,
      actorName,
      action: "RESPONSE_REQUESTED",
      notes: `Official response requested from ${targetParty}: "${message}"`,
      timestamp: now,
    };

    const updated: GrievanceCase = {
      ...currentCase,
      status: "ACTION_REQUIRED",
      responseRequests: {
        ...(currentCase.responseRequests || {}),
        workerRequired: targetParty === "WORKER" ? true : currentCase.responseRequests?.workerRequired,
        customerRequired: targetParty === "CUSTOMER" ? true : currentCase.responseRequests?.customerRequired,
        prompt: message,
        requestedAt: now,
      },
      timeline: [...currentCase.timeline, timelineItem],
      auditTrail: [...currentCase.auditTrail, auditItem],
      updatedAt: now,
    };

    this.activeCases.set(id, updated);
    await this.persistGrievanceToDb(updated);

    // Notify requested party
    const targetUserId = targetParty === "WORKER" ? currentCase.targetProfileId : currentCase.raisedBy;
    if (targetUserId) {
      try {
        await notificationService.sendNotification({
          profileId: targetUserId,
          title: `Action Required: Response requested for ${currentCase.complaintNumber}`,
          message: `Federation officer requested your statement: ${message}`,
          type: "warning",
          metadata: { complaintId: id, complaintNumber: currentCase.complaintNumber },
        });
      } catch {
        // ignore
      }
    }

    return updated;
  }

  /**
   * Worker or Customer submits their official statement and supporting evidence.
   * Responses become immutable historical records.
   */
  async submitPartyResponse(
    id: string,
    responseText: string,
    evidenceUrls: string[],
    actorId: string,
    actorRole: GrievancePartyRole,
    actorName: string
  ): Promise<GrievanceCase> {
    const currentCase = await this.getGrievanceById(id);
    if (!currentCase) throw new AppError(`Case ${id} not found.`, "NOT_FOUND", 404);

    const supabase = await this.getSupabaseClient();
    let workerRecordId: string | null = null;
    let workerProfileId = actorId;
    if (actorRole === "WORKER" && actorId) {
      try {
        const { data: wRow } = await (supabase.from("workers") as any)
          .select("id, profile_id")
          .or(`id.eq.${actorId},profile_id.eq.${actorId}`)
          .maybeSingle();
        if (wRow) {
          workerRecordId = wRow.id;
          workerProfileId = wRow.profile_id;
        }
      } catch {
        // ignore
      }
    }

    const isWorkerTarget =
      currentCase.targetProfileId === actorId ||
      currentCase.targetProfileId === workerProfileId ||
      currentCase.targetWorkerId === actorId ||
      (workerRecordId !== null && (currentCase.targetProfileId === workerRecordId || currentCase.targetWorkerId === workerRecordId));

    const isAuthorized =
      actorRole === "FEDERATION_ADMIN" ||
      actorRole === "SUPER_ADMIN" ||
      actorId === currentCase.raisedBy ||
      (workerRecordId !== null && currentCase.raisedBy === workerRecordId) ||
      isWorkerTarget;

    if (!isAuthorized) {
      throw new AppError("Access denied: You are not authorized to submit a statement for this grievance.", "FORBIDDEN", 403);
    }

    assertComplaintNotTerminated(currentCase);

    const isWorker = actorRole === "WORKER" || isWorkerTarget;
    const isCustomer = actorRole === "CUSTOMER" || actorId === currentCase.raisedBy;

    // Worker response gate: For customer complaints against workers, worker cannot respond before Federation requests it
    if (isWorker && isCustomerVsWorkerComplaint(currentCase)) {
      // One Worker Response: Workers get ONE opportunity to respond to a complaint.
      if (currentCase.responseRequests?.workerSubmitted) {
        throw new AppError(
          "Worker has already submitted a response for this complaint.",
          "ALREADY_SUBMITTED",
          400
        );
      }

      if (!currentCase.responseRequests?.workerRequired) {
        throw new AppError(
          "Worker response has not been requested for this complaint.",
          "BUSINESS_RULE_VIOLATION",
          400
        );
      }
    }

    const now = new Date().toISOString();

    const timelineItem: GrievanceTimelineEvent = {
      id: `tl-${Date.now()}`,
      type: "RESPONSE_SUBMISSION",
      visibility: "PUBLIC",
      actorId,
      actorRole,
      actorName,
      message: responseText,
      evidenceUrls,
      timestamp: now,
    };

    const auditItem: GrievanceAuditEntry = {
      id: `aud-${Date.now()}`,
      complaintId: id,
      actorId,
      actorRole,
      actorName,
      action: "RESPONSE_SUBMITTED",
      notes: `Party ${actorRole} submitted official response statement.`,
      timestamp: now,
    };

    const updated: GrievanceCase = {
      ...currentCase,
      status: "UNDER_REVIEW", // Moves automatically back to under review
      responseRequests: {
        ...(currentCase.responseRequests || {}),
        workerRequired: isWorker ? false : currentCase.responseRequests?.workerRequired,
        workerSubmitted: isWorker ? true : currentCase.responseRequests?.workerSubmitted,
        workerSubmittedAt: isWorker ? now : currentCase.responseRequests?.workerSubmittedAt,
        customerRequired: isCustomer ? false : currentCase.responseRequests?.customerRequired,
        customerSubmitted: isCustomer ? true : currentCase.responseRequests?.customerSubmitted,
        customerSubmittedAt: isCustomer ? now : currentCase.responseRequests?.customerSubmittedAt,
      },
      timeline: [...currentCase.timeline, timelineItem],
      auditTrail: [...currentCase.auditTrail, auditItem],
      updatedAt: now,
    };

    this.activeCases.set(id, updated);
    await this.persistGrievanceToDb(updated);

    // Notify Federation
    try {
      await notificationService.sendNotification({
        profileId: currentCase.federationId,
        title: `Response Received: ${currentCase.complaintNumber}`,
        message: `${actorName} (${actorRole}) has submitted their formal statement.`,
        type: "info",
        metadata: { complaintId: id },
      });
    } catch {
      // ignore
    }

    return updated;
  }

  /**
   * Records official grievance conciliation resolution.
   */
  async resolveGrievance(
    id: string,
    resolution: GrievanceResolution,
    actorId: string,
    actorRole: GrievancePartyRole,
    actorName: string
  ): Promise<GrievanceCase> {
    if (actorRole !== "FEDERATION_ADMIN" && actorRole !== "SUPER_ADMIN") {
      throw new AppError("Only authorized Federation or Super Admin can resolve grievances.", "FORBIDDEN", 403);
    }

    const currentCase = await this.getGrievanceById(id);
    if (!currentCase) throw new AppError(`Case ${id} not found.`, "NOT_FOUND", 404);

    assertComplaintNotTerminated(currentCase);
    assertWorkerResponseGate(currentCase);

    const now = new Date().toISOString();
    const timelineItem: GrievanceTimelineEvent = {
      id: `tl-${Date.now()}`,
      type: "RESOLUTION",
      visibility: "PUBLIC",
      actorId,
      actorRole,
      actorName,
      message: `Case resolved via ${resolution.resolutionType}. Action Taken: ${resolution.actionTaken}`,
      metadata: {
        resolutionType: resolution.resolutionType,
        compensationReference: resolution.compensationReference,
      },
      timestamp: now,
    };

    const auditItem: GrievanceAuditEntry = {
      id: `aud-${Date.now()}`,
      complaintId: id,
      actorId,
      actorRole,
      actorName,
      action: "RESOLVED",
      notes: `Resolution recorded: ${resolution.summary}. Action: ${resolution.actionTaken}`,
      timestamp: now,
    };

    const updated: GrievanceCase = {
      ...currentCase,
      status: "RESOLVED",
      resolution: {
        ...resolution,
        resolvedAt: now,
        resolvedBy: actorId,
        resolvedByName: actorName,
      },
      timeline: [...currentCase.timeline, timelineItem],
      auditTrail: [...currentCase.auditTrail, auditItem],
      updatedAt: now,
    };

    this.activeCases.set(id, updated);
    await this.persistGrievanceToDb(updated);

    // Notify Complainant & Involved Party
    try {
      await notificationService.sendNotification({
        profileId: updated.raisedBy,
        title: `Complaint Resolved: ${updated.complaintNumber}`,
        message: `Your grievance has been resolved. Action: ${resolution.actionTaken}`,
        type: "success",
        metadata: { complaintId: id },
      });
      if (updated.targetProfileId) {
        await notificationService.sendNotification({
          profileId: updated.targetProfileId,
          title: `Dispute Resolution: ${updated.complaintNumber}`,
          message: `Dispute conciliated. Action: ${resolution.actionTaken}`,
          type: "info",
          metadata: { complaintId: id },
        });
      }
    } catch {
      // ignore
    }

    return updated;
  }

  /**
   * Rejects a grievance with reason and sets terminal status.
   */
  async rejectGrievance(
    id: string,
    reason: string,
    actorId: string,
    actorRole: GrievancePartyRole,
    actorName: string
  ): Promise<GrievanceCase> {
    if (actorRole !== "FEDERATION_ADMIN" && actorRole !== "SUPER_ADMIN") {
      throw new AppError("Only authorized Federation or Super Admin can reject complaints.", "FORBIDDEN", 403);
    }

    const currentCase = await this.getGrievanceById(id);
    if (!currentCase) throw new AppError(`Case ${id} not found.`, "NOT_FOUND", 404);

    assertComplaintNotTerminated(currentCase);
    assertWorkerResponseGate(currentCase);

    if (currentCase.status === "RESOLVED") {
      throw new AppError("Cannot reject an already resolved complaint.", "INVALID_STATE_TRANSITION", 400);
    }

    if (!reason || !reason.trim()) {
      throw new AppError("Rejection reason is required.", "VALIDATION_ERROR", 400);
    }

    const now = new Date().toISOString();
    const oldStatus = currentCase.status;

    const timelineItem: GrievanceTimelineEvent = {
      id: `tl-${Date.now()}`,
      type: "STATUS_CHANGE",
      visibility: "PUBLIC",
      actorId,
      actorRole,
      actorName,
      message: `Complaint formally rejected. Reason: ${reason.trim()}`,
      timestamp: now,
    };

    const auditItem: GrievanceAuditEntry = {
      id: `aud-${Date.now()}`,
      complaintId: id,
      actorId,
      actorRole,
      actorName,
      action: "STATUS_CHANGE",
      oldValue: oldStatus,
      newValue: "REJECTED",
      notes: reason.trim(),
      timestamp: now,
    };

    const updated: GrievanceCase = {
      ...currentCase,
      status: "REJECTED",
      rejectionReason: reason.trim(),
      rejectedAt: now,
      rejectedBy: actorName || actorId,
      timeline: [...currentCase.timeline, timelineItem],
      auditTrail: [...currentCase.auditTrail, auditItem],
      updatedAt: now,
    };

    this.activeCases.set(id, updated);
    await this.persistGrievanceToDb(updated);

    try {
      await notificationService.sendNotification({
        profileId: updated.raisedBy,
        title: `Complaint Rejected: ${updated.complaintNumber}`,
        message: `Your complaint has been rejected. Reason: ${reason.trim()}`,
        type: "error",
        metadata: { complaintId: id, status: "REJECTED" },
      });
    } catch {
      // ignore
    }

    return updated;
  }

  /**
   * Administratively closes a grievance and sets terminal status.
   */
  async closeGrievance(
    id: string,
    notes: string,
    actorId: string,
    actorRole: GrievancePartyRole,
    actorName: string
  ): Promise<GrievanceCase> {
    if (actorRole !== "FEDERATION_ADMIN" && actorRole !== "SUPER_ADMIN") {
      throw new AppError("Only authorized Federation or Super Admin can close complaints.", "FORBIDDEN", 403);
    }

    const currentCase = await this.getGrievanceById(id);
    if (!currentCase) throw new AppError(`Case ${id} not found.`, "NOT_FOUND", 404);

    assertComplaintNotTerminated(currentCase);
    assertWorkerResponseGate(currentCase);

    const now = new Date().toISOString();
    const oldStatus = currentCase.status;

    const timelineItem: GrievanceTimelineEvent = {
      id: `tl-${Date.now()}`,
      type: "STATUS_CHANGE",
      visibility: "PUBLIC",
      actorId,
      actorRole,
      actorName,
      message: `Complaint closed administratively.${notes?.trim() ? ` Notes: ${notes.trim()}` : ""}`,
      timestamp: now,
    };

    const auditItem: GrievanceAuditEntry = {
      id: `aud-${Date.now()}`,
      complaintId: id,
      actorId,
      actorRole,
      actorName,
      action: "STATUS_CHANGE",
      oldValue: oldStatus,
      newValue: "CLOSED",
      notes: notes?.trim() || "Administrative closure",
      timestamp: now,
    };

    const updated: GrievanceCase = {
      ...currentCase,
      status: "CLOSED",
      closedAt: now,
      closedBy: actorName || actorId,
      timeline: [...currentCase.timeline, timelineItem],
      auditTrail: [...currentCase.auditTrail, auditItem],
      updatedAt: now,
    };

    this.activeCases.set(id, updated);
    await this.persistGrievanceToDb(updated);

    try {
      await notificationService.sendNotification({
        profileId: updated.raisedBy,
        title: `Complaint Closed: ${updated.complaintNumber}`,
        message: `Your complaint has been closed administratively.`,
        type: "info",
        metadata: { complaintId: id, status: "CLOSED" },
      });
    } catch {
      // ignore
    }

    return updated;
  }

  /**
   * Escalates case to Super Admin, preserving complete federation history.
   */
  async escalateToSuperAdmin(
    id: string,
    reason: string,
    actorId: string,
    actorRole: GrievancePartyRole,
    actorName: string
  ): Promise<GrievanceCase> {
    if (actorRole !== "FEDERATION_ADMIN" && actorRole !== "SUPER_ADMIN") {
      throw new AppError("Only Federation Admin or Super Admin can escalate complaints.", "FORBIDDEN", 403);
    }

    const currentCase = await this.getGrievanceById(id);
    if (!currentCase) throw new AppError(`Case ${id} not found.`, "NOT_FOUND", 404);

    assertComplaintNotTerminated(currentCase);

    const now = new Date().toISOString();
    const oldStatus = currentCase.status;

    const timelineItem: GrievanceTimelineEvent = {
      id: `tl-${Date.now()}`,
      type: "ESCALATION",
      visibility: "PUBLIC",
      actorId,
      actorRole,
      actorName,
      message: `Case escalated to Super Administrator for state federation arbitration. Reason: ${reason}`,
      timestamp: now,
    };

    const auditItem: GrievanceAuditEntry = {
      id: `aud-${Date.now()}`,
      complaintId: id,
      actorId,
      actorRole,
      actorName,
      action: "ESCALATED",
      oldValue: oldStatus,
      newValue: "ESCALATED",
      notes: reason,
      timestamp: now,
    };

    const updated: GrievanceCase = {
      ...currentCase,
      status: "ESCALATED",
      escalation: {
        isEscalated: true,
        escalatedBy: actorId,
        escalatedByName: actorName,
        escalatedAt: now,
        reason,
        previousStatus: oldStatus,
      },
      timeline: [...currentCase.timeline, timelineItem],
      auditTrail: [...currentCase.auditTrail, auditItem],
      updatedAt: now,
    };

    this.activeCases.set(id, updated);
    await this.persistGrievanceToDb(updated);

    // Notify Super Admin
    try {
      await notificationService.sendNotification({
        profileId: "a0000000-0000-0000-0000-000000000001",
        title: `Escalation Notice: ${updated.complaintNumber}`,
        message: `${actorName} escalated case: ${reason}`,
        type: "error",
        metadata: { complaintId: id, federationId: updated.federationId },
      });
    } catch {
      // ignore
    }

    return updated;
  }

  /**
   * Synchronizes grievance updates to PostgreSQL complaints table.
   */
  private async persistGrievanceToDb(grievance: GrievanceCase): Promise<void> {
    try {
      const supabase = await this.getSupabaseClient();
      const dbStatus = mapLifecycleToDbStatus(grievance.status);

      const structuredPayload = {
        version: 1,
        complaintNumber: grievance.complaintNumber,
        category: grievance.category,
        subcategory: grievance.subcategory,
        subject: grievance.subject,
        description: grievance.description,
        priority: grievance.priority,
        suggestedPriority: grievance.suggestedPriority,
        triageReason: grievance.triageReason,
        suggestedQueue: grievance.suggestedQueue,
        status: grievance.status,
        raisedByRole: grievance.raisedByRole,
        raisedByName: grievance.raisedByName,
        raisedByPhone: grievance.raisedByPhone,
        targetRole: grievance.targetRole,
        targetName: grievance.targetName,
        targetWorkerId: grievance.targetWorkerId,
        federationId: grievance.federationId,
        federationName: grievance.federationName,
        assignedOfficerId: grievance.assignedOfficerId,
        assignedOfficerName: grievance.assignedOfficerName,
        assignedAt: grievance.assignedAt,
        evidenceUrls: grievance.evidenceUrls,
        timeline: grievance.timeline,
        auditTrail: grievance.auditTrail,
        resolution: grievance.resolution,
        escalation: grievance.escalation,
        bookingContext: grievance.bookingContext,
        responseRequests: grievance.responseRequests,
        rejectionReason: grievance.rejectionReason,
        rejectedAt: grievance.rejectedAt,
        rejectedBy: grievance.rejectedBy,
        closedAt: grievance.closedAt,
        closedBy: grievance.closedBy,
      };

      await (supabase.from("complaints") as any)
        .update({
          status: dbStatus,
          description: JSON.stringify(structuredPayload),
          resolution_notes: grievance.resolution?.actionTaken || grievance.resolution?.summary || null,
          resolved_at: grievance.resolution?.resolvedAt || (grievance.status === "RESOLVED" ? new Date().toISOString() : null),
          updated_at: new Date().toISOString(),
        })
        .eq("id", grievance.id);
    } catch (err) {
      console.warn("Notice: Failed DB persistence for grievance:", err);
    }
  }

  /**
   * Calculates real analytics across database complaints for a federation.
   */
  async getFederationAnalytics(federationId: string) {
    const { cases } = await this.listGrievances({
      role: "FEDERATION_ADMIN",
      federationId,
    });

    const totalComplaints = cases.length;
    const openComplaints = cases.filter((c) => c.status === "OPEN").length;
    const underReview = cases.filter((c) => c.status === "UNDER_REVIEW").length;
    const actionRequired = cases.filter((c) => c.status === "ACTION_REQUIRED").length;
    const resolvedComplaints = cases.filter((c) => c.status === "RESOLVED").length;
    const escalatedCount = cases.filter((c) => c.status === "ESCALATED").length;
    const highOrCriticalCount = cases.filter((c) => c.priority === "HIGH" || c.priority === "CRITICAL").length;

    const categoryBreakdown: Record<string, number> = {};
    const priorityBreakdown: Record<string, number> = {};

    let totalDurationMs = 0;
    let resolvedCount = 0;

    cases.forEach((c) => {
      categoryBreakdown[c.category] = (categoryBreakdown[c.category] || 0) + 1;
      priorityBreakdown[c.priority] = (priorityBreakdown[c.priority] || 0) + 1;

      if (c.resolution?.resolvedAt && c.createdAt) {
        const diff = new Date(c.resolution.resolvedAt).getTime() - new Date(c.createdAt).getTime();
        if (diff > 0) {
          totalDurationMs += diff;
          resolvedCount++;
        }
      }
    });

    const averageResolutionHours = resolvedCount > 0 ? Math.round((totalDurationMs / (resolvedCount * 3600000)) * 10) / 10 : 0;

    return {
      totalComplaints,
      openComplaints,
      underReview,
      actionRequired,
      resolvedComplaints,
      escalatedCount,
      highOrCriticalCount,
      averageResolutionHours,
      categoryBreakdown,
      priorityBreakdown,
    };
  }

  /**
   * Calculates comprehensive operational complaint monitoring and analytics across all federations for Super Admin.
   * Keeps metrics factual, measurable, and free of arbitrary scores or rankings.
   */
  async getSuperAdminComplaintOverview(options?: {
    federationId?: string;
    status?: string;
    priority?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    // 1. Retrieve all cases across platform for Super Admin
    const { cases } = await this.listGrievances({
      role: "SUPER_ADMIN",
      federationId: options?.federationId,
      status: options?.status,
      priority: options?.priority,
      category: options?.category,
      dateFrom: options?.dateFrom,
      dateTo: options?.dateTo,
      pageSize: 1000,
    });

    // 2. Map of federations
    const federationMap = new Map<string, {
      federationId: string;
      federationName: string;
      totalComplaints: number;
      customerComplaints: number;
      workerComplaints: number;
      federationComplaints: number;
      openComplaints: number;
      underReviewComplaints: number;
      waitingForResponseComplaints: number;
      resolvedComplaints: number;
      rejectedComplaints: number;
      closedComplaints: number;
      escalatedComplaints: number;
      totalResolutionDurationMs: number;
      resolvedCount: number;
    }>();

    // Overall summary counters
    let overallOpen = 0;
    let overallUnderReview = 0;
    let overallWaitingResponse = 0;
    let overallResolved = 0;
    let overallRejected = 0;
    let overallClosed = 0;
    let overallEscalated = 0;
    let overallDurationMs = 0;
    let overallResolvedCount = 0;

    // Distributions
    const categoryCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {
      OPEN: 0,
      UNDER_REVIEW: 0,
      ACTION_REQUIRED: 0,
      RESOLVED: 0,
      REJECTED: 0,
      CLOSED: 0,
      ESCALATED: 0,
    };

    // Trend buckets (by YYYY-MM-DD)
    const trendMap = new Map<string, { date: string; created: number; resolved: number }>();

    for (const c of cases) {
      const fedId = c.federationId || "b765df3b-c418-4a15-b79f-3cbc09e475dc";
      const fedName = c.federationName || (fedId === "b765df3b-c418-4a15-b79f-3cbc09e475dc" ? "Ahmedabad Skilled Workers Federation" : fedId === "df5e2a43-c749-4cca-bd26-fe5826b1d1c3" ? "Gujarat Household Services Federation" : "Regional Cooperative Federation");

      if (!federationMap.has(fedId)) {
        federationMap.set(fedId, {
          federationId: fedId,
          federationName: fedName,
          totalComplaints: 0,
          customerComplaints: 0,
          workerComplaints: 0,
          federationComplaints: 0,
          openComplaints: 0,
          underReviewComplaints: 0,
          waitingForResponseComplaints: 0,
          resolvedComplaints: 0,
          rejectedComplaints: 0,
          closedComplaints: 0,
          escalatedComplaints: 0,
          totalResolutionDurationMs: 0,
          resolvedCount: 0,
        });
      }

      const fed = federationMap.get(fedId)!;
      fed.totalComplaints++;

      // Role breakdown
      if (c.raisedByRole === "CUSTOMER") fed.customerComplaints++;
      else if (c.raisedByRole === "WORKER") fed.workerComplaints++;
      else if (c.raisedByRole === "FEDERATION_ADMIN") fed.federationComplaints++;

      // Status breakdown
      if (c.status === "OPEN") {
        fed.openComplaints++;
        overallOpen++;
        statusCounts.OPEN++;
      } else if (c.status === "UNDER_REVIEW") {
        fed.underReviewComplaints++;
        overallUnderReview++;
        statusCounts.UNDER_REVIEW++;
      } else if (c.status === "ACTION_REQUIRED") {
        fed.waitingForResponseComplaints++;
        overallWaitingResponse++;
        statusCounts.ACTION_REQUIRED++;
      } else if (c.status === "RESOLVED") {
        fed.resolvedComplaints++;
        overallResolved++;
        statusCounts.RESOLVED++;
      } else if (c.status === "REJECTED") {
        fed.rejectedComplaints++;
        overallRejected++;
        statusCounts.REJECTED++;
      } else if (c.status === "CLOSED") {
        fed.closedComplaints++;
        overallClosed++;
        statusCounts.CLOSED++;
      } else if (c.status === "ESCALATED") {
        fed.escalatedComplaints++;
        overallEscalated++;
        statusCounts.ESCALATED++;
      }

      if (c.escalation?.isEscalated && c.status !== "ESCALATED") {
        fed.escalatedComplaints++;
        overallEscalated++;
      }

      // Resolution time
      const resolvedAtStr = c.resolution?.resolvedAt || c.closedAt;
      if (resolvedAtStr && c.createdAt) {
        const dur = new Date(resolvedAtStr).getTime() - new Date(c.createdAt).getTime();
        if (dur > 0) {
          fed.totalResolutionDurationMs += dur;
          fed.resolvedCount++;
          overallDurationMs += dur;
          overallResolvedCount++;
        }
      }

      // Category breakdown
      const cat = c.category || "General";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      // Trend bucket
      if (c.createdAt) {
        const dayStr = c.createdAt.slice(0, 10);
        if (!trendMap.has(dayStr)) {
          trendMap.set(dayStr, { date: dayStr, created: 0, resolved: 0 });
        }
        trendMap.get(dayStr)!.created++;
      }
      if (resolvedAtStr) {
        const dayStr = resolvedAtStr.slice(0, 10);
        if (!trendMap.has(dayStr)) {
          trendMap.set(dayStr, { date: dayStr, created: 0, resolved: 0 });
        }
        trendMap.get(dayStr)!.resolved++;
      }
    }

    // Convert federation map to final rows with calculated averages
    const federationRows = Array.from(federationMap.values()).map((f) => ({
      federationId: f.federationId,
      federationName: f.federationName,
      totalComplaints: f.totalComplaints,
      customerComplaints: f.customerComplaints,
      workerComplaints: f.workerComplaints,
      federationComplaints: f.federationComplaints,
      openComplaints: f.openComplaints,
      underReviewComplaints: f.underReviewComplaints,
      waitingForResponseComplaints: f.waitingForResponseComplaints,
      resolvedComplaints: f.resolvedComplaints,
      rejectedComplaints: f.rejectedComplaints,
      closedComplaints: f.closedComplaints,
      escalatedComplaints: f.escalatedComplaints,
      averageResolutionHours: f.resolvedCount > 0 ? Math.round((f.totalResolutionDurationMs / (f.resolvedCount * 3600000)) * 10) / 10 : 0,
      resolvedWithinPeriodCount: f.resolvedComplaints + f.closedComplaints,
    }));

    // Status distribution
    const statusDistribution = [
      { name: "Open", count: statusCounts.OPEN, color: "#eab308" },
      { name: "Under Review", count: statusCounts.UNDER_REVIEW, color: "#3b82f6" },
      { name: "Action Required", count: statusCounts.ACTION_REQUIRED, color: "#f97316" },
      { name: "Resolved", count: statusCounts.RESOLVED, color: "#10b981" },
      { name: "Rejected", count: statusCounts.REJECTED, color: "#ef4444" },
      { name: "Closed", count: statusCounts.CLOSED, color: "#6b7280" },
      { name: "Escalated", count: statusCounts.ESCALATED, color: "#8b5cf6" },
    ];

    // Volume by federation chart dataset
    const volumeByFederation = federationRows.map((f) => ({
      federationId: f.federationId,
      federationName: f.federationName,
      total: f.totalComplaints,
      customer: f.customerComplaints,
      worker: f.workerComplaints,
      federation: f.federationComplaints,
    }));

    // Volume trend chart dataset (sorted chronologically)
    const volumeTrend = Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Category distribution chart dataset (sorted descending by volume)
    const categoryDistribution = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const overallAverageResolutionHours = overallResolvedCount > 0
      ? Math.round((overallDurationMs / (overallResolvedCount * 3600000)) * 10) / 10
      : 0;

    return {
      federations: federationRows,
      statusDistribution,
      volumeByFederation,
      volumeTrend,
      categoryDistribution,
      overallMetrics: {
        totalComplaints: cases.length,
        openComplaints: overallOpen,
        underReviewComplaints: overallUnderReview,
        waitingForResponseComplaints: overallWaitingResponse,
        resolvedComplaints: overallResolved,
        rejectedComplaints: overallRejected,
        closedComplaints: overallClosed,
        escalatedComplaints: overallEscalated,
        averageResolutionHours: overallAverageResolutionHours,
      },
    };
  }

  // --- Backwards Compatibility Bridge ---
  async createComplaint(payload: CreateComplaintPayload): Promise<Complaint> {
    const g = await this.createGrievance({
      raisedBy: payload.raisedBy,
      raisedByRole: payload.raisedByRole,
      category: payload.category,
      subject: payload.category,
      description: payload.description,
      bookingId: payload.bookingId,
      targetProfileId: payload.targetProfileId,
      targetRole: payload.targetRole,
      federationId: payload.federationId,
      evidenceUrls: payload.initialEvidenceUrls,
    });

    return {
      id: g.id,
      complaintNumber: g.complaintNumber,
      bookingId: g.bookingId,
      raisedBy: g.raisedBy,
      targetProfileId: g.targetProfileId,
      category: g.category,
      description: g.description,
      status: mapLifecycleToDbStatus(g.status),
      resolutionNotes: g.resolution?.actionTaken || null,
      resolvedAt: g.resolution?.resolvedAt || null,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    };
  }

  async getComplaint(complaintId: string): Promise<Complaint | null> {
    const g = await this.getGrievanceById(complaintId);
    if (!g) return null;
    return {
      id: g.id,
      complaintNumber: g.complaintNumber,
      bookingId: g.bookingId,
      raisedBy: g.raisedBy,
      targetProfileId: g.targetProfileId,
      category: g.category,
      description: g.description,
      status: mapLifecycleToDbStatus(g.status),
      resolutionNotes: g.resolution?.actionTaken || null,
      resolvedAt: g.resolution?.resolvedAt || null,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    };
  }

  async listComplaints(actorId: string, role: UserRole): Promise<Complaint[]> {
    const { cases } = await this.listGrievances({
      actorId,
      role: role as GrievancePartyRole,
    });

    return cases.map((g) => ({
      id: g.id,
      complaintNumber: g.complaintNumber,
      bookingId: g.bookingId,
      raisedBy: g.raisedBy,
      targetProfileId: g.targetProfileId,
      category: g.category,
      description: g.description,
      status: mapLifecycleToDbStatus(g.status),
      resolutionNotes: g.resolution?.actionTaken || null,
      resolvedAt: g.resolution?.resolvedAt || null,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    }));
  }

  async updateStatus(
    complaintId: string,
    status: ComplaintStatus,
    actorRole: UserRole,
    resolutionNotes?: string
  ): Promise<Complaint> {
    const lifecycleStatus: GrievanceLifecycleStatus = status === "RESOLVED" ? "RESOLVED" : status === "IN_REVIEW" ? "UNDER_REVIEW" : "OPEN";
    const g = await this.updateLifecycleStatus(
      complaintId,
      lifecycleStatus,
      "sys-actor",
      actorRole as GrievancePartyRole,
      "Administrative Officer",
      resolutionNotes
    );

    return {
      id: g.id,
      complaintNumber: g.complaintNumber,
      bookingId: g.bookingId,
      raisedBy: g.raisedBy,
      targetProfileId: g.targetProfileId,
      category: g.category,
      description: g.description,
      status: mapLifecycleToDbStatus(g.status),
      resolutionNotes: g.resolution?.actionTaken || null,
      resolvedAt: g.resolution?.resolvedAt || null,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    };
  }
}

export const complaintService = new ComplaintService();
