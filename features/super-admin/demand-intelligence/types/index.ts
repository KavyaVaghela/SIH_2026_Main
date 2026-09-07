export type LocationStatusCategory =
  | "HIGH_DEMAND"
  | "WORKER_SHORTAGE"
  | "BALANCED"
  | "WORKFORCE_SURPLUS";

export interface DemandOverviewStats {
  serviceRequests: number;
  availableWorkers: number;
  activeWorkers: number;
  shortageOrSurplus: number; // positive = surplus, negative = shortage
  balanceStatus: "SHORTAGE" | "BALANCED" | "SURPLUS";
  topServiceCategory: string;
  fulfillmentCapacityRate: number; // 0-100%
}

export interface DemandedServiceItem {
  serviceId: string;
  serviceTitle: string;
  category: string;
  requestsCount: number;
  availableWorkersCount: number;
  status: "SHORTAGE" | "BALANCED" | "SURPLUS";
  deficitOrSurplus: number;
}

export interface GeographicDemandCluster {
  id: string;
  locationName: string;
  district: string;
  coordinates: { lat: number; lng: number };
  status: LocationStatusCategory;
  requestsCount: number;
  availableWorkersCount: number;
  primarySkillNeeded: string;
  societyName: string;
  societyId: string;
  demandScore: number;
}

export interface ShortageAlert {
  id: string;
  location: string;
  serviceTitle: string;
  serviceId: string;
  currentDemand: number;
  availableWorkers: number;
  shortageAmount: number;
  activeWorkers: number;
  societyName: string;
  societyId: string;
  severity: "CRITICAL" | "MODERATE" | "LOW";
  recommendedAction: string;
}

export interface CandidateSupportWorker {
  id: string;
  name: string;
  profession: string;
  currentSociety: string;
  currentLocation: string;
  distanceKm: number;
  experienceYears: number;
  rating: number;
}

export interface WorkforceAllocationRecommendation {
  id: string;
  alertId: string;
  title: string;
  targetLocation: string;
  service: string;
  shortageCount: number;
  sourceSociety: string;
  sourceLocation: string;
  suggestedHeadcount: number;
  rationale: string;
  estimatedSlaImprovement: string;
  candidateWorkers: CandidateSupportWorker[];
}

export type DemandDateRange = "today" | "7d" | "30d" | "90d";

export interface DemandFilterOptions {
  location: string;
  society: string;
  service: string;
  dateRange: DemandDateRange;
}
