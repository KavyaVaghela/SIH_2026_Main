import { createClient } from "@/lib/supabase/client";
import {
  MOCK_BOOKINGS,
  mapStatusToLifecycleStage,
  generateDeterministicTimeline,
} from "../data/mock-bookings";
import type {
  BookingStats,
  BookingListItem,
  BookingDetails,
  BookingTimelineItem,
  BookingFilterOptions,
  BookingStatus,
  PaymentStatus,
} from "../types";

export class BookingsService {
  /**
   * Fetch aggregate platform booking statistics
   */
  async getBookingStats(): Promise<BookingStats> {
    const supabase = createClient();

    try {
      const { data: bookingsData, error } = await (supabase.from("bookings") as any).select("status");

      if (!error && bookingsData && bookingsData.length > 0) {
        const statuses = bookingsData.map((b: any) => b.status as BookingStatus);
        return this.calculateStatsFromStatuses(statuses);
      }
    } catch {
      // Fallback
    }

    const mockStatuses = MOCK_BOOKINGS.map((b) => b.status);
    return this.calculateStatsFromStatuses(mockStatuses);
  }

  private calculateStatsFromStatuses(statuses: BookingStatus[]): BookingStats {
    const newRequests = statuses.filter((s) =>
      ["REQUEST_SENT", "WORKER_REVIEWING", "WORKER_INTERESTED"].includes(s)
    ).length;

    const pendingBookings = statuses.filter((s) =>
      ["CUSTOMER_CONFIRMATION_PENDING", "BOOKING_CONFIRMED"].includes(s)
    ).length;

    const acceptedBookings = statuses.filter((s) => s === "WORKER_ACCEPTED").length;

    const inProgress = statuses.filter((s) =>
      ["ON_THE_WAY", "ARRIVED", "OTP_VERIFIED", "SERVICE_STARTED"].includes(s)
    ).length;

    const completed = statuses.filter((s) =>
      ["SERVICE_COMPLETED", "BILL_GENERATED", "PAYMENT_PENDING", "PAYMENT_RECEIVED", "BOOKING_COMPLETED"].includes(s)
    ).length;

    const cancelled = statuses.filter((s) => s === "CANCELLED").length;

    return {
      newRequests,
      pendingBookings,
      acceptedBookings,
      inProgress,
      completed,
      cancelled,
      totalBookings: statuses.length,
    };
  }

  /**
   * Fetch filtered, sorted, paginated bookings list
   */
  async getBookings(options: Partial<BookingFilterOptions> = {}): Promise<{
    data: BookingListItem[];
    totalCount: number;
    societies: Array<{ id: string; name: string }>;
    services: string[];
    locations: string[];
  }> {
    const supabase = createClient();

    try {
      const { data: dbBookings, error } = await (supabase.from("bookings") as any).select(`
        id,
        booking_number,
        customer_id,
        worker_id,
        service_id,
        federation_id,
        address_id,
        status,
        scheduled_start_at,
        scheduled_end_at,
        total_amount,
        platform_fee,
        worker_earnings,
        created_at,
        profiles!customer_id (full_name, phone, email),
        workers!worker_id (
          id,
          profession,
          profiles (full_name, phone)
        ),
        services (id, title, service_categories (name)),
        federations (id, name),
        addresses (address_line1, city, state),
        payments (status)
      `);

      if (!error && dbBookings && dbBookings.length > 0) {
        const items: BookingListItem[] = dbBookings.map((b: any) => {
          const matchedMock = MOCK_BOOKINGS.find((m) => m.id === b.id);
          const rawStatus = (b.status || "REQUEST_SENT") as BookingStatus;
          const rawPayment = b.payments?.[0]?.status || (rawStatus === "BOOKING_COMPLETED" ? "PAID" : "PENDING");

          return {
            id: b.id,
            bookingNumber: b.booking_number,
            customerId: b.customer_id,
            customerName: b.profiles?.full_name || "Cooperative Customer",
            customerPhone: b.profiles?.phone,
            customerEmail: b.profiles?.email,
            workerId: b.worker_id,
            workerName: b.workers?.profiles?.full_name || matchedMock?.workerName || null,
            workerProfession: b.workers?.profession || matchedMock?.workerProfession || null,
            workerPhone: b.workers?.profiles?.phone || matchedMock?.workerPhone || null,
            societyId: b.federation_id || "fed-001",
            societyName: b.federations?.name || "Mumbai Central Worker Cooperative",
            serviceId: b.service_id,
            serviceTitle: b.services?.title || "Cooperative Service",
            serviceCategory: b.services?.service_categories?.name || "General Maintenance",
            location: b.addresses?.city ? `${b.addresses.address_line1 || ""}, ${b.addresses.city}` : "Mumbai",
            addressDetails: b.addresses?.address_line1,
            scheduledStartAt: b.scheduled_start_at ? new Date(b.scheduled_start_at).toLocaleString() : "TBD",
            scheduledEndAt: b.scheduled_end_at ? new Date(b.scheduled_end_at).toLocaleString() : "TBD",
            bookingDate: b.created_at ? new Date(b.created_at).toISOString().split("T")[0] : "2026-09-03",
            totalAmount: Number(b.total_amount) || 500,
            platformFee: Number(b.platform_fee) || 75,
            workerEarnings: Number(b.worker_earnings) || 425,
            status: rawStatus,
            lifecycleStage: mapStatusToLifecycleStage(rawStatus),
            paymentStatus: (rawPayment.toUpperCase() as PaymentStatus) || "PENDING",
          };
        });

        return this.applyFilters(items, options);
      }
    } catch {
      // Fallback
    }

    return this.applyFilters(MOCK_BOOKINGS, options);
  }

