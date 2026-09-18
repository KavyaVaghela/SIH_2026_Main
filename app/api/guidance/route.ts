import { NextRequest, NextResponse } from "next/server";
import { guidanceService } from "@/features/guidance/services/guidance-service";
import type { PlatformRole } from "@/config/navigation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roleParam = (searchParams.get("role") || "CUSTOMER").toUpperCase() as PlatformRole;
    const query = searchParams.get("q") || "";
    const statusCode = searchParams.get("status");

    // Validate role
    const validRoles: PlatformRole[] = [
      "CUSTOMER",
      "WORKER",
      "FEDERATION_ADMIN",
      "SUPER_ADMIN",
    ];

    if (!validRoles.includes(roleParam)) {
      return NextResponse.json(
        { success: false, error: "Invalid platform role specified" },
        { status: 400 }
      );
    }

    // Specific Status Explainer query
    if (statusCode) {
      const explainer = guidanceService.getStatusExplanation(statusCode, roleParam);
      if (!explainer) {
        return NextResponse.json(
          {
            success: false,
            error: `Status code '${statusCode}' not found or not applicable for role '${roleParam}'`,
          },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, explainer });
    }

    // General Search or Articles
    const results = guidanceService.searchGuidance(roleParam, query);
    const onboarding = guidanceService.getOnboardingTasks(roleParam);
    const tooltips = guidanceService.getTooltips();

    return NextResponse.json({
      success: true,
      role: roleParam,
      query,
      results,
      onboarding,
      tooltips,
    });
  } catch (err: unknown) {
    console.error("Guidance API error:", err);
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
