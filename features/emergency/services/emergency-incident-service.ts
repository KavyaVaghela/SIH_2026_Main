import type {
  EmergencyIncidentStatus,
  EmergencyIncidentSeverity,
} from "@/supabase/types/database.types";

export interface EmergencyIncident {
  id: string;
  emergencyId: string;
  customerId: string;
  federationId?: string | null;
  categoryName: string;
  emergencyType: string;
  severity: EmergencyIncidentSeverity;
  status: EmergencyIncidentStatus;
  location: string;
  addressDetails?: Record<string, unknown>;
  description: string;
  evidencePhotos: string[];
  photoUrl?: string | null;
  approxPeopleAffected: number;
  immediateDanger: boolean;
  dangerDetails?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmergencyIncidentInput {
  categoryName: string;
  emergencyType: string;
  location: string;
  description: string;
  evidencePhotos?: string[];
  photoUrl?: string;
  approxPeopleAffected?: number;
  immediateDanger?: boolean;
  dangerDetails?: string;
  severity?: EmergencyIncidentSeverity;
}

export class EmergencyIncidentService {
  /**
   * Reports an emergency incident through dedicated /api/emergency/incidents endpoint.
   * STRICTLY DOES NOT CREATE A NORMAL BOOKING.
   */
  async reportEmergency(input: CreateEmergencyIncidentInput): Promise<EmergencyIncident> {
    const res = await fetch("/api/emergency/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to report emergency incident");
    }

    return json.incident;
  }

  /**
   * Fetches an emergency incident by ID or Emergency ID
   */
  async getIncident(idOrEmergencyId: string): Promise<EmergencyIncident> {
    const res = await fetch(`/api/emergency/incidents/${idOrEmergencyId}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Emergency incident not found");
    }

    return json.incident;
  }

  /**
   * Lists emergency incidents for the current authenticated customer
   */
  async listMyIncidents(): Promise<EmergencyIncident[]> {
    const res = await fetch("/api/emergency/incidents");
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to list emergency incidents");
    }

    return json.incidents || [];
  }
}

export const emergencyIncidentService = new EmergencyIncidentService();
