import { NextResponse } from "next/server";
import {
  getProjectRequirementFulfillment,
  getBatchProjectsFulfillment,
} from "@/lib/projects/fulfillment";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || searchParams.get("requirementId");

    if (projectId) {
      const fulfillment = await getProjectRequirementFulfillment(projectId);
      return NextResponse.json(
        { success: true, ...fulfillment },
        { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } }
      );
    }

    const fulfillments = await getBatchProjectsFulfillment();
    return NextResponse.json(
      { success: true, fulfillments },
      { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } }
    );
  } catch (err: unknown) {
    console.error("GET /api/projects/fulfillment error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
