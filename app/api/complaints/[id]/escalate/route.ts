import { NextRequest, NextResponse } from "next/server";
import { complaintService } from "@/features/complaints/services/complaint-service";
import type { GrievancePartyRole } from "@/types/complaints/v2";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { reason, actorId, actorRole, actorName = "Federation Admin" } = body;

    if (!reason || !actorId || !actorRole) {
      return NextResponse.json(
        { success: false, error: "reason, actorId, and actorRole are required for escalation." },
        { status: 400 }
      );
    }

    const updated = await complaintService.escalateToSuperAdmin(
      id,
      reason,
      actorId,
      actorRole as GrievancePartyRole,
      actorName
    );

    return NextResponse.json({
      success: true,
      message: "Case successfully escalated to Super Admin.",
      complaint: updated,
    });
  } catch (err: unknown) {
    const errorObj = err as { message?: string; status?: number };
    return NextResponse.json(
      { success: false, error: errorObj.message || "Failed to escalate complaint" },
      { status: errorObj.status || 500 }
    );
  }
}
