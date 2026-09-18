import { NextRequest, NextResponse } from "next/server";
import { complaintService } from "@/features/complaints/services/complaint-service";
import type {
  GrievanceLifecycleStatus,
  GrievancePartyRole,
  GrievancePriority,
  GrievanceResolution,
} from "@/types/complaints/v2";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const viewerRole = (searchParams.get("role") || undefined) as GrievancePartyRole | undefined;
    const viewerId = searchParams.get("actorId") || undefined;

    const grievance = await complaintService.getGrievanceById(id, viewerRole, viewerId);

    if (!grievance) {
      return NextResponse.json({ success: false, error: "Complaint not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      complaint: grievance,
    });
  } catch (err: unknown) {
    const errorObj = err as { message?: string; status?: number };
    return NextResponse.json(
      { success: false, error: errorObj.message || "Failed to retrieve complaint" },
      { status: errorObj.status || 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, actorId, actorRole, actorName = "Staff Officer", reason } = body;

    if (!actorId || !actorRole) {
      return NextResponse.json(
        { success: false, error: "actorId and actorRole are required for complaint modifications." },
        { status: 400 }
      );
    }

    if (actorRole === "FEDERATION_ADMIN" && body.federationId) {
      const existing = await complaintService.getGrievanceById(id);
      if (existing && existing.federationId && existing.federationId !== body.federationId) {
        return NextResponse.json(
          { success: false, error: "Access denied: You cannot modify complaints outside your federation." },
          { status: 403 }
        );
      }
    }

    let updated;

    if (action === "update_status") {
      const { newStatus } = body;
      if (!newStatus) {
        return NextResponse.json({ success: false, error: "newStatus is required" }, { status: 400 });
      }
      updated = await complaintService.updateLifecycleStatus(
        id,
        newStatus as GrievanceLifecycleStatus,
        actorId,
        actorRole as GrievancePartyRole,
        actorName,
        reason
      );
    } else if (action === "adjust_priority") {
      const { priority } = body;
      if (!priority) {
        return NextResponse.json({ success: false, error: "priority is required" }, { status: 400 });
      }
      updated = await complaintService.adjustPriority(
        id,
        priority as GrievancePriority,
        actorId,
        actorRole as GrievancePartyRole,
        actorName,
        reason || "Priority adjusted by officer."
      );
    } else if (action === "assign_officer") {
      const { officerId, officerName } = body;
      if (!officerId || !officerName) {
        return NextResponse.json({ success: false, error: "officerId and officerName are required" }, { status: 400 });
      }
      updated = await complaintService.assignOfficer(
        id,
        officerId,
        officerName,
        actorId,
        actorRole as GrievancePartyRole,
        actorName
      );
    } else if (action === "resolve") {
      const { resolution } = body;
      if (!resolution || !resolution.actionTaken) {
        return NextResponse.json({ success: false, error: "Valid resolution payload is required" }, { status: 400 });
      }
      updated = await complaintService.resolveGrievance(
        id,
        resolution as GrievanceResolution,
        actorId,
        actorRole as GrievancePartyRole,
        actorName
      );
    } else if (action === "reject") {
      const { rejectionReason, reason: bodyReason } = body;
      const reasonText = rejectionReason || bodyReason || reason;
      if (!reasonText || !reasonText.trim()) {
        return NextResponse.json({ success: false, error: "Rejection reason is required" }, { status: 400 });
      }
      updated = await complaintService.rejectGrievance(
        id,
        reasonText.trim(),
        actorId,
        actorRole as GrievancePartyRole,
        actorName
      );
    } else if (action === "close") {
      const { notes, reason: bodyReason } = body;
      updated = await complaintService.closeGrievance(
        id,
        (notes || bodyReason || reason || "").trim(),
        actorId,
        actorRole as GrievancePartyRole,
        actorName
      );
    } else if (action === "request_response") {
      const { targetParty = "WORKER", message } = body;
      if (!message || !message.trim()) {
        return NextResponse.json({ success: false, error: "Response request message is required" }, { status: 400 });
      }
      updated = await complaintService.requestPartyResponse(
        id,
        targetParty as GrievancePartyRole,
        message.trim(),
        actorId,
        actorRole as GrievancePartyRole,
        actorName
      );
    } else {
      return NextResponse.json({ success: false, error: `Unsupported patch action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Complaint updated successfully.",
      complaint: updated,
    });
  } catch (err: unknown) {
    const errorObj = err as { message?: string; status?: number };
    return NextResponse.json(
      { success: false, error: errorObj.message || "Failed to update complaint" },
      { status: errorObj.status || 500 }
    );
  }
}
