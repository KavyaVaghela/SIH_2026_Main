import type { Profile } from "../auth";
import type { Federation } from "../federation";
import type { Skill } from "../services";
import type { Worker } from "../worker";

export interface ProjectRequest {
  id: string;
  customerId: string;
  customer?: Profile;
  federationId: string;
  federation?: Federation;
  projectName: string;
  description: string;
  totalBudget?: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRequirement {
  id: string;
  projectRequestId: string;
  skillId: string;
  skill?: Skill;
  requiredWorkersCount: number;
  estimatedDurationDays?: number | null;
  createdAt: string;
}

export interface ProjectAllocation {
  id: string;
  projectRequestId: string;
  requirementId: string;
  workerId: string;
  worker?: Worker;
  allocatedAt: string;
  status: string;
  createdAt: string;
}
