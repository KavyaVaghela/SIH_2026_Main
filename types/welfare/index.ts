import type { Worker } from "../worker";
import type { Federation } from "../federation";

export interface WelfareRecord {
  id: string;
  workerId: string;
  worker?: Worker;
  federationId: string;
  federation?: Federation;
  fundType: string;
  contributionAmount: number;
  subsidyAmount: number;
  transactionDate: string;
  notes?: string | null;
  createdAt: string;
}

export interface InsuranceRecord {
  id: string;
  workerId: string;
  worker?: Worker;
  policyNumber: string;
  providerName: string;
  coverageAmount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
