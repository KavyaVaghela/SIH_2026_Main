import * as React from "react";
import { Suspense } from "react";
import { BookingDetailView } from "@/features/super-admin/bookings/components/booking-detail-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Booking Inspection & Lifecycle - Super Admin",
};

export default function BookingDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 pb-12">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-80" />
          </div>
          <Skeleton className="h-28 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-80 lg:col-span-2 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      }
    >
      <BookingDetailView />
    </Suspense>
  );
}
