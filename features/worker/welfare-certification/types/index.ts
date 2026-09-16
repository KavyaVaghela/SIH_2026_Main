export interface WorkerCertificationRecord {
  id: string;
  certificationId: string;
  title: string;
  issuingBody: string;
  certificateNumber: string | null;
  issueDate: string;
  expiryDate: string | null;
  status: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED";
  daysRemaining: number | null;
  isVerified: boolean;
  skillTrade: string;
}

export interface WorkerSkillRecord {
  id: string;
  skillId: string;
  name: string;
  description?: string;
  proficiencyLevel: "novice" | "intermediate" | "advanced" | "expert";
  proficiencyPercent: number;
}

export interface TrainingRecommendation {
  id: string;
  title: string;
  recommendationType: "Skill Development" | "Certification Renewal" | "New Certification";
  reason: string;
  basedOn: string;
  suggestedAction: string;
  guidanceHref: string;
  badge: "Recommended";
}

export interface DevelopmentJourneyStage {
  stepNumber: number;
  title: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
  completedDetail?: string;
}

export interface WelfareBenefitResource {
  id: string;
  category: "HEALTH" | "EMERGENCY" | "TRAINING" | "FINANCIAL" | "SAFETY" | "COOPERATIVE";
  title: string;
  description: string;
  coverageNote: string;
  statusLabel: string;
  statusType: "active" | "info" | "available";
  guidanceHref: string;
}

export interface WorkerSafetySupport {
  federationName: string;
  contactPhone: string | null;
  contactEmail: string | null;
  officeAddress: string | null;
  emergencyGuidelines: string[];
  grievanceHref: string;
  safetyGuidanceHref: string;
}

export interface WorkerWelfareDashboardData {
  workerId: string;
  profileId: string;
  workerName: string;
  profession: string;
  experienceYears: number;
  skillLevelTitle: string;
  earningsThisMonth: number;
  completedJobsCount: number;
  activeCertificationsCount: number;
  expiringCertificationsCount: number;
  expiredCertificationsCount: number;
  certifications: WorkerCertificationRecord[];
  skills: WorkerSkillRecord[];
  recommendations: TrainingRecommendation[];
  journeyStages: DevelopmentJourneyStage[];
  welfareBenefits: WelfareBenefitResource[];
  safetySupport: WorkerSafetySupport;
}

export interface FederationWelfareMetrics {
  federationId: string;
  federationName: string;
  totalActiveWorkers: number;
  totalExpiringCertifications: number;
  totalExpiredCertifications: number;
  workersNeedingAttention: number;
  trainingCandidatesCount: number;
  incompleteProfilesCount: number;
  skillDistribution: Array<{ profession: string; count: number }>;
  attentionList: Array<{
    workerId: string;
    workerName: string;
    profession: string;
    phone: string | null;
    certName: string;
    expiryDate: string;
    daysRemaining: number;
    issue: "EXPIRING_SOON" | "EXPIRED";
  }>;
  developmentNeedsList: Array<{
    workerId: string;
    workerName: string;
    profession: string;
    experienceYears: number;
    skillsCount: number;
    certificationsCount: number;
    suggestedDevelopment: string;
  }>;
}
