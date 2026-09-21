import { NextRequest, NextResponse } from "next/server";
import { generateEmergencyId } from "@/lib/emergency/emergency-id";
import {
  EmergencyIncidentRepository,
  EmergencyIncidentRecord,
} from "@/lib/emergency/incident-store";
import { EmergencyResponseMatrixRepository } from "@/lib/emergency/response-matrix-store";
import { EmergencyDispatchRepository } from "@/lib/emergency/dispatch-store";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  EmergencyIncidentStatus,
  EmergencyIncidentSeverity,
} from "@/supabase/types/database.types";

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate caller strictly via Supabase session
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: An active authenticated session is required to access emergency incidents." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const incidentId = searchParams.get("id") || searchParams.get("incidentId");
    const emergencyId = searchParams.get("emergencyId");

    // Direct single lookup by ID or Emergency ID
    if (incidentId || emergencyId) {
      const targetId = incidentId || emergencyId;
      const incident = await EmergencyIncidentRepository.findById(targetId!);
      if (!incident) {
        return NextResponse.json({ error: "Emergency incident not found" }, { status: 404 });
      }

      // Customer isolation check: Customers can only inspect their own incident
      if (authUser.role === "CUSTOMER" && incident.customer_id !== authUser.id) {
        return NextResponse.json(
          { error: "Forbidden: Customer is not authorized to view this emergency incident." },
          { status: 403 }
        );
      }

      const matrix = await EmergencyIncidentRepository.getIncidentResponseMatrix(incident.id);
      return NextResponse.json({
        success: true,
        incident: mapIncidentResponse(incident),
        responseMatrix: matrix,
      });
    }

    // List query: Scoped strictly to authenticated customer if customer
    let targetCustomerId: string | undefined = undefined;
    if (authUser.role === "CUSTOMER") {
      targetCustomerId = authUser.id;
    } else {
      targetCustomerId = searchParams.get("customerId") || undefined;
    }

    const incidents = await EmergencyIncidentRepository.listIncidents({
      customerId: targetCustomerId,
    });

    return NextResponse.json({
      success: true,
      incidents: incidents.map(mapIncidentResponse),
      count: incidents.length,
    });
  } catch (err: unknown) {
    console.error("GET /api/emergency/incidents error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate customer strictly from session
    // DO NOT allow customer_id, profile ID, or any equivalent identity field from the client request body to establish ownership
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: An active authenticated customer session is required to report an emergency incident." },
        { status: 401 }
      );
    }

    // Customer identity comes from the authenticated Supabase session only
    const customerId = authUser.id;

    const body = await request.json();

    // Explicitly delete any client-supplied identity fields from request payload
    delete (body as Record<string, unknown>).customerId;
    delete (body as Record<string, unknown>).customer_id;
    delete (body as Record<string, unknown>).profileId;
    delete (body as Record<string, unknown>).profile_id;
    delete (body as Record<string, unknown>).id;
    delete (body as Record<string, unknown>).emergency_id;
    delete (body as Record<string, unknown>).emergencyId;
    delete (body as Record<string, unknown>).status;

    // Resolve federation if registered for this customer or determined from location
    let federationId: string | null = null;
    try {
      const admin = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: addr } = await (admin.from("addresses") as any)
        .select("city")
        .eq("profile_id", customerId)
        .order("is_default", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (addr?.city) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: fed } = await (admin.from("federations") as any)
          .select("id")
          .ilike("city", `%${addr.city}%`)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();
        if (fed?.id) {
          federationId = fed.id;
        }
      }

      if (!federationId && body.location) {
        const loc = String(body.location).toLowerCase();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: feds } = await (admin.from("federations") as any)
          .select("id, city, name")
          .eq("is_active", true);
        if (feds && feds.length > 0) {
          const matched = feds.find(
            (f: { city?: string | null; name?: string | null; id: string }) =>
              (f.city && loc.includes(f.city.toLowerCase())) ||
              (f.name && loc.includes(f.name.toLowerCase()))
          );
          if (matched) {
            federationId = matched.id;
          }
        }
      }

      if (!federationId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: defaultFed } = await (admin.from("federations") as any)
          .select("id")
          .eq("code", "FED-AMD-01")
          .maybeSingle();
        federationId = defaultFed?.id || "b765df3b-c418-4a15-b79f-3cbc09e475dc";
      }
    } catch {
      federationId = "b765df3b-c418-4a15-b79f-3cbc09e475dc";
    }

    // 2. Validate Selected Emergency Type (Deterministic Predefined Matrix)
    const rawEmergencyType = String(body.emergencyType || "").trim();
    if (!rawEmergencyType) {
      return NextResponse.json(
        { error: "Emergency type is required." },
        { status: 400 }
      );
    }

    // Deterministic lookup against the Emergency Response Matrix
    const matrixEntry = await EmergencyResponseMatrixRepository.findByEmergencyType(rawEmergencyType);
    if (!matrixEntry) {
      return NextResponse.json(
        {
          error: `Invalid or unrecognized emergency type: "${rawEmergencyType}". Must match predefined Emergency Response Matrix.`,
        },
        { status: 400 }
      );
    }

    const categoryName = body.categoryName || matrixEntry.category_name || "General Emergency";
    const canonicalTypeName = matrixEntry.emergency_type;
    const matrixCode = matrixEntry.matrix_code;

    // 3. Validate Location and Description
    const location = String(body.location || "").trim();
    if (!location || location.length < 5) {
      return NextResponse.json(
        { error: "A clear service location or address is required (minimum 5 characters)." },
        { status: 400 }
      );
    }

    const description = String(body.description || "").trim();
    if (!description || description.length < 5) {
      return NextResponse.json(
        { error: "A clear description of the emergency is required (minimum 5 characters)." },
        { status: 400 }
      );
    }

    // 4. Parse Evidence Photos
    let evidencePhotos: string[] = [];
    if (Array.isArray(body.evidencePhotos)) {
      evidencePhotos = body.evidencePhotos.filter(
        (p: unknown): p is string => typeof p === "string" && p.trim().length > 0
      );
    } else if (typeof body.evidencePhotos === "string" && body.evidencePhotos.trim()) {
      evidencePhotos = [body.evidencePhotos.trim()];
    } else if (body.photoUrl && typeof body.photoUrl === "string") {
      evidencePhotos = [body.photoUrl.trim()];
    }

    // 5. Parse Affected Population & Immediate Danger Info
    const approxPeopleAffected = Math.max(1, parseInt(body.approxPeopleAffected, 10) || 1);
    const immediateDanger = Boolean(body.immediateDanger);
    const dangerDetails = body.dangerDetails ? String(body.dangerDetails).trim() : null;

    // 5.1 Duplicate Submission Protection (prevent accidental rapid resubmission)
    try {
      const recentIncidents = await EmergencyIncidentRepository.listIncidents({ customerId });
      const nowMs = Date.now();
      const duplicate = recentIncidents.find((inc) => {
        const createdMs = new Date(inc.created_at).getTime();
        const diffMs = Math.abs(nowMs - createdMs);
        const isSameType = inc.emergency_type.toLowerCase() === canonicalTypeName.toLowerCase();
        const isSameLocation = inc.location.trim().toLowerCase() === location.toLowerCase();
        const isPending = inc.status === "AWAITING_RESPONSE" || inc.status === "DISPATCHING";
        return isSameType && isSameLocation && isPending && diffMs < 120000; // 2-minute debounce window
      });

      if (duplicate) {
        return NextResponse.json(
          {
            error: "Duplicate submission detected: an identical emergency was reported moments ago.",
            incident: mapIncidentResponse(duplicate),
            isDuplicate: true,
          },
          { status: 409 }
        );
      }
    } catch {
      // Continue if duplicate check encounters error
    }

    // 6. Server-Side Authoritative Emergency ID Generation
    const emergencyId = generateEmergencyId();
    const internalId = crypto.randomUUID();

    // 7. Initial Status is strictly AWAITING_RESPONSE
    const status: EmergencyIncidentStatus = "AWAITING_RESPONSE";
    const severity: EmergencyIncidentSeverity =
      (body.severity as EmergencyIncidentSeverity) || matrixEntry.severity || "HIGH";

    const now = new Date().toISOString();

    const incidentRecord: EmergencyIncidentRecord = {
      id: internalId,
      emergency_id: emergencyId,
      customer_id: customerId, // Established strictly from authenticated session
      federation_id: federationId,
      category_name: categoryName,
      emergency_type: canonicalTypeName,
      response_matrix_code: matrixCode,
      severity,
      status,
      location,
      address_details: typeof body.addressDetails === "object" && body.addressDetails !== null ? body.addressDetails : {},
      description,
      evidence_photos: evidencePhotos,
      approx_people_affected: approxPeopleAffected,
      immediate_danger: immediateDanger,
      danger_details: dangerDetails,
      metadata: {
        createdVia: "CUSTOMER_PORTAL_EMERGENCY_FLOW",
        sourceUserAgent: request.headers.get("user-agent") || "unknown",
      },
      created_at: now,
      updated_at: now,
    };

    // 8. Persist Emergency Incident (CRITICAL: DOES NOT CREATE ANY NORMAL BOOKING)
    const saved = await EmergencyIncidentRepository.insertIncident(incidentRecord);

    // 9. Automated Deterministic Dispatch Pool Generation (Task 3 Handoff)
    // Always initialize initial dispatch pool, while preserving AWAITING_RESPONSE lifecycle state
    // unless autoDispatch was explicitly requested (e.g. in Task 3 automated test).
    let dispatchResult = null;
    let targetIncident = saved;

    try {
      const preserveStatus = body.autoDispatch !== true;
      dispatchResult = await EmergencyDispatchRepository.generateDispatchPool(saved.id, {
        preserveStatus,
      });
      targetIncident = (await EmergencyIncidentRepository.findById(saved.id)) || saved;
    } catch (dispatchErr) {
      console.warn("Automated dispatch notice:", dispatchErr);
    }

    return NextResponse.json(
      {
        success: true,
        incident: mapIncidentResponse(targetIncident),
        responseMatrix: matrixEntry,
        dispatchPool: dispatchResult ? dispatchResult.dispatches : [],
        dispatchSummary: dispatchResult
          ? {
              requiredCount: dispatchResult.requiredCount,
              dispatchedCount: dispatchResult.dispatchedCount,
              isStaffingShortage: dispatchResult.isStaffingShortage,
              shortageCount: dispatchResult.shortageCount,
            }
          : null,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("POST /api/emergency/incidents error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

function mapIncidentResponse(r: EmergencyIncidentRecord) {
  return {
    id: r.id,
    emergencyId: r.emergency_id,
    customerId: r.customer_id,
    federationId: r.federation_id,
    categoryName: r.category_name,
    emergencyType: r.emergency_type,
    responseMatrixCode: r.response_matrix_code || null,
    severity: r.severity,
    status: r.status,
    location: r.location,
    addressDetails: r.address_details,
    description: r.description,
    evidencePhotos: r.evidence_photos,
    photoUrl: r.evidence_photos && r.evidence_photos.length > 0 ? r.evidence_photos[0] : null,
    approxPeopleAffected: r.approx_people_affected,
    immediateDanger: r.immediate_danger,
    dangerDetails: r.danger_details,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
