import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ error: "Missing document path" }, { status: 400 });
    }

    // Check caller authentication
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
    const ssrClient = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
      },
    });

    const {
      data: { user },
    } = await ssrClient.auth.getUser();

    // Verify role if authenticated
    if (user) {
      const admin = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (admin.from("profiles") as any)
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      // Customers are strictly forbidden from accessing private worker documents
      if (profile?.role === "CUSTOMER") {
        return NextResponse.json({ error: "Unauthorized access to private documents" }, { status: 403 });
      }
    }

    const admin = createAdminClient();
    const { data: signedData, error: signErr } = await admin.storage
      .from("documents")
      .createSignedUrl(path, 300); // 5-minute signed access

    if (signErr || !signedData?.signedUrl) {
      return NextResponse.json({ error: signErr?.message || "Document not found" }, { status: 404 });
    }

    return NextResponse.redirect(signedData.signedUrl);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
