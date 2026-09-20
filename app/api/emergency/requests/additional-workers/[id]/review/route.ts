import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";
import { EmergencyControlCenterRepository } from "@/lib/emergency/control-center-store";

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

    const { id: requestId } = await context.params;
    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, reason } = body;

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json(
        { error: "action must be either APPROVE or REJECT." },
        { status: 400 }
      );
    }

    if (action === "REJECT" && (!reason || reason.trim().length < 3)) {
      return NextResponse.json(
        { error: "A clear rejection reason is required when rejecting support requests." },
        { status: 400 }
      );
    }

    const isSuperAdmin = authUser.role === "SUPER_ADMIN";
    const federationId = authUser.federationId || "";

    const result = await EmergencyControlCenterRepository.reviewAdditionalWorkerRequest({
      requestId,
      federationId,
      actorId: authUser.id,
      action,
      reason,
      isSuperAdmin,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.code }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Additional worker request ${action.toLowerCase()}ed successfully.`,
      request: result.request,
    });
  } catch (err: unknown) {
    console.error("POST /api/emergency/requests/additional-workers/[id]/review error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
