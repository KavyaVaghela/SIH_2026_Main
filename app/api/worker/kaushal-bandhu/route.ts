import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { aiProvider } from "@/lib/ai/ai-provider";
import { getAuthenticatedWorker } from "@/lib/ai/ai-auth";
import { buildWorkerAiContext } from "@/features/worker/kaushal-bandhu/services/worker-ai-service";
import type { WorkerAiLanguage } from "@/lib/ai/ai-types";

export const dynamic = "force-dynamic";

/**
 * Worker AI Assistant API Route (Kaushal Bandhu)
 *
 * Security & Design Principles:
 * 1. Authenticates Supabase user and verifies role === "WORKER".
 * 2. Derives workerId strictly server-side.
 * 3. Rate-limit protection: Supports ?mode=context-only to load factual context on mount without calling Groq.
 * 4. Strictly advisory: Zero database modifications or job assignments.
 */
export async function GET(request: Request) {
  return handleWorkerAiRequest(request, "GET");
}

export async function POST(request: Request) {
  return handleWorkerAiRequest(request, "POST");
}

async function handleWorkerAiRequest(
  request: Request,
  method: "GET" | "POST"
) {
  try {
    const auth = await getAuthenticatedWorker(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized: Active authenticated session required." },
        { status: 401 }
      );
    }

    if (auth.role !== "WORKER") {
      return NextResponse.json(
        {
          error: "Forbidden: Worker role required for Kaushal Bandhu.",
        },
        { status: 403 }
      );
    }

    if (!auth.workerId) {
      return NextResponse.json(
        {
          error: "Forbidden: No registered worker profile found.",
        },
        { status: 403 }
      );
    }

    const adminClient = createAdminClient();

    // Check mode & language
    const { searchParams } = new URL(request.url);
    let mode = searchParams.get("mode");
    let language: WorkerAiLanguage = (searchParams.get("lang") as WorkerAiLanguage) || "hi";

    if (method === "POST") {
      try {
        const body = await request.json();
        if (body.mode) mode = body.mode;
        if (body.language) language = body.language;
      } catch {
        // Body is optional
      }
    }

    if (!["hi", "gu", "en"].includes(language)) {
      language = "hi";
    }

    // 1. Build deterministic context from live Supabase data
    const context = await buildWorkerAiContext(
      adminClient,
      auth.userId,
      auth.workerId
    );

    // 2. If initial load / context-only mode, return without invoking Groq
    if (mode === "context-only") {
      return NextResponse.json({
        context,
        advice: null,
      });
    }

    // 3. User explicitly requested advice -> call Groq via aiProvider
    const advice = await aiProvider.getWorkerAdvice(context, language);

    return NextResponse.json({
      context,
      advice,
    });
  } catch (err: unknown) {
    console.error("[KaushalBandhuAPI] Unexpected error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
