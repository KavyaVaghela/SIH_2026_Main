/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "SUPER_ADMIN";
    const profileId = searchParams.get("profileId");

    const adminClient = createAdminClient();

    let targetProfileIds: string[] = [];

    if (profileId && profileId !== "undefined" && profileId !== "null") {
      targetProfileIds.push(profileId);
    } else if (role === "SUPER_ADMIN") {
      // Find Super Admin profile IDs
      const { data: saProfiles } = await (adminClient.from("profiles") as any)
        .select("id")
        .eq("role", "SUPER_ADMIN");

      if (saProfiles && saProfiles.length > 0) {
        targetProfileIds = saProfiles.map((p: any) => p.id);
      }
    }

    if (targetProfileIds.length === 0) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    // Query real notifications for authorized profiles
    const { data: notifs, error } = await (adminClient.from("notifications") as any)
      .select("id, profile_id, title, message, type, is_read, metadata, created_at")
      .in("profile_id", targetProfileIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notifications = (notifs || []).map((n: any) => {
      let targetRoute: string | undefined = n.metadata?.targetRoute;
      if (!targetRoute) {
        if (n.metadata?.bookingId) {
          targetRoute = role === "SUPER_ADMIN" ? `/super-admin/bookings/${n.metadata.bookingId}` : `/customer/bookings/${n.metadata.bookingId}`;
        } else if (n.metadata?.complaintId) {
          targetRoute = role === "SUPER_ADMIN" ? `/super-admin/complaints/${n.metadata.complaintId}` : `/customer/complaints/${n.metadata.complaintId}`;
        } else if (n.metadata?.federationId) {
          targetRoute = `/super-admin/societies/${n.metadata.federationId}`;
        } else if (n.metadata?.workerId) {
          targetRoute = role === "SUPER_ADMIN" ? `/super-admin/workforce/${n.metadata.workerId}` : "/worker/profile";
        } else if (role === "SUPER_ADMIN") {
          targetRoute = "/super-admin/bookings";
        }
      }

      return {
        id: n.id,
        profileId: n.profile_id,
        title: n.title,
        message: n.message,
        type: n.type || "info",
        isRead: Boolean(n.is_read),
        metadata: n.metadata || null,
        createdAt: n.created_at,
        targetRoute,
        priority: n.type === "error" ? "urgent" : n.type === "warning" ? "high" : "medium",
      };
    });

    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (err: unknown) {
    console.error("Notifications API GET error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const adminClient = createAdminClient();

    if (body.action === "markRead" && body.id) {
      const { error } = await (adminClient.from("notifications") as any)
        .update({ is_read: true })
        .eq("id", body.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (body.action === "markAllRead") {
      let targetProfileIds: string[] = [];
      if (body.profileId) {
        targetProfileIds.push(body.profileId);
      } else if (body.role === "SUPER_ADMIN") {
        const { data: saProfiles } = await (adminClient.from("profiles") as any)
          .select("id")
          .eq("role", "SUPER_ADMIN");
        if (saProfiles && saProfiles.length > 0) {
          targetProfileIds = saProfiles.map((p: any) => p.id);
        }
      }

      if (targetProfileIds.length > 0) {
        const { error } = await (adminClient.from("notifications") as any)
          .update({ is_read: true })
          .in("profile_id", targetProfileIds)
          .eq("is_read", false);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
      return NextResponse.json({ success: true });
    }

    if (body.action === "create") {
      const { data, error } = await (adminClient.from("notifications") as any)
        .insert({
          profile_id: body.profileId,
          title: body.title,
          message: body.message,
          type: body.type || "info",
          is_read: false,
          metadata: body.metadata || null,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ notification: data });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    console.error("Notifications API POST error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
