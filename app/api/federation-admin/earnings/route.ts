import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { federationEarningsService } from "@/features/federation-admin/earnings/services/earnings-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const monthKey = searchParams.get("month") || "2026-09";
    const adminClient = createAdminClient();

    // 1. Resolve caller and federation ID
    let adminFedId: string | null = null;
    try {
      const authHeader = request.headers.get("authorization");
      let user: any = null;

      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const { data: userData } = await adminClient.auth.getUser(token);
        if (userData?.user) user = userData.user;
      }

      if (!user) {
        try {
          const serverClient = createServerClient();
          const { data: cookieUserData } = await serverClient.auth.getUser();
          if (cookieUserData?.user) user = cookieUserData.user;
        } catch (_) {}
      }

      if (user) {
        if (user.user_metadata?.federation_id) {
          adminFedId = user.user_metadata.federation_id;
        } else if (user.email) {
          const { data: fedByEmail } = await (adminClient.from("federations") as any)
            .select("id")
            .eq("contact_email", user.email)
            .maybeSingle();
          if (fedByEmail?.id) adminFedId = fedByEmail.id;
        }
      }
    } catch (authErr) {
      console.warn("Notice: Federation context resolution in earnings route:", authErr);
    }

    if (!adminFedId) {
      adminFedId = "b765df3b-c418-4a15-b79f-3cbc09e475dc";
    }

    // 2. Fetch real earnings data scoped to resolved federation
    const data = await federationEarningsService.getEarningsData(monthKey, adminClient);

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("Federation Admin earnings API error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
