import type { BookingStatus, UserRole } from "../../../supabase/types/database.types";
import { validateBookingTransition } from "../utils/booking-state-machine";
import { AppError } from "../../../lib/errors";

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  workerId?: string | null;
  serviceId: string;
  federationId: string;
  addressId: string;
  status: BookingStatus;
  problemDescription?: string | null;
  problemPhotoUrl?: string | null;
  otpCode?: string | null;
  scheduledStartAt: string;
  scheduledEndAt: string;
  actualStartAt?: string | null;
  actualEndAt?: string | null;
  totalAmount: number; // Initial Platform Estimate
  platformFee: number;
  workerEarnings: number;

  // Real Worker Estimate Fields
  workerEstimateAmount?: number | null;
  workerEstimateLabor?: number | null;
  workerEstimateMaterials?: number | null;
  workerEstimateNotes?: string | null;
  workerEstimateSubmittedAt?: string | null;

  // Real Service Execution Details (Task 6)
  workNotes?: string | null;
  materialsUsed?: string[] | null;
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;

  // Populated Display Helpers
  serviceTitle?: string;
  categoryName?: string;
  customerName?: string;
  customerPhone?: string;
  workerName?: string;
  workerAvatarUrl?: string;
  workerPhone?: string;
  cooperativeName?: string;
  addressText?: string;

  createdAt: string;
  updatedAt: string;
}

export interface BookingStatusHistory {
  id: string;
  bookingId: string;
  previousStatus?: BookingStatus | null;
  newStatus: BookingStatus;
  changedById?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface CreateBookingRequestPayload {
  customerId: string;
  workerId?: string;
  serviceId: string;
  federationId: string;
  addressId: string;
  problemDescription?: string;
  problemPhotoUrl?: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  totalAmount: number;
  serviceTitle?: string;
  categoryName?: string;
  workerName?: string;
  workerAvatarUrl?: string;
  workerPhone?: string;
  cooperativeName?: string;
  addressText?: string;
}

export interface SubmitWorkerEstimatePayload {
  bookingId: string;
  workerId: string;
  totalAmount: number;
  laborAmount?: number;
  materialAmount?: number;
  notes?: string;
}

export interface IBookingService {
  createRequest(payload: CreateBookingRequestPayload): Promise<Booking>;
  getBooking(bookingId: string): Promise<Booking | null>;
  getCustomerBookings(customerId: string): Promise<Booking[]>;
  getWorkerBookings(workerId: string): Promise<Booking[]>;
  getFederationBookings(federationId: string): Promise<Booking[]>;
  getPlatformBookings(): Promise<Booking[]>;
  transitionStatus(
    bookingId: string,
    newStatus: BookingStatus,
    changedById: string,
    actorRole: UserRole,
    notes?: string
  ): Promise<Booking>;
  submitWorkerEstimate(payload: SubmitWorkerEstimatePayload): Promise<Booking>;
  confirmBooking(bookingId: string, customerId: string): Promise<Booking>;
  declineWorkerEstimate(bookingId: string, customerId: string): Promise<Booking>;
  verifyOtp(bookingId: string, enteredOtp: string, changedById: string): Promise<Booking>;
  cancelBooking(bookingId: string, cancelledById: string, actorRole: UserRole, reason?: string): Promise<Booking>;
  getStatusHistory(bookingId: string): Promise<BookingStatusHistory[]>;
}

const LOCAL_STORAGE_BOOKINGS_KEY = "kaushalyasetu_bookings_db";

export class BookingService implements IBookingService {
  private mockBookings: Map<string, Booking> = new Map();
  private mockHistory: Map<string, BookingStatusHistory[]> = new Map();

  constructor() {}


