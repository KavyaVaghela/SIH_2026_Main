import * as React from "react";
import { BookingStatusView } from "@/features/customer/booking-status/booking-status-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Booking Status - KaushalyaSetu",
  description: "View real-time booking request status and worker estimate on KaushalyaSetu.",
};

export default function CustomerBookingStatusPage({
  params,
}: {
  params: { bookingId: string };
}) {
  return <BookingStatusView bookingId={params.bookingId} />;
}
