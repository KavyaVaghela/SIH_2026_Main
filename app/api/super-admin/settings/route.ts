/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: services, error } = await (supabase.from("services") as any)
      .select(`
        id,
        title,
        description,
        base_price,
        is_active,
        service_categories (name)
      `)
      .order("title", { ascending: true });

    if (error) {
      console.error("[SuperAdminSettingsAPI] Error fetching services:", error);
      return NextResponse.json(
        { error: "Unable to load trade services catalog from database." },
        { status: 500 }
      );
    }

    const managedServices = (services || []).map((s: any) => ({
      id: s.id,
      title: s.title,
      category: s.service_categories?.name || "General Trades",
      basePrice: Number(s.base_price) || 0,
      isActive: Boolean(s.is_active),
      description: s.description || undefined,
    }));

    return NextResponse.json({ services: managedServices });
  } catch (err) {
    console.error("[SuperAdminSettingsAPI] Unexpected GET error:", err);
    return NextResponse.json(
      { error: "Internal server error loading platform settings." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { serviceId, isActive } = body;

    if (!serviceId || typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request payload. Required: serviceId (string) and isActive (boolean)." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { error } = await (supabase.from("services") as any)
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", serviceId);

    if (error) {
      console.error("[SuperAdminSettingsAPI] Error updating service status:", error);
      return NextResponse.json(
        { error: "Failed to update service availability in database." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, serviceId, isActive });
  } catch (err) {
    console.error("[SuperAdminSettingsAPI] Unexpected PATCH error:", err);
    return NextResponse.json(
      { error: "Internal server error updating setting." },
      { status: 500 }
    );
  }
}
