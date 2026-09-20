import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateComplaintEvidenceSignedUrl,
  normalizeStorageKey,
  verifyComplaintAccess,
} from "@/lib/storage/complaint-evidence";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPath = searchParams.get("path");
    const format = searchParams.get("format"); // "json" or redirect (default)
    const actorIdParam = searchParams.get("actorId"); // fallback for test / service requests

    if (!rawPath) {
      return NextResponse.json({ error: "Missing evidence path parameter." }, { status: 400 });
    }

    const cleanKey = normalizeStorageKey(rawPath);
    const segments = cleanKey.split("/").filter(Boolean);

    // Extract complaintId: either "complaints/{complaintId}/{filename}" or "{complaintId}/{filename}"
    let complaintId = "";
    if (segments[0] === "complaints" && segments.length >= 2) {
      complaintId = segments[1];
    } else if (segments.length >= 2) {
      complaintId = segments[0];
    }

    if (!complaintId) {
      return NextResponse.json(
        { error: "Invalid evidence storage path structure." },
        { status: 400 }
      );
    }

    // Authenticate user via SSR session cookies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const ssrClient = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
      },
    });

    const {
      data: { user: sessionUser },
    } = await ssrClient.auth.getUser();

    const effectiveUserId = sessionUser?.id || actorIdParam;

    if (!effectiveUserId) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication is required to view complaint evidence." },
        { status: 401 }
      );
    }

    // Resolve caller role and profile details
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (admin.from("profiles") as any)
      .select("id, role")
      .eq("id", effectiveUserId)
      .maybeSingle();

    const role = profile?.role || (sessionUser?.user_metadata?.role as string) || "CUSTOMER";

    // Find federationId if federation admin
    let federationId: string | undefined;
    if (role === "FEDERATION_ADMIN" || role === "ADMIN") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: fedAdmin } = await (admin.from("federation_admins") as any)
        .select("federation_id")
        .eq("profile_id", effectiveUserId)
        .maybeSingle();

      federationId = fedAdmin?.federation_id;
    }

    // Verify authorized access
    const isAuthorized = await verifyComplaintAccess(complaintId, {
      id: effectiveUserId,
      role,
      federationId,
    });

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error: "Forbidden: You are not authorized to access this private complaint evidence.",
        },
        { status: 403 }
      );
    }

    // Generate signed URL (valid for 5 minutes)
    const { signedUrl, error: signErr } = await generateComplaintEvidenceSignedUrl(cleanKey, 300);

    if (signErr || !signedUrl) {
      return NextResponse.json(
        { error: signErr || "Failed to generate signed evidence URL." },
        { status: 404 }
      );
    }

    if (format === "json") {
      return NextResponse.json({
        success: true,
        signedUrl,
      });
    }

    return NextResponse.redirect(signedUrl, 307);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
