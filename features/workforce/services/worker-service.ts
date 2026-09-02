import type { Worker, WorkerAvailability } from "@/types";

export interface IWorkerService {
  getWorkerById(workerId: string): Promise<Worker | null>;
  searchEligibleWorkers(filter: { skillId?: string; latitude?: number; longitude?: number; radiusKm?: number }): Promise<Worker[]>;
  updateAvailability(workerId: string, status: WorkerAvailability): Promise<boolean>;
  verifyWorker(workerId: string): Promise<boolean>;
}

export class WorkerService implements IWorkerService {
  async getWorkerById(workerId: string): Promise<Worker | null> {
    return {
      id: workerId,
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
  }

  async searchEligibleWorkers(): Promise<Worker[]> {
    return [
      {
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
      },
    ];
  }

  async updateAvailability(workerId: string, status: WorkerAvailability): Promise<boolean> {
    console.log(`Updated worker ${workerId} availability to ${status}`);
    return true;
  }

  async verifyWorker(workerId: string): Promise<boolean> {
    console.log(`Verified worker ${workerId}`);
    return true;
  }
}

export const workerService = new WorkerService();