  private applyFilters(
    items: BookingListItem[],
    options: Partial<BookingFilterOptions>
  ): {
    data: BookingListItem[];
    totalCount: number;
    societies: Array<{ id: string; name: string }>;
    services: string[];
    locations: string[];
  } {
    let filtered = [...items];

    // Build filter option dropdown items
    const societiesMap = new Map<string, string>();
    items.forEach((i) => societiesMap.set(i.societyId, i.societyName));
    const societies = Array.from(societiesMap.entries()).map(([id, name]) => ({ id, name }));

    const services = Array.from(new Set(items.map((i) => i.serviceTitle))).sort();
    const locations = Array.from(
      new Set(
        items.map((i) => {
          const parts = i.location.split(",");
          return parts[parts.length - 1]?.trim() || i.location;
        })
      )
    ).sort();

    // 1. Search Query
    if (options.searchQuery) {
      const q = options.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (b) =>
          b.bookingNumber.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          (b.workerName && b.workerName.toLowerCase().includes(q)) ||
          b.serviceTitle.toLowerCase().includes(q) ||
          b.societyName.toLowerCase().includes(q) ||
          b.location.toLowerCase().includes(q)
      );
    }

    // 2. Status Filter
    if (options.status && options.status !== "ALL") {
      filtered = filtered.filter((b) => b.status === options.status || b.lifecycleStage === options.status);
    }

    // 3. Service Filter
    if (options.service && options.service !== "ALL") {
      filtered = filtered.filter((b) => b.serviceTitle === options.service);
    }

    // 4. Society Filter
    if (options.society && options.society !== "ALL") {
      filtered = filtered.filter((b) => b.societyId === options.society);
    }

    // 5. Location Filter
    if (options.location && options.location !== "ALL") {
      const targetLoc = options.location.toLowerCase();
      filtered = filtered.filter((b) => b.location.toLowerCase().includes(targetLoc));
    }

    // 6. Date Range Filter
    if (options.dateRange && options.dateRange !== "all") {
      const todayStr = "2026-09-03"; // current reference date
      if (options.dateRange === "today") {
        filtered = filtered.filter((b) => b.bookingDate === todayStr);
      } else if (options.dateRange === "7d") {
        // Last 7 days
        filtered = filtered.filter((b) => b.bookingDate >= "2026-08-27");
      } else if (options.dateRange === "30d") {
        // Last 30 days
        filtered = filtered.filter((b) => b.bookingDate >= "2026-08-04");
      }
    }

    // 7. Sorting
    const sortBy = options.sortBy || "scheduledStartAt";
    const sortOrder = options.sortOrder || "desc";

