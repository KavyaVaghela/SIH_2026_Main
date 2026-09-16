import { NextRequest, NextResponse } from "next/server";
import { complaintService } from "@/features/complaints/services/complaint-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const federationId = searchParams.get("federationId") || "b765df3b-c418-4a15-b79f-3cbc09e475dc";

    const analytics = await complaintService.getFederationAnalytics(federationId);

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
