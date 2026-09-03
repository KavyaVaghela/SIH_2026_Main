import type { Federation } from "../../../types";

export interface FederationPerformanceSummary {
  federationId: string;
  totalWorkersCount: number;
  activeWorkersCount: number;
  monthlyBookingsCount: number;
  grossRevenueINR: number;
  averageRating: number;
}

export interface IFederationService {
  getFederationById(federationId: string): Promise<Federation | null>;
  getAllFederations(): Promise<Federation[]>;
  getPerformanceSummary(federationId: string): Promise<FederationPerformanceSummary>;
}

export class FederationService implements IFederationService {
  private mockFederations: Map<string, Federation> = new Map();

  constructor() {
    const fed1: Federation = {
      id: "fed-1",
      name: "Pune Household Workers Service Cooperative",
      code: "FED-PUNE-01",
      gstNumber: "27AAACP1234A1Z1",
      registrationNumber: "REG/MH/PUNE/2024/001",
      state: "Maharashtra",
      city: "Pune",
      address: "102 Cooperative Bhawan, Shivajinagar, Pune",
      contactEmail: "contact@puneworkers.coop",
      contactPhone: "+919822000001",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.mockFederations.set(fed1.id, fed1);
  }

  async getFederationById(federationId: string): Promise<Federation | null> {
    return this.mockFederations.get(federationId) || null;
  }

  async getAllFederations(): Promise<Federation[]> {
    return Array.from(this.mockFederations.values());
  }

  async getPerformanceSummary(federationId: string): Promise<FederationPerformanceSummary> {
    return {
      federationId,
      totalWorkersCount: 150,
      activeWorkersCount: 135,
      monthlyBookingsCount: 840,
      grossRevenueINR: 420000,
      averageRating: 4.7,
    };
  }
}

export const federationService = new FederationService();