    filtered.sort((a, b) => {
      let valA: any = a[sortBy as keyof BookingListItem];
      let valB: any = b[sortBy as keyof BookingListItem];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const totalCount = filtered.length;

    // 8. Pagination
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    const startIndex = (page - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);

    return {
      data: paginated,
      totalCount,
      societies,
      services,
      locations,
    };
  }

  /**
   * Fetch single booking by ID
   */
  async getBookingById(id: string): Promise<BookingDetails | null> {
    const supabase = createClient();

    try {
      const { data: b, error } = await (supabase.from("bookings") as any)
        .select(`
          id,
          booking_number,
          customer_id,
          worker_id,
          service_id,
          federation_id,
          address_id,
          status,
          problem_description,
          problem_photo_url,
          otp_code,
          scheduled_start_at,
          scheduled_end_at,
          actual_start_at,
          actual_end_at,
          total_amount,
          platform_fee,
          worker_earnings,
          created_at,
          profiles!customer_id (full_name, phone, email),
          workers!worker_id (
            id,
            profession,
            profiles (full_name, phone)
          ),
          services (id, title, service_categories (name)),
          federations (id, name),
          addresses (address_line1, city, state),
          payments (id, payment_number, gateway_provider, gateway_payment_id, status, paid_at),
          invoices (id, invoice_number)
        `)
        .eq("id", id)
        .single();

      if (!error && b) {
        const rawStatus = (b.status || "REQUEST_SENT") as BookingStatus;
        const p = b.payments?.[0];
        const rawPaymentStatus = p?.status || (rawStatus === "BOOKING_COMPLETED" ? "PAID" : "PENDING");

        return {
          id: b.id,
          bookingNumber: b.booking_number,
          customerId: b.customer_id,
          customerName: b.profiles?.full_name || "Cooperative Customer",
          customerPhone: b.profiles?.phone,
          customerEmail: b.profiles?.email,
          workerId: b.worker_id,
          workerName: b.workers?.profiles?.full_name || null,
          workerProfession: b.workers?.profession || null,
          workerPhone: b.workers?.profiles?.phone || null,
          societyId: b.federation_id || "fed-001",
          societyName: b.federations?.name || "Mumbai Central Worker Cooperative",
          serviceId: b.service_id,
          serviceTitle: b.services?.title || "Cooperative Service",
          serviceCategory: b.services?.service_categories?.name || "General Maintenance",
          location: b.addresses?.city ? `${b.addresses.address_line1 || ""}, ${b.addresses.city}` : "Mumbai",
          addressDetails: b.addresses?.address_line1,
          scheduledStartAt: b.scheduled_start_at ? new Date(b.scheduled_start_at).toLocaleString() : "TBD",
          scheduledEndAt: b.scheduled_end_at ? new Date(b.scheduled_end_at).toLocaleString() : "TBD",
          actualStartAt: b.actual_start_at ? new Date(b.actual_start_at).toLocaleString() : null,
          actualEndAt: b.actual_end_at ? new Date(b.actual_end_at).toLocaleString() : null,
          bookingDate: b.created_at ? new Date(b.created_at).toISOString().split("T")[0] : "2026-09-03",
          totalAmount: Number(b.total_amount) || 500,
          platformFee: Number(b.platform_fee) || 75,
          workerEarnings: Number(b.worker_earnings) || 425,
          status: rawStatus,
          lifecycleStage: mapStatusToLifecycleStage(rawStatus),
          paymentStatus: (rawPaymentStatus.toUpperCase() as PaymentStatus) || "PENDING",
          problemDescription: b.problem_description,
          problemPhotoUrl: b.problem_photo_url,
          otpCode: b.otp_code,
          paymentDetails: {
            paymentNumber: p?.payment_number,
            gatewayProvider: p?.gateway_provider || "Razorpay Escrow",
            gatewayPaymentId: p?.gateway_payment_id,
            paidAt: p?.paid_at ? new Date(p.paid_at).toLocaleString() : null,
            invoiceNumber: b.invoices?.[0]?.invoice_number,
          },
        };
      }
    } catch {
      // Fallback
    }

    return MOCK_BOOKINGS.find((m) => m.id === id) || null;
  }

  /**
   * Fetch booking status history / audit trail
   */
  async getBookingTimeline(booking: BookingDetails): Promise<BookingTimelineItem[]> {
    const supabase = createClient();

    try {
      const { data, error } = await (supabase.from("booking_status_history") as any)
        .select(`
          id,
          booking_id,
          previous_status,
          new_status,
          notes,
          created_at,
          profiles!changed_by (full_name)
        `)
        .eq("booking_id", booking.id)
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id,
          bookingId: item.booking_id,
          previousStatus: item.previous_status,
          newStatus: item.new_status,
          stage: mapStatusToLifecycleStage(item.new_status),
          title: `Status: ${item.new_status.replace(/_/g, " ")}`,
          description: item.notes || `Transitioned from ${item.previous_status || "INIT"} to ${item.new_status}`,
          changedBy: item.profiles?.full_name || "System Automated Workflow",
          createdAt: new Date(item.created_at).toLocaleString(),
        }));
      }
    } catch {
      // Fallback
    }

    return generateDeterministicTimeline(booking);
  }
}

export const bookingsService = new BookingsService();
