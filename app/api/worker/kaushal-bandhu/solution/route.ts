import { NextResponse } from "next/server";
import { getAuthenticatedWorker } from "@/lib/ai/ai-auth";
import { generateAiComplaintSolution } from "@/features/worker/kaushal-bandhu/services/complaint-solution-service";
import type { WorkerAiLanguage, WorkerCustomerComplaintItem } from "@/lib/ai/ai-types";

export const dynamic = "force-dynamic";

/**
 * Worker AI Complaint Solution Generator API
 *
 * Provides tailored conciliation advice and drafted statements for
 * customer complaints, with seamless fallback if AI quota is reached.
 */
export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedWorker(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized: Active worker session required." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const complaint = body.complaint as WorkerCustomerComplaintItem;
    const language: WorkerAiLanguage = body.language || "hi";

    if (!complaint || !complaint.id) {
      return NextResponse.json(
        { error: "Missing required complaint information." },
        { status: 400 }
      );
    }

    const solution = await generateAiComplaintSolution(
      complaint,
      {
        trade: auth.profession || "Artisan",
        name: auth.fullName || "Worker Partner",
      },
      language
    );

    return NextResponse.json({
      success: true,
      solution,
    });
  } catch (err: unknown) {
    console.error("[ComplaintSolutionAPI] Unexpected error:", err);
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
