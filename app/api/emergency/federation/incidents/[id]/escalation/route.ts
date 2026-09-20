import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";
import { EmergencyIncidentRepository } from "@/lib/emergency/incident-store";
import {
  EmergencyScalingRepository,
  EscalationStage,
} from "@/lib/emergency/scaling-store";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: Active authenticated session required." },
        { status: 401 }
      );
    }

    if (authUser.role !== "FEDERATION_ADMIN" && authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Access restricted to Federation Administrators." },
        { status: 403 }
      );
    }

    const { id: incidentId } = await context.params;
    if (!incidentId) {
      return NextResponse.json({ error: "Incident ID is required." }, { status: 400 });
    }

    const incident = await EmergencyIncidentRepository.findById(incidentId);
    if (!incident) {
      return NextResponse.json({ error: "Emergency incident not found." }, { status: 404 });
    }

    if (authUser.role !== "SUPER_ADMIN" && incident.federation_id !== authUser.federationId) {
      return NextResponse.json(
        { error: "Forbidden: Incident belongs to another federation." },
        { status: 403 }
      );
    }

    const evaluation = await EmergencyScalingRepository.evaluateShortageAndEscalation(incidentId);

    return NextResponse.json({
      success: true,
      evaluation,
    });
  } catch (err: unknown) {
    console.error("GET /api/emergency/federation/incidents/[id]/escalation error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: Active authenticated session required." },
        { status: 401 }
      );
    }

    if (authUser.role !== "FEDERATION_ADMIN" && authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Access restricted to Federation Administrators." },
        { status: 403 }
      );
    }

    const { id: incidentId } = await context.params;
    if (!incidentId) {
      return NextResponse.json({ error: "Incident ID is required." }, { status: 400 });
    }

    const incident = await EmergencyIncidentRepository.findById(incidentId);
    if (!incident) {
      return NextResponse.json({ error: "Emergency incident not found." }, { status: 404 });
    }

    if (authUser.role !== "SUPER_ADMIN" && incident.federation_id !== authUser.federationId) {
      return NextResponse.json(
        { error: "Forbidden: Incident belongs to another federation." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action = "SET_STAGE", targetStage, reason, radiusMultiplier, maxRadiusKm } = body;

    if (action === "SET_STAGE") {
      if (!targetStage) {
        return NextResponse.json({ error: "targetStage is required." }, { status: 400 });
      }

      const res = await EmergencyScalingRepository.setEscalationStage({
        incidentId,
        targetStage: targetStage as EscalationStage,
        reason: reason || `Escalation stage updated to ${targetStage}`,
        actorId: authUser.id,
        federationId: incident.federation_id || authUser.federationId || "",
      });

      return NextResponse.json(res);
    }

    if (action === "EXPAND_RADIUS") {
      const res = await EmergencyScalingRepository.expandEmergencyRadius({
        incidentId,
        expansionMultiplier: Number(radiusMultiplier) || 1.5,
        maxRadiusKm: Number(maxRadiusKm) || 50,
        reason: reason || "Emergency radius expansion authorized due to staffing shortage",
        actorId: authUser.id,
        federationId: incident.federation_id || authUser.federationId || "",
      });

      return NextResponse.json(res);
    }

    if (action === "EXPIRE_OFFERS") {
      const cutoffMinutes = Number(body.cutoffMinutes) || 5;
      const res = await EmergencyScalingRepository.expireUnresponsiveOffers({
        incidentId,
        cutoffMinutes,
        actorId: authUser.id,
      });

      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "Unsupported escalation action." }, { status: 400 });
  } catch (err: unknown) {
    console.error("POST /api/emergency/federation/incidents/[id]/escalation error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
