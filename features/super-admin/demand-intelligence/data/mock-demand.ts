import type {
  DemandedServiceItem,
  GeographicDemandCluster,
  ShortageAlert,
  WorkforceAllocationRecommendation,
} from "../types";

// Clean reference types - all demand data is computed from live Supabase records
export const MOCK_DEMANDED_SERVICES: DemandedServiceItem[] = [];
export const MOCK_GEOGRAPHIC_CLUSTERS: GeographicDemandCluster[] = [];
export const MOCK_SHORTAGE_ALERTS: ShortageAlert[] = [];
export const MOCK_RECOMMENDATIONS: WorkforceAllocationRecommendation[] = [];
