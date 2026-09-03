import * as React from "react";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { BookingsDashboard } from "@/features/super-admin/bookings/components/bookings-dashboard";

export const metadata = {
  title: "Bookings Monitoring - Super Admin",
};

export default function BookingsPage() {
  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Platform Booking Operations"
        description="Supervise end-to-end service requests, worker dispatching, OTP authentications, and state machine lifecycle transitions."
        breadcrumbs={[
          { label: "Super Admin", href: "/super-admin" },
          { label: "Bookings" },
        ]}
      />
      <Suspense fallback={<div className="flex items-center justify-center py-12 text-sm text-muted-foreground">Loading booking operations...</div>}>
        <BookingsDashboard />
      </Suspense>
    </div>
  );
}
