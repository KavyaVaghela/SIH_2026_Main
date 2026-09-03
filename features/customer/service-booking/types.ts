import { ServiceCategory, ServiceItem } from "@/features/services/services/service-catalog-service";
import { PlatformEstimateResult } from "@/features/pricing/services/pricing-service";

export interface AddressItem {
  id: string;
  title: "Home" | "Office" | "Rental" | "Other" | string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault?: boolean;
}

export interface ServiceBookingDraft {
  category: ServiceCategory | null;
  service: ServiceItem | null;
  description: string;
  photoUrl?: string | null;
  photoFile?: File | null;
  estimate: PlatformEstimateResult | null;
  address: AddressItem | null;
  preferredDate: string; // YYYY-MM-DD
  preferredTimeSlot: string; // Morning, Afternoon, Evening
  selectedWorkerId?: string | null;
}

export type BookingFlowStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const BOOKING_FLOW_STEPS = [
  { step: 1, label: "Category", description: "Select trade" },
  { step: 2, label: "Work", description: "Specific service" },
  { step: 3, label: "Details", description: "Problem description" },
  { step: 4, label: "Estimate", description: "Platform estimate" },
  { step: 5, label: "Address", description: "Service location" },
  { step: 6, label: "Schedule", description: "Preferred time" },
  { step: 7, label: "Review", description: "Confirm & proceed" },
] as const;

const DRAFT_STORAGE_KEY = "kaushalyasetu_booking_draft";

export function saveBookingDraft(draft: ServiceBookingDraft): void {
  if (typeof window === "undefined") return;
  try {
    const payload = { ...draft, photoFile: undefined };
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error("Failed to save booking draft to sessionStorage", err);
  }
}

export function loadBookingDraft(): ServiceBookingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const item = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!item) return null;
    return JSON.parse(item) as ServiceBookingDraft;
  } catch (err) {
    console.error("Failed to load booking draft from sessionStorage", err);
    return null;
  }
}
