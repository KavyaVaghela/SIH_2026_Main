import { NextRequest, NextResponse } from "next/server";
import { complaintService } from "@/features/complaints/services/complaint-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");
    const role = searchParams.get("role");
    const federationId = searchParams.get("federationId");

    if (scope === "platform" || role === "SUPER_ADMIN" || (!federationId && searchParams.has("overview"))) {
      const status = searchParams.get("status") || undefined;
      const priority = searchParams.get("priority") || undefined;
      const category = searchParams.get("category") || undefined;
      const dateFrom = searchParams.get("dateFrom") || undefined;
      const dateTo = searchParams.get("dateTo") || undefined;

      const overview = await complaintService.getSuperAdminComplaintOverview({
        federationId: federationId || undefined,
        status,
        priority,
        category,
        dateFrom,
        dateTo,
      });

      return NextResponse.json({
        success: true,
        overview,
      });
    }

    const fedId = federationId || "b765df3b-c418-4a15-b79f-3cbc09e475dc";
    const analytics = await complaintService.getFederationAnalytics(fedId);

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
