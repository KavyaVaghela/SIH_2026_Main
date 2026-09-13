import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, societyId, rejectionReason } = body;

    if (!action || !societyId) {
      return NextResponse.json(
        { error: "action and societyId are required" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Verify caller role if authenticated session is present
    let reviewerProfileId: string | null = null;
    try {
      const serverClient = createServerClient();
      const {
        data: { user },
      } = await serverClient.auth.getUser();

      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: callerProfile } = await (adminClient.from("profiles") as any)
          .select("id, role")
          .eq("id", user.id)
          .maybeSingle();

        if (callerProfile) {
          if (callerProfile.role !== "SUPER_ADMIN") {
            return NextResponse.json(
              { error: "Unauthorized: Super Admin access required" },
              { status: 403 }
            );
          }
          reviewerProfileId = callerProfile.id;
        }
      }
    } catch (authErr) {
      console.warn("Notice: Super Admin caller resolution:", authErr);
    }

    // Lookup target federation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: federation, error: fedErr } = await (adminClient.from("federations") as any)
      .select("*")
      .eq("id", societyId)
      .maybeSingle();

    if (fedErr || !federation) {
      return NextResponse.json(
        { error: "Federation society not found" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    if (action === "approve") {
      // 1. Update federation status to ACTIVE
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedFed, error: updateErr } = await (adminClient.from("federations") as any)
        .update({
          status: "ACTIVE",
          is_active: true,
          rejection_reason: null,
          reviewed_at: now,
          reviewed_by: reviewerProfileId,
        })
        .eq("id", societyId)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json(
          { error: `Failed to approve federation: ${updateErr.message}` },
          { status: 500 }
        );
      }

      // 2. Activate Federation Admin profile in profiles table
      if (federation.contact_email) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (adminClient.from("profiles") as any)
          .update({ is_active: true })
          .eq("email", federation.contact_email)
          .eq("role", "FEDERATION_ADMIN");
      }

      return NextResponse.json({
        success: true,
        message: "Cooperative society approved and activated successfully",
        data: updatedFed,
      });
    }

    if (action === "reject") {
      const reason = rejectionReason?.trim() || "Application rejected by Super Admin";

      // 1. Update federation status to REJECTED
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedFed, error: updateErr } = await (adminClient.from("federations") as any)
        .update({
          status: "REJECTED",
          is_active: false,
          rejection_reason: reason,
          reviewed_at: now,
          reviewed_by: reviewerProfileId,
        })
        .eq("id", societyId)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json(
          { error: `Failed to reject federation: ${updateErr.message}` },
          { status: 500 }
        );
      }

      // 2. Deactivate Federation Admin profile
      if (federation.contact_email) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (adminClient.from("profiles") as any)
          .update({ is_active: false })
          .eq("email", federation.contact_email)
          .eq("role", "FEDERATION_ADMIN");
      }

      return NextResponse.json({
        success: true,
        message: "Cooperative society application rejected",
        data: updatedFed,
      });
    }

    if (action === "suspend") {
      // 1. Suspend federation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedFed, error: updateErr } = await (adminClient.from("federations") as any)
        .update({
          status: "SUSPENDED",
          is_active: false,
        })
        .eq("id", societyId)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json(
          { error: `Failed to suspend federation: ${updateErr.message}` },
          { status: 500 }
        );
      }

      // 2. Deactivate Federation Admin profile
      if (federation.contact_email) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (adminClient.from("profiles") as any)
          .update({ is_active: false })
          .eq("email", federation.contact_email)
          .eq("role", "FEDERATION_ADMIN");
      }

      return NextResponse.json({
        success: true,
        message: "Cooperative society suspended",
        data: updatedFed,
      });
    }

    if (action === "reactivate") {
      // 1. Reactivate federation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedFed, error: updateErr } = await (adminClient.from("federations") as any)
        .update({
          status: "ACTIVE",
          is_active: true,
        })
        .eq("id", societyId)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json(
          { error: `Failed to reactivate federation: ${updateErr.message}` },
          { status: 500 }
        );
      }

      // 2. Activate profile
      if (federation.contact_email) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (adminClient.from("profiles") as any)
          .update({ is_active: true })
          .eq("email", federation.contact_email)
          .eq("role", "FEDERATION_ADMIN");
      }

      return NextResponse.json({
        success: true,
        message: "Cooperative society reactivated successfully",
        data: updatedFed,
      });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (err: unknown) {
    console.error("Super Admin societies action error:", err);
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
