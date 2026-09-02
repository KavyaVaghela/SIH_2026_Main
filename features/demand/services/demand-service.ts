import type { JobRequest, WorkerEstimate } from "@/types";

export interface IDemandService {
  submitJobRequest(customerId: string, serviceId: string, description: string, preferredSchedule?: string): Promise<JobRequest>;
  getOpenJobRequests(): Promise<JobRequest[]>;
  submitWorkerEstimate(jobRequestId: string, workerId: string, estimatedAmount: number, notes?: string): Promise<WorkerEstimate>;
}

export class DemandService implements IDemandService {
  async submitJobRequest(customerId: string, serviceId: string, description: string, preferredSchedule?: string): Promise<JobRequest> {
    return {
      id: `job-${Date.now()}`,
      customerId,
      serviceId,
      description,
      preferredSchedule,
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async getOpenJobRequests(): Promise<JobRequest[]> {
    return [
      {
        id: "job-1",
        customerId: "cust-1",
        serviceId: "srv-1",
        description: "Require complete rewiring for 2BHK flat",
        preferredSchedule: "Next Monday 10:00 AM",
        status: "open",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  async submitWorkerEstimate(jobRequestId: string, workerId: string, estimatedAmount: number, notes?: string): Promise<WorkerEstimate> {
    return {
      id: `est-${Date.now()}`,
      jobRequestId,
      workerId,
      estimatedAmount,
      notes,
      status: "submitted",
      createdAt: new Date().toISOString(),
    };
  }
}

export const demandService = new DemandService();
