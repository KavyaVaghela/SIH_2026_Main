import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { aiProvider } from "@/lib/ai/ai-provider";
import { getAuthenticatedAiUser } from "@/lib/ai/ai-auth";
import { buildFederationDemandContext } from "@/features/federation-admin/ai-intelligence/services/federation-ai-service";

export const dynamic = "force-dynamic";

/**
 * Federation Admin AI Intelligence API Route
 *
 * Security & Governance Requirements:
 * 1. Authenticate Supabase user.
 * 2. Determine role from authenticated profile.
 * 3. Only FEDERATION_ADMIN (or Super Admin auditing) allowed.
 * 4. Derive federation_id strictly server-side. NEVER trust frontend federation_id.
 * 5. Send ONLY summarized platform statistics to Groq (NO worker names, NO PII).
 * 6. Rate-limit protection: Supports ?mode=context-only to load factual metrics on mount without calling Groq.
 */
export async function GET(request: Request) {
  return handleFederationAiRequest(request, "GET");
}

export async function POST(request: Request) {
  return handleFederationAiRequest(request, "POST");
}

async function handleFederationAiRequest(
  request: Request,
  method: "GET" | "POST"
) {
  try {
    const auth = await getAuthenticatedAiUser(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized: Active authenticated session required." },
        { status: 401 }
      );
    }

    if (auth.role !== "FEDERATION_ADMIN" && auth.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          error:
            "Forbidden: Federation Admin role required for Federation AI Intelligence.",
        },
        { status: 403 }
      );
    }

    if (!auth.federationId) {
      return NextResponse.json(
        {
          error:
            "Forbidden: No active cooperative federation associated with your administrator account.",
        },
        { status: 403 }
      );
    }

    const adminClient = createAdminClient();
    const federationId = auth.federationId;

    // Check mode
    const { searchParams } = new URL(request.url);
    let mode = searchParams.get("mode");

    if (method === "POST") {
      try {
        const body = await request.json();
        if (body.mode) mode = body.mode;
      } catch {
        // Body is optional
      }
    }

    // 1. Build deterministic context from live Supabase data
    const context = await buildFederationDemandContext(
      adminClient,
      federationId
    );

    // 2. If initial load / context-only mode, return without invoking Groq
    if (mode === "context-only") {
      return NextResponse.json({
        context,
        intelligence: null,
      });
    }

    // 3. User explicitly requested intelligence -> call Groq via aiProvider
    const intelligence = await aiProvider.getFederationIntelligence(context);

    return NextResponse.json({
      context,
      intelligence,
    });
  } catch (err: unknown) {
    console.error("[FederationAiAPI] Unexpected error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
