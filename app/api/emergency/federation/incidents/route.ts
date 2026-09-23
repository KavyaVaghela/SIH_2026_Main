import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";
import { EmergencyControlCenterRepository } from "@/lib/emergency/control-center-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const federationId =
      authUser.role === "SUPER_ADMIN" && searchParams.get("federationId")
        ? searchParams.get("federationId")!
        : authUser.federationId;

    if (!federationId) {
      return NextResponse.json(
        { error: "No federation association identified for current administrator." },
        { status: 400 }
      );
    }

    const status = searchParams.get("status") || undefined;
    const severity = searchParams.get("severity") || undefined;
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const hasShortageParam = searchParams.get("hasShortage");
    const hasShortage = hasShortageParam !== null ? hasShortageParam === "true" : undefined;
    const includeArchivedParam = searchParams.get("includeArchived");
    const includeArchived = includeArchivedParam !== null ? includeArchivedParam === "true" : undefined;

    const incidents = await EmergencyControlCenterRepository.listIncidentsForFederation(
      federationId,
      {
        status,
        severity,
        category,
        search,
        hasShortage,
        includeArchived,
      }
    );

    return NextResponse.json({
      success: true,
      federationId,
      incidents,
      total: incidents.length,
    });
  } catch (err: unknown) {
    console.error("GET /api/emergency/federation/incidents error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
