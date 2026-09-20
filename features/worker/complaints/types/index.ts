export type WorkerComplaintSubsection = "MY_COMPLAINTS" | "COMPLAINTS_FROM_CUSTOMERS";

export interface WorkerJobOption {
  id: string;
  bookingNumber: string;
  serviceTitle: string;
  customerName: string;
  customerPhone?: string;
  scheduledDate: string;
  federationId?: string;
  federationName?: string;
  totalAmount?: number;
  status: string;
}

export type WorkerResponseState =
  | "NOT_REQUESTED"
  | "WAITING_FOR_WORKER"
  | "RESPONSE_SUBMITTED"
  | "CLOSED";
