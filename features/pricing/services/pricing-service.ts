import { SERVICE_CONFIG } from "@/config/services";
import type {
  PlatformEstimate,
  WorkerEstimatePayload,
  FinalBill,
  MinimumServiceVisitCharge,
} from "@/types";

export interface IPricingService {
  calculatePlatformEstimate(basePrice: number): PlatformEstimate;
  calculateWorkerEstimate(payload: WorkerEstimatePayload): WorkerEstimatePayload;
  calculateFinalBill(params: {
    serviceCharges: number;
    partsCharges?: number;
    discountAmount?: number;
  }): FinalBill;
  applyMinimumVisitCharge(amount: number): MinimumServiceVisitCharge;
}

export class PricingService implements IPricingService {
  calculatePlatformEstimate(basePrice: number): PlatformEstimate {
    const minCharge = SERVICE_CONFIG.minimumVisitChargeINR;
    const effectiveBase = Math.max(basePrice, minCharge);
    const platformFee = (effectiveBase * SERVICE_CONFIG.platformFeePercentage) / 100;
    const taxAmount = (platformFee * SERVICE_CONFIG.taxGstPercentage) / 100;
    const estimatedTotal = effectiveBase + platformFee + taxAmount;

    return {
      serviceId: "srv-estimate",
      basePrice: effectiveBase,
      platformFee,
      taxAmount,
      estimatedTotal,
      currency: "INR",
    };
  }

  calculateWorkerEstimate(payload: WorkerEstimatePayload): WorkerEstimatePayload {
    return {
      ...payload,
      estimatedAmount: Math.max(payload.estimatedAmount, SERVICE_CONFIG.minimumVisitChargeINR),
    };
  }

  calculateFinalBill(params: {
    serviceCharges: number;
    partsCharges?: number;
    discountAmount?: number;
  }): FinalBill {
    const { serviceCharges, partsCharges = 0, discountAmount = 0 } = params;
    const effectiveService = Math.max(serviceCharges, SERVICE_CONFIG.minimumVisitChargeINR);
    const platformFee = (effectiveService * SERVICE_CONFIG.platformFeePercentage) / 100;
    const taxes = ((effectiveService + platformFee) * SERVICE_CONFIG.taxGstPercentage) / 100;
    const netPayableAmount = effectiveService + partsCharges + platformFee + taxes - discountAmount;

    return {
      bookingId: "bk-bill",
      serviceCharges: effectiveService,
      partsOrMaterialsCharges: partsCharges,
      platformFee,
      taxes,
      discountOrSubsidy: discountAmount,
      netPayableAmount,
      currency: "INR",
    };
  }

  applyMinimumVisitCharge(amount: number): MinimumServiceVisitCharge {
    const minimumVisitFeeINR = SERVICE_CONFIG.minimumVisitChargeINR;
    const isApplied = amount < minimumVisitFeeINR;

    return {
      minimumVisitFeeINR,
      isApplied,
      description: isApplied
        ? `Applied minimum visit charge threshold of ₹${minimumVisitFeeINR}`
        : "Standard pricing applies",
    };
  }
}

export const pricingService = new PricingService();
