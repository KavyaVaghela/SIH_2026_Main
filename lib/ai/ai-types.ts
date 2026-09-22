export type ForecastLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type ForecastConfidence = "LOW" | "MEDIUM" | "HIGH";

export interface DemandForecastContext {
  trade: string;
  region: string;
  demand_last_7_days: number;
  demand_previous_7_days: number;
  demand_last_30_days: number;
  available_workers: number;
  underutilized_workers: number;
  shortage: number;
  large_project_demand?: number;
  emergency_workload?: number;
}

export interface AiDemandForecastResponse {
  forecast_level: ForecastLevel;
  outlook: string;
  factors: string[];
  recommended_actions: string[];
  confidence: ForecastConfidence;
  disclaimer: string;
  is_fallback?: boolean;
  generated_at?: string;
}

export interface AiAdvisoryApiResponse {
  context: DemandForecastContext;
  forecast: AiDemandForecastResponse;
}

export interface FederationDemandGapItem {
  trade: string;
  demand: number;
  available_qualified_workers: number;
  demand_gap: number; // unmet booking requests (demand - available_qualified_workers)
}

export interface FederationDemandContext {
  federation_id: string;
  federation_name: string;
  region: string;
  demand: {
    current_period: number;
    previous_period: number;
    trend: "INCREASING" | "STABLE" | "DECREASING";
  };
  workforce: {
    total_active: number;
    available: number;
    busy: number;
    underutilized: number;
  };
  demand_gaps: FederationDemandGapItem[];
  project_workload: number;
  emergency_workload: number;
}

export interface FederationAiIntelligenceResponse {
  outlook_level: ForecastLevel;
  outlook: string;
  key_factors: string[];
  workforce_insight: string;
  recommended_actions: string[];
  confidence: ForecastConfidence;
  disclaimer: string;
  is_fallback?: boolean;
  generated_at?: string;
}

export interface FederationAiApiResponse {
  context: FederationDemandContext;
  intelligence: FederationAiIntelligenceResponse;
}

export type WorkerAiLanguage = "en" | "hi" | "gu";

export interface WorkerLearningSuggestion {
  title: string;
  reason: string;
  course_id?: string;
  category?: string;
}

export interface WorkerRegionalTradeDemand {
  region: string;
  trade: string;
  recent_requests_count: number;
  demand_level: "LOW" | "STEADY" | "HIGH" | "ELEVATED";
}

export interface WorkerAiPriority {
  type: "WORK_OPPORTUNITY" | "PERFORMANCE" | "AVAILABILITY" | "PROFILE" | "SKILL" | "SAFETY" | "EARNINGS";
  title: string;
  message: string;
  action?: string;
}

export interface WorkerAiContext {
  worker_id?: string;
  worker_name: string;
  worker_trade: string;
  trade: string;
  skills: string[];
  certified?: boolean;
  certifications: string[];
  availability: "AVAILABLE" | "BUSY" | "UNAVAILABLE";
  availability_status: string;
  experience_level?: string;
  verification_status?: string;
  recent_completed_jobs: number;
  completed_bookings_count: number;
  total_bookings: number;
  bookings_last_30_days: number;
  rating: number;
  reviews_count?: number;
  is_new_worker?: boolean;
  utilization_level: "LOW" | "MODERATE" | "HIGH";
  regional_trade_demand: "LOW" | "MODERATE" | "HIGH" | "ELEVATED";
  regional_trade_demand_info?: WorkerRegionalTradeDemand;
  recommended_course?: WorkerLearningSuggestion;
  allowed_courses?: WorkerLearningSuggestion[];
  relevant_training_title: string | null;
  relevant_training_category: string | null;
  has_sufficient_activity: boolean;
}

export interface WorkerAiAdviceResponse {
  greeting: string;
  summary: string;
  priorities?: WorkerAiPriority[];
  tips: string[];
  learning_suggestion?: WorkerLearningSuggestion | string | null;
  important_note: string | null;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  disclaimer: string;
  is_fallback?: boolean;
  generated_at?: string;
}

export interface WorkerAiApiResponse {
  context: WorkerAiContext;
  advice: WorkerAiAdviceResponse | null;
}


