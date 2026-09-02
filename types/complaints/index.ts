import type { Profile } from "../auth";

export type ComplaintStatus = "OPEN" | "IN_REVIEW" | "RESOLVED";

export interface Complaint {
  id: string;
  complaintNumber: string;
  bookingId?: string | null;
  raisedBy: string;
  raisedByProfile?: Profile;
  targetProfileId?: string | null;
  targetProfile?: Profile;
  category: string;
  description: string;
  status: ComplaintStatus;
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
