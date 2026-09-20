import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId parameter" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Query existing requirement row for this project
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reqs, error: selErr } = await (admin.from("project_requirements") as any)
      .select("id, project_request_id, required_workers_count")
      .eq("project_request_id", projectId);

    if (selErr) {
      console.error("API GET /api/worker/requirement DB error:", selErr);
      return NextResponse.json({ error: selErr.message }, { status: 500 });
    }

    if (reqs && reqs.length > 0) {
      return NextResponse.json({
        success: true,
        requirement: reqs[0],
        requirementId: reqs[0].id,
      });
    }

    // 2. Fetch project_requests description for [Workers] count if available
    const { data: projReq } = await (admin.from("project_requests") as ReturnType<typeof admin.from>)
      .select("description")
      .eq("id", projectId)
      .maybeSingle();

    let initialWorkerCount = 5;
    if (projReq?.description) {
      const wm = projReq.description.match(/\[Workers\]:\s*(\d+)/);
      if (wm) initialWorkerCount = Number(wm[1]);
    }

    const { data: skills } = await (admin.from("skills") as ReturnType<typeof admin.from>).select("id").limit(1);
    const defaultSkillId = skills?.[0]?.id || "9f757d17-0f01-4d11-8d0f-601a832f8aba";

    const { data: created, error: insErr } = await (admin.from("project_requirements") as ReturnType<typeof admin.from>)
      .insert({
        project_request_id: projectId,
        skill_id: defaultSkillId,
        required_workers_count: initialWorkerCount,
      })
      .select();

    if (insErr || !created || created.length === 0) {
      console.error("API GET /api/worker/requirement creation error:", insErr);
      return NextResponse.json({ error: insErr?.message || "Failed to create project requirement" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      requirement: created[0],
      requirementId: created[0].id,
    });
  } catch (err: unknown) {
    console.error("API GET /api/worker/requirement handler error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
