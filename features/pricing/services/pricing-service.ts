export interface CalculatePlatformEstimatePayload {
  serviceBasePrice: number;
  minimumVisitCharge: number;
  estimatedHours?: number;
}

export interface PlatformEstimateResult {
  basePrice: number;
  minimumVisitCharge: number;
  platformFee: number;
  taxAmount: number;
  estimatedTotal: number;
}

export interface CalculateFinalBillPayload {
  platformEstimate: number;
  workerEstimate?: number;
  minimumVisitCharge: number;
  materialCharges?: number;
  additionalLaborCharges?: number;
  discountAmount?: number;
}

export interface FinalBillResult {
  subtotal: number;
  platformFee: number;
  taxAmount: number;
  discountAmount: number;
  finalTotal: number;
}

export interface IPricingService {
  calculatePlatformEstimate(payload: CalculatePlatformEstimatePayload): PlatformEstimateResult;
  calculateFinalBill(payload: CalculateFinalBillPayload): FinalBillResult;
}

export class PricingService implements IPricingService {
  calculatePlatformEstimate(payload: CalculatePlatformEstimatePayload): PlatformEstimateResult {
    const hours = payload.estimatedHours && payload.estimatedHours > 0 ? payload.estimatedHours : 1;
    const rawCost = payload.serviceBasePrice * hours;

    // Enforce minimum service visit charge
    const effectiveBase = Math.max(rawCost, payload.minimumVisitCharge);
    const platformFee = Math.round(effectiveBase * 0.05 * 100) / 100; // 5% platform fee
    const taxAmount = Math.round(effectiveBase * 0.18 * 100) / 100;   // 18% GST
    const estimatedTotal = effectiveBase + platformFee + taxAmount;

    return {
      basePrice: effectiveBase,
      minimumVisitCharge: payload.minimumVisitCharge,
      platformFee,
      taxAmount,
      estimatedTotal,
    };
  }

  calculateFinalBill(payload: CalculateFinalBillPayload): FinalBillResult {
    const baseAmount = payload.workerEstimate ?? payload.platformEstimate;
    const materials = payload.materialCharges || 0;
    const additionalLabor = payload.additionalLaborCharges || 0;
    const discount = payload.discountAmount || 0;

    const rawSubtotal = baseAmount + materials + additionalLabor;
    const subtotal = Math.max(rawSubtotal, payload.minimumVisitCharge);

    const platformFee = Math.round(subtotal * 0.05 * 100) / 100;
    const taxAmount = Math.round(subtotal * 0.18 * 100) / 100;
    const finalTotal = Math.max(0, subtotal + platformFee + taxAmount - discount);

    return {
      subtotal,
      platformFee,
      taxAmount,
      discountAmount: discount,
      finalTotal,
    };
  }
}

export const pricingService = new PricingService();
