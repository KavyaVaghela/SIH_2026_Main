import type { PlatformRole } from "@/config/navigation";

export type GuidanceCategory =
  | "GETTING_STARTED"
  | "SERVICES_AND_BOOKING"
  | "ESTIMATES_AND_PRICING"
  | "JOB_EXECUTION"
  | "PAYMENTS_AND_ESCROW"
  | "DISPUTES_AND_GRIEVANCES"
  | "RATINGS_AND_REVIEWS"
  | "WORKFORCE_MANAGEMENT"
  | "PLATFORM_GOVERNANCE";

export type GuidanceResultType =
  | "HOW_TO"
  | "STATUS_EXPLANATION"
  | "COMMON_QUESTION"
  | "TROUBLESHOOTING";

export interface GuidanceActionLink {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "outline";
}

export interface GuidanceArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: GuidanceCategory;
  targetRoles: PlatformRole[];
  type: GuidanceResultType;
  keywords: string[];
  steps?: {
    stepNumber: number;
    title: string;
    description: string;
    action?: GuidanceActionLink;
  }[];
  relatedAction?: GuidanceActionLink;
  badge?: string;
  lastUpdated?: string;
}

export interface StatusExplainerItem {
  statusCode: string;
  displayTitle: string;
  domain: "BOOKING" | "ESTIMATE" | "PAYMENT" | "GRIEVANCE";
  applicableRoles: PlatformRole[];
  meaning: string;
  whoActsNext: string;
  whatHappensAfter: string;
  possibleNextStatuses: string[];
  recommendedAction?: GuidanceActionLink;
}

export interface VisualJourneyStep {
  stepNumber: number;
  stageCode: string;
  title: string;
  summary: string;
  whoActs: string;
  requiredInput: string;
  outputArtifact: string;
  actionLink?: GuidanceActionLink;
}

export interface VisualJourneyMapData {
  id: string;
  journeyTitle: string;
  targetRole: PlatformRole;
  description: string;
  steps: VisualJourneyStep[];
}

export interface TroubleshootingStep {
  id: string;
  title: string;
  issueSymptoms: string;
  applicableRoles: PlatformRole[];
  probableCauses: string[];
  resolutionSteps: string[];
  recoveryAction?: GuidanceActionLink;
  relatedCategory: GuidanceCategory;
}

export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  role: PlatformRole;
  actionLabel: string;
  actionHref: string;
  estimatedMinutes?: number;
}

export interface SearchGuidanceResult {
  query: string;
  role: PlatformRole;
  totalMatches: number;
  howTo: GuidanceArticle[];
  statusExplanations: StatusExplainerItem[];
  commonQuestions: GuidanceArticle[];
  troubleshooting: TroubleshootingStep[];
}

export interface WhatHappensNextContext {
  role: PlatformRole;
  entityType: "BOOKING" | "REQUEST" | "PAYMENT" | "GRIEVANCE";
  currentStatus: string;
  entityId?: string;
  counterPartyName?: string;
  amount?: number;
  scheduledDate?: string;
  isEmergency?: boolean;
}

export interface WhatHappensNextResolution {
  currentStageLabel: string;
  whoActsNext: string;
  nextStepTitle: string;
  nextStepExplanation: string;
  actionPrompt?: string;
  actionLink?: GuidanceActionLink;
  timelineEstimate?: string;
}
