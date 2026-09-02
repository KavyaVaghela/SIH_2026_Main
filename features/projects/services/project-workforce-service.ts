import type { ProjectRequest, ProjectAllocation } from "@/types";

export interface IProjectWorkforceService {
  createProjectRequest(customerId: string, federationId: string, projectName: string, description: string, budget?: number): Promise<ProjectRequest>;
  allocateWorkerToProject(projectRequestId: string, requirementId: string, workerId: string): Promise<ProjectAllocation>;
  getProjectDetails(projectId: string): Promise<ProjectRequest | null>;
}

export class ProjectWorkforceService implements IProjectWorkforceService {
  async createProjectRequest(customerId: string, federationId: string, projectName: string, description: string, budget?: number): Promise<ProjectRequest> {
    return {
      id: `proj-${Date.now()}`,
      customerId,
      federationId,
      projectName,
      description,
      totalBudget: budget,
      status: "pending_review",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async allocateWorkerToProject(projectRequestId: string, requirementId: string, workerId: string): Promise<ProjectAllocation> {
    return {
      id: `alloc-${Date.now()}`,
      projectRequestId,
      requirementId,
      workerId,
      allocatedAt: new Date().toISOString(),
      status: "allocated",
      createdAt: new Date().toISOString(),
    };
  }

  async getProjectDetails(projectId: string): Promise<ProjectRequest | null> {
    return {
      id: projectId,
      customerId: "cust-1",
      federationId: "fed-1",
      projectName: "Community Hall Electrical Renovation",
      description: "Bulk wiring and fixture installation for cooperative hall",
      totalBudget: 150000,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export const projectWorkforceService = new ProjectWorkforceService();
