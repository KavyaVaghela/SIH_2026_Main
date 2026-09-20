export type SchemeCategory = 
  | "ALL"
  | "Worker Protection"
  | "Health & Welfare"
  | "Training"
  | "Housing"
  | "Financial Support"
  | "Social Security";

export interface WelfareScheme {
  id: string;
  name: string;
  category: SchemeCategory;
  description: string;
  eligibility: string;
  requiredDocuments: string[];
  howToProceed: string[];
  informationSource: string;
  isExample: boolean;
}

export type WelfareRequestStatus = "Under Review" | "Information Provided" | "In Progress" | "Completed";

export interface WelfareRequestItem {
  id: string;
  referenceId: string;
  requestType: string;
  date: string;
  status: WelfareRequestStatus;
  description: string;
  timelineStep?: string;
  nextStep?: string;
}

export interface TrainingOpportunity {
  id: string;
  title: string;
  category: string;
  duration: string;
  mode: "Online" | "Hybrid" | "In-Person";
  description: string;
  provider: string;
  skillsAcquired: string[];
  enrolledStatus?: boolean;
}

export interface WelfareCertificationItem {
  id: string;
  title: string;
  issuingAuthority: string;
  status: "Active" | "Renewal Due" | "Pending Review";
  issueDate: string;
  expiryDate?: string;
  renewalNotice?: string;
}

export interface SafetyGuidelineItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  keyInstructions: string[];
}

export interface InsuranceProgramItem {
  id: string;
  title: string;
  coverageAmount: string;
  status: "Active" | "Eligible";
  description: string;
  benefits: string[];
}

export interface FinancialAssistanceProgram {
  id: string;
  title: string;
  maxAmount: string;
  interestRate: string;
  description: string;
  eligibility: string;
}