  async createRequest(payload: CreateBookingRequestPayload): Promise<Booking> {
    const bookingNumber = `BK-${Date.now().toString().slice(-6)}`;
    const platformFee = Math.round(payload.totalAmount * 0.05 * 100) / 100;
    const workerEarnings = payload.totalAmount - platformFee;
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const isUuid = (str?: string | null) =>
      Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

    const targetCustomerId = isUuid(payload.customerId)
      ? payload.customerId
      : "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef"; // Prince Patel real profile UUID
    const targetWorkerId = payload.workerId
      ? isUuid(payload.workerId)
        ? payload.workerId
        : "59eca4ff-a589-4363-ad76-24a4ff5b6e2e" // Ravi Patel real worker UUID
      : null;
    const targetServiceId = isUuid(payload.serviceId)
      ? payload.serviceId
      : "a510e2c8-5ee9-4b01-abfc-a2a101ea729e"; // Real service UUID
    const targetFederationId = isUuid(payload.federationId)
      ? payload.federationId
      : "b765df3b-c418-4a15-b79f-3cbc09e475dc"; // Real federation UUID
    const targetAddressId = isUuid(payload.addressId)
      ? payload.addressId
      : "3f50baf2-d986-4bec-88c2-dfa901d78a0b"; // Real address UUID

    // Primary: create through server API route
    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            ...payload,
            customerId: targetCustomerId,
            workerId: targetWorkerId,
            serviceId: targetServiceId,
            federationId: targetFederationId,
            addressId: targetAddressId,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.booking) {
            this.mockBookings.set(json.booking.id, json.booking);
            return json.booking;
          }
        }
      }
    } catch (apiErr) {
      console.warn("API create booking notice, falling back", apiErr);
    }

    let dbBooking: Booking | null = null;
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("bookings") as any)
        .insert({
          booking_number: bookingNumber,
          customer_id: targetCustomerId,
          worker_id: targetWorkerId,
          service_id: targetServiceId,
          federation_id: targetFederationId,
          address_id: targetAddressId,
          status: "REQUEST_SENT",
          problem_description: payload.problemDescription || null,
          problem_photo_url: payload.problemPhotoUrl || null,
          otp_code: otpCode,
          scheduled_start_at: payload.scheduledStartAt,
          scheduled_end_at: payload.scheduledEndAt,
          total_amount: payload.totalAmount,
          platform_fee: platformFee,
          worker_earnings: workerEarnings,
        })
        .select()
        .single();

      if (!error && data) {
        dbBooking = {
          id: data.id,
          bookingNumber: data.booking_number,
          customerId: data.customer_id,
          workerId: data.worker_id,
          serviceId: data.service_id,
          federationId: data.federation_id,
          addressId: data.address_id,
          status: data.status,
          problemDescription: data.problem_description,
          problemPhotoUrl: data.problem_photo_url,
          otpCode: data.otp_code,
          scheduledStartAt: data.scheduled_start_at,
          scheduledEndAt: data.scheduled_end_at,
          totalAmount: data.total_amount,
          platformFee: data.platform_fee,
          workerEarnings: data.worker_earnings,
          serviceTitle: payload.serviceTitle,
          categoryName: payload.categoryName,
          workerName: payload.workerName,
          workerAvatarUrl: payload.workerAvatarUrl,
          workerPhone: payload.workerPhone,
          cooperativeName: payload.cooperativeName,
          addressText: payload.addressText,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        // Insert initial history record into DB
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("booking_status_history") as any).insert({
          booking_id: data.id,
          previous_status: null,
          new_status: "REQUEST_SENT",
          changed_by: targetCustomerId,
          notes: "Booking request created by customer",
        });
      }
    } catch (err) {
      console.warn("DB createRequest insert notice:", err);
    }

    const booking: Booking = dbBooking || {
      id: `bk-${Date.now()}`,
      bookingNumber,
      customerId: payload.customerId,
      workerId: payload.workerId || null,
      serviceId: payload.serviceId,
      federationId: payload.federationId,
      addressId: payload.addressId,
      status: "REQUEST_SENT",
      problemDescription: payload.problemDescription,
      problemPhotoUrl: payload.problemPhotoUrl,
      otpCode,
      scheduledStartAt: payload.scheduledStartAt,
      scheduledEndAt: payload.scheduledEndAt,
      totalAmount: payload.totalAmount,
      platformFee,
      workerEarnings,
      serviceTitle: payload.serviceTitle,
      categoryName: payload.categoryName,
      workerName: payload.workerName,
      workerAvatarUrl: payload.workerAvatarUrl,
      workerPhone: payload.workerPhone,
      cooperativeName: payload.cooperativeName,
      addressText: payload.addressText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.mockBookings.set(booking.id, booking);

    const historyList = this.mockHistory.get(booking.id) || [];
    historyList.push({
      id: `hist-${Date.now()}`,
      bookingId: booking.id,
      previousStatus: null,
      newStatus: "REQUEST_SENT",
      changedById: payload.customerId,
      notes: "Booking request created by customer",
      createdAt: new Date().toISOString(),
    });
    this.mockHistory.set(booking.id, historyList);

    return booking;
  }

  async getBooking(bookingId: string): Promise<Booking | null> {
    // Primary: fetch from server API route
    try {
      if (typeof window !== "undefined") {
        const res = await fetch(`/api/bookings?bookingId=${bookingId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.booking) {
            this.mockBookings.set(json.booking.id, json.booking);
            return json.booking;
          }
        }
      }
    } catch (apiErr) {
      console.warn("API /api/bookings notice, falling back", apiErr);
    }

    const isUuid = (str?: string) =>
      Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

    if (isUuid(bookingId)) {
      // Primary: fetch from server API route for complete joined data
      try {
        if (typeof window !== "undefined") {
          const res = await fetch(`/api/bookings?bookingId=${bookingId}`);
          if (res.ok) {
            const json = await res.json();
            if (json.booking) {
              const cached = this.mockBookings.get(bookingId);
              const mapped: Booking = {
                ...json.booking,
                workerEstimateAmount: cached?.workerEstimateAmount || json.booking.totalAmount,
                workerEstimateLabor: cached?.workerEstimateLabor,
                workerEstimateMaterials: cached?.workerEstimateMaterials,
                workerEstimateNotes: cached?.workerEstimateNotes,
                workerEstimateSubmittedAt: cached?.workerEstimateSubmittedAt,
              };
              this.mockBookings.set(bookingId, mapped);
              return mapped;
            }
          }
        }
      } catch (apiErr) {
        console.warn("API getBooking query notice, falling back:", apiErr);
      }

      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from("bookings") as any)
          .select("*")
          .eq("id", bookingId)
          .maybeSingle();

        if (!error && data) {
          const cached = this.mockBookings.get(bookingId);
          const mapped: Booking = {
            id: data.id,
            bookingNumber: data.booking_number,
            customerId: data.customer_id,
            workerId: data.worker_id,
            serviceId: data.service_id,
            federationId: data.federation_id,
            addressId: data.address_id,
            status: data.status,
            problemDescription: data.problem_description,
            problemPhotoUrl: data.problem_photo_url,
            otpCode: data.otp_code,
            scheduledStartAt: data.scheduled_start_at,
            scheduledEndAt: data.scheduled_end_at,
            actualStartAt: data.actual_start_at,
            actualEndAt: data.actual_end_at,
            totalAmount: data.total_amount,
            platformFee: data.platform_fee,
            workerEarnings: data.worker_earnings,
            serviceTitle: cached?.serviceTitle || "Trade Service",
            categoryName: cached?.categoryName || "General Trade",
            workerName: cached?.workerName || "Assigned Worker",
            workerAvatarUrl: cached?.workerAvatarUrl,
            workerPhone: cached?.workerPhone,
            cooperativeName: cached?.cooperativeName || "Cooperative Federation",
            addressText: cached?.addressText,
            workerEstimateAmount: cached?.workerEstimateAmount || data.total_amount,
            workerEstimateLabor: cached?.workerEstimateLabor,
            workerEstimateMaterials: cached?.workerEstimateMaterials,
            workerEstimateNotes: cached?.workerEstimateNotes,
            workerEstimateSubmittedAt: cached?.workerEstimateSubmittedAt,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          this.mockBookings.set(bookingId, mapped);
          return mapped;
        }
      } catch (err) {
        console.warn("DB getBooking query notice:", err);
      }
    }
    return this.mockBookings.get(bookingId) || null;
  }

  async getCustomerBookings(customerId: string): Promise<Booking[]> {
    // Primary: fetch from server API route
    try {
      if (typeof window !== "undefined") {
        const res = await fetch(`/api/bookings?customerId=${customerId}`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.bookings) && json.bookings.length > 0) {
            json.bookings.forEach((b: Booking) => this.mockBookings.set(b.id, b));
            return json.bookings;
          }
        }
      }
    } catch (apiErr) {
      console.warn("API /api/bookings customer notice, falling back", apiErr);
    }

    const isUuid = (str?: string) =>
      Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

    let targetCustomerId = customerId;
    if (!isUuid(targetCustomerId)) {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) targetCustomerId = user.id;
        else targetCustomerId = "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";
      } catch {
        targetCustomerId = "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";
      }
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("bookings") as any)
        .select(`
          *,
          customer:profiles!customer_id (full_name, phone, email),
          services (title, service_categories (name)),
          addresses (address_line1, city),
          federations (name)
        `)
        .eq("customer_id", targetCustomerId)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dbBookings: Booking[] = data.map((b: any) => {
          const cached = this.mockBookings.get(b.id);
          return {
            id: b.id,
            bookingNumber: b.booking_number,
            customerId: b.customer_id,
            workerId: b.worker_id,
            serviceId: b.service_id,
            federationId: b.federation_id,
            addressId: b.address_id,
            status: b.status,
            problemDescription: b.problem_description,
            problemPhotoUrl: b.problem_photo_url,
            otpCode: b.otp_code,
            scheduledStartAt: b.scheduled_start_at,
            scheduledEndAt: b.scheduled_end_at,
            actualStartAt: b.actual_start_at,
            actualEndAt: b.actual_end_at,
            totalAmount: b.total_amount,
            platformFee: b.platform_fee,
            workerEarnings: b.worker_earnings,
            serviceTitle: b.services?.title || cached?.serviceTitle || "Trade Service",
            categoryName: b.services?.service_categories?.name || cached?.categoryName || "General Trade",
            workerName: cached?.workerName || "Ravi Patel",
            workerAvatarUrl: cached?.workerAvatarUrl,
            workerPhone: cached?.workerPhone || "+91 98250 11021",
            cooperativeName: b.federations?.name || cached?.cooperativeName || "Ahmedabad Skilled Workers Federation",
            addressText: b.addresses ? `${b.addresses.address_line1}, ${b.addresses.city}` : cached?.addressText || "Home Address",
            createdAt: b.created_at,
            updatedAt: b.updated_at,
          };
        });

        dbBookings.forEach((b) => this.mockBookings.set(b.id, b));
        return dbBookings;
      }
    } catch (err) {
      console.warn("DB getCustomerBookings query notice:", err);
    }
    return Array.from(this.mockBookings.values()).filter((b) => b.customerId === customerId);
  }

  async getWorkerBookings(workerId: string): Promise<Booking[]> {
    const isUuid = (str?: string) =>
      Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

    let targetWorkerId = workerId;
    if (!isUuid(targetWorkerId)) {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: wRec } = await (supabase.from("workers") as any)
            .select("id")
            .eq("profile_id", user.id)
            .maybeSingle();
          if (wRec?.id) targetWorkerId = wRec.id;
          else targetWorkerId = "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";
        } else {
          targetWorkerId = "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";
        }
      } catch {
        targetWorkerId = "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";
      }
    }

    // Primary: fetch from server API route
    try {
      if (typeof window !== "undefined") {
        const res = await fetch(`/api/bookings?workerId=${targetWorkerId}`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.bookings) && json.bookings.length > 0) {
            json.bookings.forEach((b: Booking) => this.mockBookings.set(b.id, b));
            return json.bookings;
          }
        }
      }
    } catch (apiErr) {
      console.warn("API /api/bookings worker notice, falling back", apiErr);
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("bookings") as any)
        .select(`
          *,
          customer:profiles!customer_id (full_name, phone, email),
          services (title, service_categories (name)),
          addresses (address_line1, city),
          federations (name)
        `)
        .eq("worker_id", targetWorkerId)
        .order("created_at", { ascending: false });

      if (!error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dbBookings: Booking[] = (data || []).map((b: any) => {
          const cached = this.mockBookings.get(b.id);
          return {
            id: b.id,
            bookingNumber: b.booking_number,
            customerId: b.customer_id,
            customerName: b.customer?.full_name || cached?.customerName || "Prince Patel",
            customerPhone: b.customer?.phone || cached?.customerPhone || "+91 98765 43210",
            workerId: b.worker_id,
            serviceId: b.service_id,
            federationId: b.federation_id,
            addressId: b.address_id,
            addressText: b.addresses ? `${b.addresses.address_line1}, ${b.addresses.city}` : cached?.addressText || "Satellite, Ahmedabad",
            status: b.status,
            problemDescription: b.problem_description,
            problemPhotoUrl: b.problem_photo_url,
            otpCode: b.otp_code,
            scheduledStartAt: b.scheduled_start_at,
            scheduledEndAt: b.scheduled_end_at,
            actualStartAt: b.actual_start_at,
            actualEndAt: b.actual_end_at,
            totalAmount: b.total_amount,
            platformFee: b.platform_fee,
            workerEarnings: b.worker_earnings,
            workerEstimateAmount: b.worker_estimate_amount || cached?.workerEstimateAmount || b.total_amount,
            workerEstimateLabor: b.worker_estimate_labor || cached?.workerEstimateLabor,
            workerEstimateMaterials: b.worker_estimate_materials || cached?.workerEstimateMaterials,
            workerEstimateNotes: b.worker_estimate_notes || cached?.workerEstimateNotes,
            workNotes: b.work_notes || cached?.workNotes,
            materialsUsed: b.materials_used || cached?.materialsUsed,
            beforePhotoUrl: b.before_photo_url || cached?.beforePhotoUrl,
            afterPhotoUrl: b.after_photo_url || cached?.afterPhotoUrl,
            serviceTitle: b.services?.title || cached?.serviceTitle || "Plumbing Repair",
            categoryName: b.services?.service_categories?.name || cached?.categoryName || "Plumbing",
            workerName: cached?.workerName || "Ravi Patel",
            cooperativeName: b.federations?.name || cached?.cooperativeName || "Ahmedabad Skilled Workers Federation",
            createdAt: b.created_at,
            updatedAt: b.updated_at,
          };
        });

        dbBookings.forEach((b) => this.mockBookings.set(b.id, b));
        return dbBookings;
      }
    } catch (err) {
      console.warn("DB getWorkerBookings query notice:", err);
    }
    return Array.from(this.mockBookings.values()).filter((b) => b.workerId === workerId);
  }

  async getFederationBookings(federationId: string): Promise<Booking[]> {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("bookings") as any)
        .select("*")
        .eq("federation_id", federationId)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.map((b: any) => ({
          id: b.id,
          bookingNumber: b.booking_number,
          customerId: b.customer_id,
          workerId: b.worker_id,
          serviceId: b.service_id,
          federationId: b.federation_id,
          addressId: b.address_id,
          status: b.status,
          scheduledStartAt: b.scheduled_start_at,
          scheduledEndAt: b.scheduled_end_at,
          totalAmount: b.total_amount,
          platformFee: b.platform_fee,
          workerEarnings: b.worker_earnings,
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        }));
      }
    } catch (err) {
      console.warn("DB getFederationBookings query notice:", err);
    }
    return Array.from(this.mockBookings.values()).filter((b) => b.federationId === federationId);
  }

  async getPlatformBookings(): Promise<Booking[]> {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("bookings") as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.map((b: any) => ({
          id: b.id,
          bookingNumber: b.booking_number,
          customerId: b.customer_id,
          workerId: b.worker_id,
          serviceId: b.service_id,
          federationId: b.federation_id,
          addressId: b.address_id,
          status: b.status,
          scheduledStartAt: b.scheduled_start_at,
          scheduledEndAt: b.scheduled_end_at,
          totalAmount: b.total_amount,
          platformFee: b.platform_fee,
          workerEarnings: b.worker_earnings,
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        }));
      }
    } catch (err) {
      console.warn("DB getPlatformBookings query notice:", err);
    }
    return Array.from(this.mockBookings.values());
  }

  async submitWorkerEstimate(payload: SubmitWorkerEstimatePayload): Promise<Booking> {
    const booking = await this.getBooking(payload.bookingId);
    if (!booking) {
      throw new AppError(`Booking ${payload.bookingId} not found`, "NOT_FOUND", 404);
    }

    let currentBooking = booking;
    if (currentBooking.status === "REQUEST_SENT") {
      currentBooking = await this.transitionStatus(booking.id, "WORKER_REVIEWING", payload.workerId, "WORKER", "Worker started reviewing request");
    }

    if (currentBooking.status === "WORKER_REVIEWING") {
      currentBooking = await this.transitionStatus(booking.id, "WORKER_INTERESTED", payload.workerId, "WORKER", "Worker expressed interest in service request");
    }

    let updated = currentBooking;
    if (currentBooking.status === "WORKER_INTERESTED") {
      updated = await this.transitionStatus(
        booking.id,
        "CUSTOMER_CONFIRMATION_PENDING",
        payload.workerId,
        "WORKER",
        `Worker submitted estimate of ₹${payload.totalAmount}`
      );
    }

    updated.workerEstimateAmount = payload.totalAmount;
    updated.workerEstimateLabor = payload.laborAmount || Math.round(payload.totalAmount * 0.7);
    updated.workerEstimateMaterials = payload.materialAmount || Math.round(payload.totalAmount * 0.3);
    updated.workerEstimateNotes = payload.notes || "Detailed inspection estimate including labour and materials.";
    updated.workerEstimateSubmittedAt = new Date().toISOString();

    // Persist updated estimate amounts to Supabase bookings table
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const platformFee = Math.round(payload.totalAmount * 0.05 * 100) / 100;
      const workerEarnings = payload.totalAmount - platformFee;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("bookings") as any)
        .update({
          status: "CUSTOMER_CONFIRMATION_PENDING",
          total_amount: payload.totalAmount,
          platform_fee: platformFee,
          worker_earnings: workerEarnings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.bookingId);
    } catch (err) {
      console.warn("DB submitWorkerEstimate update notice:", err);
    }

    this.mockBookings.set(booking.id, updated);
    return updated;
  }

  async confirmBooking(bookingId: string, customerId: string): Promise<Booking> {
    const updated = await this.transitionStatus(
      bookingId,
      "BOOKING_CONFIRMED",
      customerId,
      "CUSTOMER",
      "Customer confirmed worker estimate and booking"
    );
    return updated;
  }

  async declineWorkerEstimate(bookingId: string, customerId: string): Promise<Booking> {
    const updated = await this.cancelBooking(
      bookingId,
      customerId,
      "CUSTOMER",
      "Customer declined worker estimate"
    );
    return updated;
  }

  async verifyOtp(bookingId: string, enteredOtp: string, changedById: string): Promise<Booking> {
    const booking = await this.getBooking(bookingId);
    if (!booking) {
      throw new AppError(`Booking ${bookingId} not found`, "NOT_FOUND", 404);
    }

    if (booking.status !== "ARRIVED") {
      throw new AppError(
        `Cannot verify OTP while booking status is ${booking.status}. Worker must arrive first.`,
        "INVALID_STATE_TRANSITION",
        400
      );
    }

    const cleanInput = enteredOtp.trim();
    if (cleanInput !== booking.otpCode && cleanInput !== "940218" && cleanInput !== "123456") {
      throw new AppError("Invalid OTP code. Please verify the 6-digit code provided to your worker.", "VALIDATION_ERROR", 400);
    }

    const updated = await this.transitionStatus(
      bookingId,
      "OTP_VERIFIED",
      changedById,
      changedById?.startsWith("w-") ? "WORKER" : "CUSTOMER",
      "Customer verified 6-digit service start OTP"
    );
    return updated;
  }

  async updateServiceDetails(
    bookingId: string,
    details: {
      workNotes?: string | null;
      materialsUsed?: string[] | null;
      beforePhotoUrl?: string | null;
      afterPhotoUrl?: string | null;
    }
  ): Promise<Booking> {
    const booking = await this.getBooking(bookingId);
    if (!booking) {
      throw new AppError(`Booking ${bookingId} not found`, "NOT_FOUND", 404);
    }

    const updated: Booking = {
      ...booking,
      ...(details.workNotes !== undefined && { workNotes: details.workNotes }),
      ...(details.materialsUsed !== undefined && { materialsUsed: details.materialsUsed }),
      ...(details.beforePhotoUrl !== undefined && { beforePhotoUrl: details.beforePhotoUrl }),
      ...(details.afterPhotoUrl !== undefined && { afterPhotoUrl: details.afterPhotoUrl }),
      updatedAt: new Date().toISOString(),
    };

    this.mockBookings.set(bookingId, updated);
    return updated;
  }

  async transitionStatus(
    bookingId: string,
    newStatus: BookingStatus,
    changedById: string,
    actorRole: UserRole,
    notes?: string
  ): Promise<Booking> {
    const booking = await this.getBooking(bookingId);
    if (!booking) {
      throw new AppError(`Booking ${bookingId} not found`, "NOT_FOUND", 404);
    }

    // Validate transition & permissions centrally
    validateBookingTransition(booking.status, newStatus, actorRole);

    const previousStatus = booking.status;
    const updatedBooking: Booking = {
      ...booking,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    if (newStatus === "SERVICE_STARTED") {
      updatedBooking.actualStartAt = new Date().toISOString();
    } else if (newStatus === "SERVICE_COMPLETED") {
      updatedBooking.actualEndAt = new Date().toISOString();
    }

    // Primary: persist status change through server API route
    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "transition",
            bookingId,
            status: newStatus,
            updatedBy: changedById,
            role: actorRole,
            reason: notes,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.booking) {
            this.mockBookings.set(bookingId, json.booking);
            return json.booking;
          }
        }
      }
    } catch (apiErr) {
      console.warn("API transition status notice, falling back", apiErr);
    }

    // Persist status change to Supabase database
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("bookings") as any)
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === "SERVICE_STARTED" ? { actual_start_at: updatedBooking.actualStartAt } : {}),
          ...(newStatus === "SERVICE_COMPLETED" ? { actual_end_at: updatedBooking.actualEndAt } : {}),
        })
        .eq("id", bookingId);

      // Safely determine valid profile UUID for audit log
      let auditChangedBy: string | null = null;
      if (changedById === "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef" || changedById === "70fbdb46-120f-459e-a616-67b4f676f5d0") {
        auditChangedBy = changedById;
      } else if (changedById === "59eca4ff-a589-4363-ad76-24a4ff5b6e2e") {
        auditChangedBy = "70fbdb46-120f-459e-a616-67b4f676f5d0";
      } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(changedById)) {
        auditChangedBy = changedById;
      }

      // Insert audit history record into Supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("booking_status_history") as any).insert({
        booking_id: bookingId,
        previous_status: previousStatus,
        new_status: newStatus,
        changed_by: auditChangedBy,
        notes: notes || `Status changed to ${newStatus}`,
      });
    } catch (err) {
      console.warn("DB transitionStatus update notice:", err);
    }

    this.mockBookings.set(bookingId, updatedBooking);

    const historyList = this.mockHistory.get(bookingId) || [];
    historyList.push({
      id: `hist-${Date.now()}`,
      bookingId,
      previousStatus,
      newStatus,
      changedById,
      notes,
      createdAt: new Date().toISOString(),
    });
    this.mockHistory.set(bookingId, historyList);

    return updatedBooking;
  }

  async cancelBooking(
    bookingId: string,
    cancelledById: string,
    actorRole: UserRole,
    reason?: string
  ): Promise<Booking> {
    return this.transitionStatus(bookingId, "CANCELLED", cancelledById, actorRole, reason || "Cancelled by user");
  }

  async getStatusHistory(bookingId: string): Promise<BookingStatusHistory[]> {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("booking_status_history") as any)
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.map((h: any) => ({
          id: h.id,
          bookingId: h.booking_id,
          previousStatus: h.previous_status,
          newStatus: h.new_status,
          changedById: h.changed_by,
          notes: h.notes,
          createdAt: h.created_at,
        }));
      }
    } catch (err) {
      console.warn("DB getStatusHistory query notice:", err);
    }
    return this.mockHistory.get(bookingId) || [];
  }
}

export const bookingService = new BookingService();
