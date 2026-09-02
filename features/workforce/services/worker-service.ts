import type { Worker } from "../../../types";
import type { WorkerAvailabilityStatus, WorkerAccountStatus, WorkerVerificationStatus } from "../../../supabase/types/database.types";
import { AppError } from "../../../lib/errors";

export interface WorkerPerformanceSummary {
  workerId: string;
  completedJobsCount: number;
  averageRating: number;
  totalEarnings: number;
  onTimeArrivalRate: number;
}

export interface IWorkerService {
  getWorkerById(workerId: string): Promise<Worker | null>;
  searchEligibleWorkers(filter: { skillId?: string; latitude?: number; longitude?: number; radiusKm?: number }): Promise<Worker[]>;
  updateAvailability(workerId: string, status: WorkerAvailabilityStatus): Promise<boolean>;
  updateProtectedStatus(
    workerId: string,
    accountStatus?: WorkerAccountStatus,
    verificationStatus?: WorkerVerificationStatus,
    isSuperAdmin?: boolean
  ): Promise<boolean>;
  getPerformanceSummary(workerId: string): Promise<WorkerPerformanceSummary>;
}

export class WorkerService implements IWorkerService {
  private workerMap: Map<string, Worker> = new Map();

  constructor() {
    const defaultWorker: Worker = {
      id: "w-1",
      profileId: "p-worker-1",
      federationId: "fed-1",
      status: "ACTIVE",
      availability: "AVAILABLE",
      hourlyRate: 350,
      experienceYears: 5,
      currentLatitude: 18.5204,
      currentLongitude: 73.8567,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.workerMap.set(defaultWorker.id, defaultWorker);
  }

  async getWorkerById(workerId: string): Promise<Worker | null> {
    return this.workerMap.get(workerId) || null;
  }

  async searchEligibleWorkers(): Promise<Worker[]> {
    return Array.from(this.workerMap.values()).filter(
      (w) => w.status === "ACTIVE" && w.availability === "AVAILABLE"
    );
  }

  async updateAvailability(workerId: string, status: WorkerAvailabilityStatus): Promise<boolean> {
    const worker = await this.getWorkerById(workerId);
    if (worker) {
      worker.availability = status;
      worker.updatedAt = new Date().toISOString();
      this.workerMap.set(workerId, worker);
    }
    return true;
  }

  async updateProtectedStatus(
    workerId: string,
    accountStatus?: WorkerAccountStatus,
    verificationStatus?: WorkerVerificationStatus,
    isSuperAdmin?: boolean
  ): Promise<boolean> {
    if (!isSuperAdmin) {
      throw new AppError("Only Federation Admin or Super Admin can update worker verification or account status", "FORBIDDEN", 403);
    }

    const worker = await this.getWorkerById(workerId);
    if (worker) {
      if (accountStatus) worker.status = accountStatus;
      worker.updatedAt = new Date().toISOString();
      this.workerMap.set(workerId, worker);
    }
    return true;
  }

  async getPerformanceSummary(workerId: string): Promise<WorkerPerformanceSummary> {
    return {
      workerId,
      completedJobsCount: 42,
      averageRating: 4.8,
      totalEarnings: 14700,
      onTimeArrivalRate: 98,
    };
  }
}

export const workerService = new WorkerService();
