/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SocietyStatus, SocietyPerformanceMetrics } from "@/features/super-admin/cooperative-societies/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Society ID is required" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Fetch federation details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: fed, error: fedErr } = await (adminClient.from("federations") as any)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fedErr || !fed) {
      return NextResponse.json({ error: "Cooperative Society not found" }, { status: 404 });
    }

    // 2. Fetch admin profile if contact_email exists
    let realAdminName: string | null = null;
    if (fed.contact_email) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: prof } = await (adminClient.from("profiles") as any)
        .select("full_name")
        .eq("email", fed.contact_email)
        .eq("role", "FEDERATION_ADMIN")
        .maybeSingle();
      if (prof?.full_name) {
        realAdminName = prof.full_name;
      }
    }

    // 3. Parallel fetch of workers, bookings, and reviews for this federation
    const [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { data: dbWorkers },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { data: dbBookings },
    ] = await Promise.all([
      (adminClient.from("workers") as any)
        .select(`
          id,
          profile_id,
          account_status,
          availability_status,
          verification_status,
          profession,
          hourly_rate,
          experience_years,
          joining_date,
          profiles (
            full_name,
            email,
            phone,
            avatar_url
          )
        `)
        .eq("federation_id", id),
      (adminClient.from("bookings") as any)
        .select(`
          id,
          booking_number,
          scheduled_start_at,
          total_amount,
          status,
          created_at,
          profiles!customer_id (full_name),
          workers (
            profiles (full_name)
          ),
          services (title)
        `)
        .eq("federation_id", id)
        .order("created_at", { ascending: false }),
    ]);

    const validWorkers = (dbWorkers || []).filter((w: any) => w.account_status !== "DELETED");
    const totalWorkers = validWorkers.length;
    const busyWorkers = validWorkers.filter((w: any) => w.availability_status === "BUSY").length;
    const utilizationRate = totalWorkers > 0 ? Math.round((busyWorkers / totalWorkers) * 100) : 0;

    const bookingList = dbBookings || [];
    const totalBookings = bookingList.length;
    const completedBookings = bookingList.filter(
      (b: any) => b.status === "BOOKING_COMPLETED" || b.status === "SERVICE_COMPLETED"
    ).length;
    const cancelledBookings = bookingList.filter(
      (b: any) => b.status === "CANCELLED" || b.status === "REJECTED"
    ).length;
    const activeJobs = bookingList.filter(
      (b: any) =>
        b.status !== "BOOKING_COMPLETED" &&
        b.status !== "SERVICE_COMPLETED" &&
        b.status !== "CANCELLED" &&
        b.status !== "REJECTED"
    ).length;

    const completionRate =
      totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 100;
    const cancellationRate =
      totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0;

    // Derived average rating from worker reviews
    let averageRating: number | null = null;
    if (validWorkers.length > 0) {
      const workerIds = validWorkers.map((w: any) => w.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: reviews } = await (adminClient.from("reviews") as any)
        .select("rating")
        .in("worker_id", workerIds);
      if (reviews && reviews.length > 0) {
        const sum = reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
        averageRating = Number((sum / reviews.length).toFixed(1));
      }
    }

    // Complaints count
    let complaintCount = 0;
    if (bookingList.length > 0) {
      const bookingIds = bookingList.map((b: any) => b.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: complaints } = await (adminClient.from("complaints") as any)
        .select("id")
        .in("booking_id", bookingIds);
      complaintCount = complaints?.length || 0;
    }

    const status = (fed.status as SocietyStatus) || (fed.is_active ? "ACTIVE" : "PENDING");

    const societyDetails = {
      id: fed.id,
      name: fed.name,
      code: fed.code,
      registrationNumber: fed.registration_number,
      city: fed.city,
      state: fed.state,
      location: `${fed.city}, ${fed.state}`,
      address: fed.address,
      contactEmail: fed.contact_email,
      contactPhone: fed.contact_phone,
      adminName: realAdminName || "Cooperative Secretary",
      serviceRegion: fed.service_region,
      totalWorkers,
      activeJobs,
      totalBookings,
      completedBookings,
      averageRating,
      status,
      isActive: fed.is_active,
      registrationDate: fed.created_at
        ? new Date(fed.created_at).toISOString().split("T")[0]
        : "2024-01-01",
      cancellationRate,
      complaintCount,
      utilizationRate,
      completionRate,
      officialDocuments: fed.official_documents || [
        { title: "Cooperative Registration Certificate", url: "#", verified: true },
      ],
      rejectionReason: fed.rejection_reason || null,
      reviewedAt: fed.reviewed_at || null,
      reviewedBy: fed.reviewed_by || null,
    };

    const workersList = validWorkers.map((w: any) => ({
      id: w.id,
      profileId: w.profile_id,
      fullName: w.profiles?.full_name || "Cooperative Craftsman",
      email: w.profiles?.email,
      phone: w.profiles?.phone,
      profession: w.profession || "Skilled Craftsman",
      experienceYears: w.experience_years || 0,
      hourlyRate: w.hourly_rate || 350,
      accountStatus: w.account_status,
      availabilityStatus: w.availability_status,
      verificationStatus: w.verification_status,
      joiningDate: w.joining_date
        ? new Date(w.joining_date).toISOString().split("T")[0]
        : "2024-01-01",
      avatarUrl: w.profiles?.avatar_url,
    }));

    const bookingsItems = bookingList.map((b: any) => ({
      id: b.id,
      bookingNumber: b.booking_number || b.id.slice(0, 8).toUpperCase(),
      customerName: b.profiles?.full_name || "Household Customer",
      workerName: b.workers?.profiles?.full_name || "Assigned Worker",
      serviceTitle: b.services?.title || "Cooperative Service Request",
      scheduledStartAt: b.scheduled_start_at
        ? new Date(b.scheduled_start_at).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "Scheduled",
      totalAmount: b.total_amount || 0,
      status: b.status,
      createdAt: b.created_at
        ? new Date(b.created_at).toISOString().split("T")[0]
        : "2024-01-01",
    }));

    const ratingVal = averageRating ?? 0;
    const performanceMetrics: SocietyPerformanceMetrics = {
      bookingCompletionRate: completionRate,
      workerUtilizationRate: utilizationRate,
      customerSatisfaction: ratingVal,
      cancellationRate,
      complaintCount,
      overallPerformanceScore: Math.round(
        (completionRate + utilizationRate + ratingVal * 20) / 3
      ),
    };

    return NextResponse.json({
      society: societyDetails,
      workers: workersList,
      bookings: bookingsItems,
      performance: performanceMetrics,
    });
  } catch (err: unknown) {
    console.error("Super Admin society detail GET API error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
