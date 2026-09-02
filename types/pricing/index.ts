export interface PlatformEstimate {
  serviceId: string;
  basePrice: number;
  platformFee: number;
  taxAmount: number;
  estimatedTotal: number;
  currency: "INR";
}

export interface WorkerEstimatePayload {
  jobRequestId: string;
  workerId: string;
  estimatedAmount: number;
  estimatedHours?: number;
  notes?: string;
}

export interface FinalBill {
  bookingId: string;
  serviceCharges: number;
  partsOrMaterialsCharges: number;
  platformFee: number;
  taxes: number;
  discountOrSubsidy: number;
  netPayableAmount: number;
  currency: "INR";
}

export interface MinimumServiceVisitCharge {
  minimumVisitFeeINR: number;
  isApplied: boolean;
  description: string;
}
