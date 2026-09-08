import type { ComplaintStatus, UserRole } from "../../../supabase/types/database.types";
import { AppError } from "../../../lib/errors";

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
  category: string;
  description: string;
  bookingId?: string;
  targetProfileId?: string;
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

export class ComplaintService implements IComplaintService {
  private mockComplaints: Map<string, Complaint> = new Map();

  async createComplaint(payload: CreateComplaintPayload): Promise<Complaint> {
    const complaintId = `cmp-${Date.now()}`;
    const complaintNumber = `CMP-${Date.now().toString().slice(-6)}`;

    let dbComplaint: Complaint | null = null;
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("complaints") as any)
        .insert({
          complaint_number: complaintNumber,
          booking_id: payload.bookingId && !payload.bookingId.startsWith("bk-") ? payload.bookingId : null,
          raised_by: payload.raisedBy,
          target_profile_id: payload.targetProfileId && !payload.targetProfileId.startsWith("p-") ? payload.targetProfileId : null,
          category: payload.category,
          description: payload.description,
          status: "OPEN",
        })
        .select()
        .single();

      if (!error && data) {
        dbComplaint = {
          id: data.id,
          complaintNumber: data.complaint_number,
          bookingId: data.booking_id,
          raisedBy: data.raised_by,
          targetProfileId: data.target_profile_id,
          category: data.category,
          description: data.description,
          status: data.status,
          resolutionNotes: data.resolution_notes,
          resolvedAt: data.resolved_at,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (err) {
      console.warn("DB createComplaint insert notice:", err);
    }

    const complaint: Complaint = dbComplaint || {
      id: complaintId,
      complaintNumber,
      bookingId: payload.bookingId,
      raisedBy: payload.raisedBy,
      targetProfileId: payload.targetProfileId,
      category: payload.category,
      description: payload.description,
      status: "OPEN",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.mockComplaints.set(complaint.id, complaint);
    return complaint;
  }

  async getComplaint(complaintId: string): Promise<Complaint | null> {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("complaints") as any)
        .select("*")
        .eq("id", complaintId)
        .maybeSingle();

      if (!error && data) {
        const mapped: Complaint = {
          id: data.id,
          complaintNumber: data.complaint_number,
          bookingId: data.booking_id,
          raisedBy: data.raised_by,
          targetProfileId: data.target_profile_id,
          category: data.category,
          description: data.description,
          status: data.status,
          resolutionNotes: data.resolution_notes,
          resolvedAt: data.resolved_at,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        this.mockComplaints.set(complaintId, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn("DB getComplaint query notice:", err);
    }
    return this.mockComplaints.get(complaintId) || null;
  }

  async listComplaints(actorId: string, role: UserRole): Promise<Complaint[]> {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query = (supabase.from("complaints") as any).select("*").order("created_at", { ascending: false });

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dbComplaints: Complaint[] = data.map((c: any) => ({
          id: c.id,
          complaintNumber: c.complaint_number,
          bookingId: c.booking_id,
          raisedBy: c.raised_by,
          targetProfileId: c.target_profile_id,
          category: c.category,
          description: c.description,
          status: c.status,
          resolutionNotes: c.resolution_notes,
          resolvedAt: c.resolved_at,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }));
        dbComplaints.forEach((c) => this.mockComplaints.set(c.id, c));
        if (role === "SUPER_ADMIN") return dbComplaints;
        return dbComplaints.filter((c) => c.raisedBy === actorId || c.targetProfileId === actorId);
      }
    } catch (err) {
      console.warn("DB listComplaints query notice:", err);
    }
    const all = Array.from(this.mockComplaints.values());
    if (role === "SUPER_ADMIN") return all;
    return all.filter((c) => c.raisedBy === actorId || c.targetProfileId === actorId);
  }

  async updateStatus(
    complaintId: string,
    status: ComplaintStatus,
    actorRole: UserRole,
    resolutionNotes?: string
  ): Promise<Complaint> {
    if (actorRole !== "FEDERATION_ADMIN" && actorRole !== "SUPER_ADMIN") {
      throw new AppError("Only Federation Admin or Super Admin can resolve complaints", "FORBIDDEN", 403);
    }

    const complaint = await this.getComplaint(complaintId);
    if (!complaint) {
      throw new AppError(`Complaint ${complaintId} not found`, "NOT_FOUND", 404);
    }

    const resolvedAt = status === "RESOLVED" ? new Date().toISOString() : complaint.resolvedAt;
    const updated: Complaint = {
      ...complaint,
      status,
      resolutionNotes,
      resolvedAt,
      updatedAt: new Date().toISOString(),
    };

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("complaints") as any)
        .update({
          status,
          resolution_notes: resolutionNotes || null,
          ...(status === "RESOLVED" ? { resolved_at: resolvedAt } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", complaintId);
    } catch (err) {
      console.warn("DB updateStatus complaint notice:", err);
    }

    this.mockComplaints.set(complaintId, updated);
    return updated;
  }
}

export const complaintService = new ComplaintService();
