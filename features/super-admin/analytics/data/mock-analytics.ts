import type {
  BookingGrowthPoint,
  ServiceDemandMetric,
  WorkforceUtilizationMetric,
  SocietyPerformanceMetric,
  PlatformGrowthPoint,
  AnalyticsTimeframe,
} from "../types";

export const MOCK_BOOKING_GROWTH_BY_TIMEFRAME: Record<
  Exclude<AnalyticsTimeframe, "custom">,
  BookingGrowthPoint[]
> = {
  today: [],
  week: [],
  month: [],
  year: [],
};

export const MOCK_SERVICE_DEMAND: ServiceDemandMetric[] = [];

export const MOCK_WORKFORCE_UTILIZATION: WorkforceUtilizationMetric = {
  availableCount: 0,
  activeCount: 0,
  underutilizedCount: 0,
  totalWorkers: 0,
  overallUtilizationRate: 0,
  skillDistribution: [],
};

export const MOCK_SOCIETY_PERFORMANCE: SocietyPerformanceMetric[] = [];

export const MOCK_PLATFORM_GROWTH: PlatformGrowthPoint[] = [];
