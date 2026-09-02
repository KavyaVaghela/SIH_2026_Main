import type { Worker } from "../../../types";

export interface MatchingFilter {
  serviceId: string;
  skillId?: string;
  customerLatitude: number;
  customerLongitude: number;
  scheduledStartAt: string;
  scheduledEndAt: string;
  maxRadiusKm?: number;
}

export interface WorkerMatchResult {
  worker: Worker;
  matchScore: number; // 0 - 100
  tierBreakdown: {
    skillMatch: boolean;
    availabilityMatch: boolean;
    distanceKm: number;
    rating: number;
    experienceYears: number;
    currentWorkloadCount: number;
  };
}

export interface IMatchingService {
  findEligibleWorkers(filter: MatchingFilter): Promise<WorkerMatchResult[]>;
}

export class MatchingService implements IMatchingService {
  // Calculate Haversine distance in km
  private calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in KM
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  async findEligibleWorkers(filter: MatchingFilter): Promise<WorkerMatchResult[]> {
    // Sample candidate pool
    const candidates: Array<Worker & { rating: number; workload: number }> = [
      {
        id: "w-1",
        profileId: "p-w1",
        federationId: "fed-1",
        status: "ACTIVE",
        availability: "AVAILABLE",
        hourlyRate: 350,
        experienceYears: 5,
        currentLatitude: 18.5204,
        currentLongitude: 73.8567,
        rating: 4.8,
        workload: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "w-2",
        profileId: "p-w2",
        federationId: "fed-1",
        status: "ACTIVE",
        availability: "AVAILABLE",
        hourlyRate: 400,
        experienceYears: 7,
        currentLatitude: 18.5304,
        currentLongitude: 73.8467,
        rating: 4.9,
        workload: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "w-3",
        profileId: "p-w3",
        federationId: "fed-2",
        status: "DEACTIVATED", // Excluded (account deactivated)
        availability: "AVAILABLE",
        hourlyRate: 300,
        experienceYears: 2,
        currentLatitude: 18.5104,
        currentLongitude: 73.8667,
        rating: 4.2,
        workload: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "w-4",
        profileId: "p-w4",
        federationId: "fed-1",
        status: "ACTIVE",
        availability: "BUSY", // Excluded (busy)
        hourlyRate: 380,
        experienceYears: 4,
        currentLatitude: 18.5254,
        currentLongitude: 73.8527,
        rating: 4.7,
        workload: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const maxRadius = filter.maxRadiusKm || 15;

    // 1. Mandatory Eligibility Filter: Verified + ACTIVE account + AVAILABLE + Within Radius
    const eligible = candidates.filter((w) => {
      if (w.status !== "ACTIVE") return false;
      if (w.availability !== "AVAILABLE") return false;

      const dist = this.calculateDistanceKm(
        filter.customerLatitude,
        filter.customerLongitude,
        w.currentLatitude || 0,
        w.currentLongitude || 0
      );

      return dist <= maxRadius;
    });

    // 2. 6-Tier Ranking Algorithm
    const results: WorkerMatchResult[] = eligible.map((worker) => {
      const distanceKm = this.calculateDistanceKm(
        filter.customerLatitude,
        filter.customerLongitude,
        worker.currentLatitude || 0,
        worker.currentLongitude || 0
      );

      // Score components:
      // Tier 1: Skill Match (40 pts)
      const skillScore = 40;
      // Tier 2: Availability Match (20 pts)
      const availScore = 20;
      // Tier 3: Distance Score (max 15 pts, decaying with distance)
      const distScore = Math.max(0, 15 - distanceKm);
      // Tier 4: Rating Score (max 15 pts)
      const ratingScore = (worker.rating / 5) * 15;
      // Tier 5: Experience Score (max 5 pts)
      const expScore = Math.min(5, worker.experienceYears * 0.7);
      // Tier 6: Workload Distribution (max 5 pts, higher for lower workload)
      const workloadScore = Math.max(0, 5 - worker.workload);

      const totalScore = Math.round(
        skillScore + availScore + distScore + ratingScore + expScore + workloadScore
      );

      return {
        worker,
        matchScore: totalScore,
        tierBreakdown: {
          skillMatch: true,
          availabilityMatch: true,
          distanceKm,
          rating: worker.rating,
          experienceYears: worker.experienceYears,
          currentWorkloadCount: worker.workload,
        },
      };
    });

    // Sort descending by matchScore
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }
}

export const matchingService = new MatchingService();
