import type { Complaint, ComplaintStatus } from "@/types";

export interface IComplaintService {
  submitComplaint(raisedBy: string, category: string, description: string, bookingId?: string, targetId?: string): Promise<Complaint>;
  getComplaints(status?: ComplaintStatus): Promise<Complaint[]>;
  resolveComplaint(complaintId: string, resolutionNotes: string): Promise<Complaint>;
}

export class ComplaintService implements IComplaintService {
  async submitComplaint(raisedBy: string, category: string, description: string, bookingId?: string, targetId?: string): Promise<Complaint> {
    return {
      id: `cmp-${Date.now()}`,
      complaintNumber: `CMP-${Date.now().toString().slice(-6)}`,
      bookingId,
      raisedBy,
      targetProfileId: targetId,
      category,
      description,
      status: "OPEN",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async getComplaints(): Promise<Complaint[]> {
    return [];
  }

  async resolveComplaint(complaintId: string, resolutionNotes: string): Promise<Complaint> {
    return {
      id: complaintId,
      complaintNumber: "CMP-90123",
      raisedBy: "cust-1",
      category: "Billing Query",
      description: "Disputed pricing line item",
      status: "RESOLVED",
      resolutionNotes,
      resolvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export const complaintService = new ComplaintService();
