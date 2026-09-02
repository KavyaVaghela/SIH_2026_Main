export interface ProjectRequest {
  id: string;
  customerId: string;
  federationId: string;
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
  requiredWorkersCount: number;
  estimatedDurationDays?: number | null;
  createdAt: string;
}

export interface ProjectAllocation {
  id: string;
  projectRequestId: string;
  requirementId: string;
  workerId: string;
  allocatedAt: string;
  status: string;
  createdAt: string;
}

export interface CreateProjectRequestPayload {
  customerId: string;
  federationId: string;
  projectName: string;
  description: string;
  totalBudget?: number;
  requirements: Array<{ skillId: string; requiredWorkersCount: number; estimatedDurationDays?: number }>;
}

export interface IProjectWorkforceService {
  createProjectRequest(payload: CreateProjectRequestPayload): Promise<ProjectRequest>;
  getProjectRequest(projectId: string): Promise<ProjectRequest | null>;
  allocateWorkerToProject(projectRequestId: string, requirementId: string, workerId: string): Promise<ProjectAllocation>;
}

export class ProjectWorkforceService implements IProjectWorkforceService {
  private projectsMap: Map<string, ProjectRequest> = new Map();
  private allocationsMap: Map<string, ProjectAllocation> = new Map();

  async createProjectRequest(payload: CreateProjectRequestPayload): Promise<ProjectRequest> {
    const projectId = `proj-${Date.now()}`;
    const project: ProjectRequest = {
      id: projectId,
      customerId: payload.customerId,
      federationId: payload.federationId,
      projectName: payload.projectName,
      description: payload.description,
      totalBudget: payload.totalBudget || 0,
      status: "submitted",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.projectsMap.set(projectId, project);
    return project;
  }

  async getProjectRequest(projectId: string): Promise<ProjectRequest | null> {
    return this.projectsMap.get(projectId) || null;
  }

  async allocateWorkerToProject(projectRequestId: string, requirementId: string, workerId: string): Promise<ProjectAllocation> {
    const allocId = `alloc-${Date.now()}`;
    const allocation: ProjectAllocation = {
      id: allocId,
      projectRequestId,
      requirementId,
      workerId,
      allocatedAt: new Date().toISOString(),
      status: "assigned",
      createdAt: new Date().toISOString(),
    };

    this.allocationsMap.set(allocId, allocation);
    return allocation;
  }
}

export const projectWorkforceService = new ProjectWorkforceService();
