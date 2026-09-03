"use client";

import * as React from "react";
import { bookingsService } from "../services/bookings-service";
import type { BookingDetails, BookingTimelineItem } from "../types";

export function useBookingDetail(id: string) {
  const [booking, setBooking] = React.useState<BookingDetails | null>(null);
  const [timeline, setTimeline] = React.useState<BookingTimelineItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchDetail = React.useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    try {
      const b = await bookingsService.getBookingById(id);
      if (!b) {
        setError("Booking not found or could not be retrieved.");
        setBooking(null);
        setTimeline([]);
      } else {
        setBooking(b);
        const tl = await bookingsService.getBookingTimeline(b);
        setTimeline(tl);
      }
    } catch (err) {
      console.error("Failed to fetch booking detail:", err);
      setError("An unexpected error occurred while loading booking details.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    booking,
    timeline,
    isLoading,
    error,
    refresh: fetchDetail,
  };
}
