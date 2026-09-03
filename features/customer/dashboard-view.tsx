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
import { bookingService, Booking } from "@/features/bookings/services/booking-service";

export function CustomerDashboardView() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeBooking, setActiveBooking] = React.useState<CurrentBookingData | null>(null);
  const [upcomingBookings, setUpcomingBookings] = React.useState<UpcomingBookingData[]>([]);

  React.useEffect(() => {
    bookingService.getCustomerBookings("cust-1").then((list) => {
      if (list.length > 0) {
        // Find latest active non-cancelled booking
        const latest = list.find((b) => b.status !== "CANCELLED" && b.status !== "BOOKING_COMPLETED") || list[0];
        
        setActiveBooking({
          id: latest.id,
          bookingNumber: latest.bookingNumber,
          serviceTitle: latest.serviceTitle || "Household Service",
          categoryName: latest.categoryName || "Service Category",
          workerName: latest.workerName || "Assigned Worker",
          workerPhone: latest.workerPhone || "+91 98250 11021",
          cooperativeName: latest.cooperativeName || "Worker Cooperative Society",
          statusDisplay: latest.status.replace(/_/g, " "),
          statusCode: latest.status,
          scheduledTime: `${latest.scheduledStartAt.split("T")[0]}, Morning Slot`,
          addressText: latest.addressText || "Satellite, Ahmedabad",
          otpCode: latest.otpCode || "940218",
          totalAmount: latest.workerEstimateAmount || latest.totalAmount,
        });

        // Filter upcoming confirmed bookings
        const confirmed = list.filter((b) => b.status === "BOOKING_CONFIRMED");
        setUpcomingBookings(
          confirmed.map((c) => ({
            id: c.id,
            bookingNumber: c.bookingNumber,
            serviceTitle: c.serviceTitle || "Service",
            scheduledDate: c.scheduledStartAt.split("T")[0],
            scheduledTime: "Morning Slot",
            addressText: c.addressText || "Satellite, Ahmedabad",
            estimatedAmount: c.workerEstimateAmount || c.totalAmount,
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
        customerName="Ravi"
        locationArea="Satellite, Ahmedabad"
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
