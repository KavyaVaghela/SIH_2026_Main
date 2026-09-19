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
    const {
      type,
      message,
      targetParty,
      evidenceUrls,
      actorId,
      actorRole,
      actorName = "Participant",
    } = body;

    if (!actorId || !actorRole || !message) {
      return NextResponse.json(
        { success: false, error: "actorId, actorRole, and message are required." },
        { status: 400 }
      );
    }

    let updated;

    if (type === "PUBLIC_UPDATE" || type === "INTERNAL_NOTE") {
      updated = await complaintService.addTimelineUpdate(
        id,
        type,
        message,
        actorId,
        actorRole as GrievancePartyRole,
        actorName,
        evidenceUrls
      );
    } else if (type === "RESPONSE_REQUEST") {
      if (!targetParty) {
        return NextResponse.json(
          { success: false, error: "targetParty is required for response request." },
          { status: 400 }
        );
      }
      updated = await complaintService.requestPartyResponse(
        id,
        targetParty as GrievancePartyRole,
        message,
        actorId,
        actorRole as GrievancePartyRole,
        actorName
      );
    } else if (type === "RESPONSE_SUBMISSION") {
      updated = await complaintService.submitPartyResponse(
        id,
        message,
        evidenceUrls || [],
        actorId,
        actorRole as GrievancePartyRole,
        actorName
      );
    } else {
      return NextResponse.json(
        { success: false, error: `Unsupported update type: ${type}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Timeline event recorded successfully.",
      complaint: updated,
    });
  } catch (err: unknown) {
    const errorObj = err as { message?: string; status?: number; statusCode?: number };
    return NextResponse.json(
      { success: false, error: errorObj.message || "Failed to post timeline update" },
      { status: errorObj.statusCode || errorObj.status || 500 }
    );
  }
}
