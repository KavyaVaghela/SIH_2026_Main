"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CustomerHomeHeader } from "./home/customer-home-header";
import { ServiceCategoryGrid } from "./home/service-category-grid";
import { CurrentBookingCard, CurrentBookingData } from "./home/current-booking-card";
import { UpcomingBookingCard, UpcomingBookingData } from "./home/upcoming-booking-card";
import { RecommendedWorkersSection } from "./home/recommended-workers-section";
import { EmergencyBanner } from "./home/emergency-banner";
import { ProjectWorkforceBanner } from "./home/project-workforce-banner";
import { CustomerNotificationsCard } from "./home/customer-notifications-card";
import { bookingService } from "@/features/bookings/services/booking-service";

import { createClient } from "@/lib/supabase/client";

export function CustomerDashboardView() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [customerDisplayName, setCustomerDisplayName] = React.useState("Prince");
  const [customerLocationArea, setCustomerLocationArea] = React.useState("Satellite, Ahmedabad");
  const [activeBooking, setActiveBooking] = React.useState<CurrentBookingData | null>(null);
  const [upcomingBookings, setUpcomingBookings] = React.useState<UpcomingBookingData[]>([]);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from("profiles") as any)
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle()
          .then(({ data }: { data: { full_name?: string } | null }) => {
            if (data?.full_name) {
              const name = data.full_name.trim();
              if (name.toLowerCase().includes("system") || name.toLowerCase().includes("admin")) {
                setCustomerDisplayName("Prince");
              } else {
                setCustomerDisplayName(name.split(" ")[0]);
              }
            } else {
              setCustomerDisplayName("Prince");
            }
          });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from("addresses") as any)
          .select("address_line2, city")
          .eq("profile_id", user.id)
          .eq("is_default", true)
          .maybeSingle()
          .then(({ data }: { data: any }) => {
            if (data) {
              setCustomerLocationArea(`${data.address_line2 || "Satellite"}, ${data.city || "Ahmedabad"}`);
            }
          });
      }
    });

    bookingService.getCustomerBookings("cust-1").then((list) => {
      if (list.length > 0) {
        // Find latest active non-cancelled booking
        const latest = list.find((b) => b.status !== "CANCELLED" && b.status !== "BOOKING_COMPLETED") || list[0];
        
        setActiveBooking({
          id: latest.id,
          bookingNumber: latest.bookingNumber,
          serviceTitle: (latest as any).serviceTitle || "Household Service",
          categoryName: (latest as any).categoryName || "Service Category",
          workerName: (latest as any).workerName || "Assigned Worker",
          workerPhone: (latest as any).workerPhone || "+91 98250 11021",
          cooperativeName: (latest as any).cooperativeName || "Worker Cooperative Society",
          statusDisplay: latest.status.replace(/_/g, " "),
          statusCode: latest.status,
          scheduledTime: `${latest.scheduledStartAt.split("T")[0]}, Morning Slot`,
          addressText: (latest as any).addressText || "Satellite, Ahmedabad",
          otpCode: (latest as any).otpCode || "940218",
          totalAmount: (latest as any).workerEstimateAmount || latest.totalAmount,
        });

        // Filter upcoming confirmed bookings
        const confirmed = list.filter((b) => b.status === "BOOKING_CONFIRMED");
        setUpcomingBookings(
          confirmed.map((c) => ({
            id: c.id,
            bookingNumber: c.bookingNumber,
            serviceTitle: (c as any).serviceTitle || "Service",
            scheduledDate: c.scheduledStartAt.split("T")[0],
            scheduledTime: "Morning Slot",
            addressText: (c as any).addressText || "Satellite, Ahmedabad",
            estimatedAmount: (c as any).workerEstimateAmount || c.totalAmount,
          }))
        );
      }
    });
  }, []);

  const handleCategorySelect = (categoryId: string) => {
    router.push(`/customer/book?category=${categoryId}`);
  };

  const handleViewBookingDetails = (bookingId: string) => {
    router.push(`/customer/bookings/${bookingId}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. Hero Header & Search Anchor */}
      <CustomerHomeHeader
        customerName={customerDisplayName}
        locationArea={customerLocationArea}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 2. Service Category Grid */}
      <ServiceCategoryGrid
        filterQuery={searchQuery}
        onCategorySelect={handleCategorySelect}
      />

      {/* 3. Action Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <EmergencyBanner onEmergencyClick={() => router.push("/customer/emergency")} />
        <ProjectWorkforceBanner onHireProjectClick={() => router.push("/customer/projects")} />
      </div>

      {/* 4. Active Services & Schedule Section */}
      <div className="space-y-3.5">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          My Active Services & Schedule
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Ongoing Booking */}
          <div className="lg:col-span-2">
            <CurrentBookingCard booking={activeBooking} onViewDetails={handleViewBookingDetails} />
          </div>

          {/* Scheduled Appointments */}
          <div>
            <UpcomingBookingCard bookings={upcomingBookings} />
          </div>
        </div>
      </div>

      {/* 5. Recommended Nearby Cooperative Workers */}
      <RecommendedWorkersSection
        onBookWorker={(workerId) => router.push(`/customer/find-worker/${workerId}`)}
        onViewAll={() => router.push("/customer/find-worker")}
      />

      {/* 6. Recent Notifications Stream */}
      <div className="max-w-3xl">
        <CustomerNotificationsCard />
      </div>
    </div>
  );
}

