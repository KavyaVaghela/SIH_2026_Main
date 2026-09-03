export type SocietyStatus = "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED";

export interface SocietyListItem {
  id: string;
  name: string;
  code: string;
  registrationNumber: string;
  city: string;
  state: string;
  location: string; // "City, State"
  contactEmail: string;
  contactPhone: string;
  adminName: string;
  serviceRegion?: string | null;
  totalWorkers: number;
  activeJobs: number;
  totalBookings: number;
  completedBookings: number;
  averageRating: number;
  status: SocietyStatus;
  isActive: boolean;
  registrationDate: string;
}

export interface SocietyDetails extends SocietyListItem {
  address: string;
  officialDocuments?: Array<{ title: string; url: string; verified: boolean }> | null;
  cancellationRate: number;
  complaintCount: number;
  utilizationRate: number;
  completionRate: number;
}

export interface SocietyWorkerItem {
  id: string;
  profileId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  profession?: string | null;
  experienceYears: number;
  hourlyRate: number;
  accountStatus: "ACTIVE" | "DEACTIVATED";
  availabilityStatus: "AVAILABLE" | "BUSY" | "UNAVAILABLE";
  verificationStatus: "pending_verification" | "verified" | "suspended";
  joiningDate: string;
  avatarUrl?: string | null;
}

export interface SocietyBookingItem {
  id: string;
  bookingNumber: string;
  customerName: string;
  workerName?: string | null;
  serviceTitle: string;
  scheduledStartAt: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface SocietyPerformanceMetrics {
  bookingCompletionRate: number; // percentage (0-100)
  workerUtilizationRate: number; // percentage (0-100)
  customerSatisfaction: number; // score (0-5)
  cancellationRate: number; // percentage (0-100)
  complaintCount: number;
  overallPerformanceScore: number; // score (0-100)
}

export interface AddSocietyFormPayload {
  name: string;
  code: string;
  registrationNumber: string;
  city: string;
  state: string;
  address: string;
  adminName: string;
  contactEmail: string;
  contactPhone: string;
  serviceRegion?: string;
  status: SocietyStatus;
}

export interface SocietyFilterOptions {
  searchQuery: string;
  location: string;
  status: string;
  sortBy: "name" | "registrationDate" | "totalWorkers" | "totalBookings" | "averageRating";
  sortOrder: "asc" | "desc";
  page: number;
  pageSize: number;
}
