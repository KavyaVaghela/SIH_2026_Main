"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { bookingsService } from "../services/bookings-service";
import type {
  BookingStats,
  BookingListItem,
  BookingFilterOptions,
  BookingDateFilter,
} from "../types";

export function useBookings() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Read initial filter parameters from URL
  const [filters, setFilters] = React.useState<BookingFilterOptions>({
    searchQuery: searchParams?.get("query") || "",
    dateRange: (searchParams?.get("date") as BookingDateFilter) || "all",
    status: searchParams?.get("status") || "ALL",
    service: searchParams?.get("service") || "ALL",
    society: searchParams?.get("society") || "ALL",
    location: searchParams?.get("location") || "ALL",
    sortBy: "scheduledStartAt",
    sortOrder: "desc",
    page: Number(searchParams?.get("page")) || 1,
    pageSize: 10,
  });

  const [stats, setStats] = React.useState<BookingStats | null>(null);
  const [bookings, setBookings] = React.useState<BookingListItem[]>([]);
  const [totalCount, setTotalCount] = React.useState<number>(0);
  const [societies, setSocieties] = React.useState<Array<{ id: string; name: string }>>([]);
  const [services, setServices] = React.useState<string[]>([]);
  const [locations, setLocations] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Sync state back to URL query string
  const syncUrlParams = React.useCallback(
    (opts: BookingFilterOptions) => {
      const params = new URLSearchParams();
      if (opts.searchQuery) params.set("query", opts.searchQuery);
      if (opts.dateRange !== "all") params.set("date", opts.dateRange);
      if (opts.status !== "ALL") params.set("status", opts.status);
      if (opts.service !== "ALL") params.set("service", opts.service);
      if (opts.society !== "ALL") params.set("society", opts.society);
      if (opts.location !== "ALL") params.set("location", opts.location);
      if (opts.page > 1) params.set("page", String(opts.page));

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [pathname, router]
  );

  const fetchBookingsData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsRes, listRes] = await Promise.all([
        bookingsService.getBookingStats(),
        bookingsService.getBookings(filters),
      ]);

      setStats(statsRes);
      setBookings(listRes.data);
      setTotalCount(listRes.totalCount);
      setSocieties(listRes.societies);
      setServices(listRes.services);
      setLocations(listRes.locations);
    } catch (err) {
      console.error("Failed to load platform bookings:", err);
      setError("An error occurred while loading booking intelligence.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    fetchBookingsData();
  }, [fetchBookingsData]);

  const updateFilters = (newFilters: Partial<BookingFilterOptions>) => {
    setFilters((prev) => {
      const updated = {
        ...prev,
        ...newFilters,
        page: newFilters.page !== undefined ? newFilters.page : 1,
      };
      syncUrlParams(updated);
      return updated;
    });
  };

  const resetFilters = () => {
    const defaultFilters: BookingFilterOptions = {
      searchQuery: "",
      dateRange: "all",
      status: "ALL",
      service: "ALL",
      society: "ALL",
      location: "ALL",
      sortBy: "scheduledStartAt",
      sortOrder: "desc",
      page: 1,
      pageSize: 10,
    };
    setFilters(defaultFilters);
    syncUrlParams(defaultFilters);
  };

  return {
    stats,
    bookings,
    totalCount,
    societies,
    services,
    locations,
    isLoading,
    error,
    filters,
    updateFilters,
    resetFilters,
    refresh: fetchBookingsData,
  };
}
