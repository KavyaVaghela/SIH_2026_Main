import * as React from "react";
import { BookingFlowView } from "@/features/customer/service-booking/booking-flow-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Service Booking - Cooperative Platform",
  description: "Book verified cooperative trade professionals for household repair and maintenance.",
};

export default function ServiceBookingPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 rounded-xl">
          <p className="text-xs text-slate-500 animate-pulse">Loading service booking wizard...</p>
        </div>
      }
    >
      <BookingFlowView />
    </React.Suspense>
  );
}
