import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { bookingsService } from "@/features/super-admin/bookings/services/bookings-service";
import type { BookingDateFilter, BookingFilterOptions } from "@/features/super-admin/bookings/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = (searchParams.get("date") || searchParams.get("dateRange") || "all") as BookingDateFilter;
    const status = searchParams.get("status") || "ALL";
    const service = searchParams.get("service") || "ALL";
    const society = searchParams.get("society") || "ALL";
    const location = searchParams.get("location") || "ALL";
    const searchQuery = searchParams.get("query") || searchParams.get("searchQuery") || "";
    const sortBy = (searchParams.get("sortBy") || "scheduledStartAt") as BookingFilterOptions["sortBy"];
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    const adminClient = createAdminClient();

    const [stats, listResult] = await Promise.all([
      bookingsService.getBookingStats(dateRange, adminClient),
      bookingsService.getBookings(
        {
          dateRange,
          status,
          service,
          society,
          location,
          searchQuery,
          sortBy,
          sortOrder,
          page,
          pageSize,
        },
        adminClient
      ),
    ]);

    return NextResponse.json({
      success: true,
      stats,
      data: listResult.data,
      totalCount: listResult.totalCount,
      societies: listResult.societies,
      services: listResult.services,
      locations: listResult.locations,
    });
  } catch (err: unknown) {
    console.error("Super Admin bookings API error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
