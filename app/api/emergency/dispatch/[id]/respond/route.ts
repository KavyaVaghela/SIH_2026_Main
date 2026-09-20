import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";
import { EmergencyTeamRepository } from "@/lib/emergency/team-store";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: Active authenticated session required." },
        { status: 401 }
      );
    }

    // Customers and unauthenticated users cannot respond to worker dispatch offers
    if (authUser.role !== "WORKER") {
      return NextResponse.json(
        { error: "Forbidden: Only authenticated workers may respond to emergency dispatch opportunities." },
        { status: 403 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const dispatchId = resolvedParams?.id;
    if (!dispatchId) {
      return NextResponse.json({ error: "dispatchId parameter is required." }, { status: 400 });
    }

    const body = await request.json();
    const responseAction = body?.response?.toUpperCase();
    if (responseAction !== "ACCEPT" && responseAction !== "DECLINE") {
      return NextResponse.json(
        { error: "Invalid response action. Expected 'ACCEPT' or 'DECLINE'." },
        { status: 400 }
      );
    }

    // Derive worker identity exclusively from server-side session (Never trust client-supplied worker_id)
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: workerRec } = await (supabase.from("workers") as any)
      .select("id")
      .eq("profile_id", authUser.id)
      .maybeSingle();

    if (!workerRec?.id) {
      return NextResponse.json(
        { error: "Worker profile record not found for authenticated user." },
        { status: 404 }
      );
    }

    const workerId = workerRec.id;

    // Process atomic acceptance / decline
    const result = await EmergencyTeamRepository.respondToDispatch({
      dispatchId,
      workerId,
      response: responseAction as "ACCEPT" | "DECLINE",
    });

    const statusCode = result.code || (result.success ? 200 : 400);

    return NextResponse.json(result, { status: statusCode });
  } catch (err: unknown) {
    console.error("POST /api/emergency/dispatch/[id]/respond error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
