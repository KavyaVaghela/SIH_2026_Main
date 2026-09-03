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

    const complaint: Complaint = {
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

    this.mockComplaints.set(complaintId, complaint);
    return complaint;
  }

  async getComplaint(complaintId: string): Promise<Complaint | null> {
    return this.mockComplaints.get(complaintId) || null;
  }

  async listComplaints(actorId: string, role: UserRole): Promise<Complaint[]> {
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

    const updated: Complaint = {
      ...complaint,
      status,
      resolutionNotes,
      resolvedAt: status === "RESOLVED" ? new Date().toISOString() : complaint.resolvedAt,
      updatedAt: new Date().toISOString(),
    };

    this.mockComplaints.set(complaintId, updated);
    return updated;
  }
}

export const complaintService = new ComplaintService();
