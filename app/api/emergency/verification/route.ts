import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";
import { EmergencyVerificationRepository } from "@/lib/emergency/verification-store";
import { EmergencyIncidentRepository } from "@/lib/emergency/incident-store";
import { EmergencyTeamRepository } from "@/lib/emergency/team-store";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: Active authenticated session required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const incidentId = searchParams.get("incidentId");
    if (!incidentId) {
      return NextResponse.json(
        { error: "incidentId query parameter is required." },
        { status: 400 }
      );
    }

    const incident = await EmergencyIncidentRepository.findById(incidentId);
    if (!incident) {
      return NextResponse.json(
        { error: "Emergency incident not found." },
        { status: 404 }
      );
    }

    // Authorization checks
    if (authUser.role === "CUSTOMER" && incident.customer_id !== authUser.id) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to view verification for this incident." },
        { status: 403 }
      );
    } else if (authUser.role === "WORKER") {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: workerRec } = await (supabase.from("workers") as any)
        .select("id")
        .eq("profile_id", authUser.id)
        .maybeSingle();

      const team = await EmergencyTeamRepository.getTeamByIncidentId(incident.id);
      const isMember = (team?.members || []).some((m) => m.worker_id === workerRec?.id);
      if (!isMember) {
        return NextResponse.json(
          { error: "Forbidden: Only assigned team members may inspect emergency verification." },
          { status: 403 }
        );
      }
    } else if (authUser.role === "FEDERATION_ADMIN" && incident.federation_id) {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: fedProfile } = await (supabase.from("profiles") as any)
        .select("federation_id")
        .eq("id", authUser.id)
        .maybeSingle();

      if (fedProfile?.federation_id && fedProfile.federation_id !== incident.federation_id) {
        return NextResponse.json(
          { error: "Forbidden: Federation Admin cannot view verification outside their federation." },
          { status: 403 }
        );
      }
    }

    let verification = await EmergencyVerificationRepository.getVerificationByIncidentId(incident.id);
    if (!verification) {
      verification = await EmergencyVerificationRepository.generateVerification(incident.id);
    }

    return NextResponse.json({
      success: true,
      verification: {
        id: verification.id,
        incidentId: verification.incident_id,
        verificationCode: verification.verification_code,
        verificationToken: verification.verification_token,
        status: verification.status,
        verifiedAt: verification.verified_at,
        expiresAt: verification.expires_at,
        isVerified: verification.status === "VERIFIED",
      },
    });
  } catch (err: unknown) {
    console.error("GET /api/emergency/verification error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: Active authenticated session required." },
        { status: 401 }
      );
    }

    if (authUser.role !== "WORKER" && authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only authorized field responders can verify emergency arrival." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { incidentId, tokenOrCode } = body;

    if (!incidentId || !tokenOrCode) {
      return NextResponse.json(
        { error: "incidentId and tokenOrCode are required." },
        { status: 400 }
      );
    }

    // Resolve worker ID
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: workerRec } = await (supabase.from("workers") as any)
      .select("id")
      .eq("profile_id", authUser.id)
      .maybeSingle();

    if (!workerRec && authUser.role === "WORKER") {
      return NextResponse.json(
        { error: "Worker profile not found." },
        { status: 404 }
      );
    }

    const workerId = workerRec?.id || authUser.id;

    const result = await EmergencyVerificationRepository.verifyEmergency(
      incidentId,
      tokenOrCode,
      workerId
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Emergency arrival verified successfully. Field response initiated.",
      verification: result.verification,
    });
  } catch (err: unknown) {
    console.error("POST /api/emergency/verification error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
