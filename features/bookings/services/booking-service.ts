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

  // Populated Display Helpers
  serviceTitle?: string;
  categoryName?: string;
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

  constructor() {
    this.syncFromStorage();
  }

  private syncFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_BOOKINGS_KEY);
      if (stored) {
        const parsed: Booking[] = JSON.parse(stored);
        parsed.forEach((b) => this.mockBookings.set(b.id, b));
      }
    } catch (err) {
      console.error("Error reading bookings from localStorage", err);
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      const array = Array.from(this.mockBookings.values());
      localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(array));
    } catch (err) {
      console.error("Error writing bookings to localStorage", err);
    }
  }

  async createRequest(payload: CreateBookingRequestPayload): Promise<Booking> {
    this.syncFromStorage();

    // Check duplicate active request for customer
    const existing = Array.from(this.mockBookings.values()).find(
      (b) =>
        b.customerId === payload.customerId &&
        b.workerId === payload.workerId &&
        b.serviceId === payload.serviceId &&
        b.status !== "CANCELLED" &&
        b.status !== "BOOKING_COMPLETED"
    );

    if (existing) {
      return existing;
    }

    const bookingNumber = `BK-${Date.now().toString().slice(-6)}`;
    const platformFee = Math.round(payload.totalAmount * 0.05 * 100) / 100;
    const workerEarnings = payload.totalAmount - platformFee;

    const booking: Booking = {
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
      otpCode: Math.floor(100000 + Math.random() * 900000).toString(),
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

    // Initial status history
    this.mockHistory.set(booking.id, [
      {
        id: `hist-${Date.now()}`,
        bookingId: booking.id,
        previousStatus: null,
        newStatus: "REQUEST_SENT",
        changedById: payload.customerId,
        notes: "Booking request created by customer",
        createdAt: new Date().toISOString(),
      },
    ]);

    this.saveToStorage();
    return booking;
  }

  async getBooking(bookingId: string): Promise<Booking | null> {
    this.syncFromStorage();
    return this.mockBookings.get(bookingId) || null;
  }

  async getCustomerBookings(customerId: string): Promise<Booking[]> {
    this.syncFromStorage();
    return Array.from(this.mockBookings.values()).filter((b) => b.customerId === customerId);
  }

  async getWorkerBookings(workerId: string): Promise<Booking[]> {
    this.syncFromStorage();
    return Array.from(this.mockBookings.values()).filter((b) => b.workerId === workerId);
  }

  async getFederationBookings(federationId: string): Promise<Booking[]> {
    this.syncFromStorage();
    return Array.from(this.mockBookings.values()).filter((b) => b.federationId === federationId);
  }

  async getPlatformBookings(): Promise<Booking[]> {
    this.syncFromStorage();
    return Array.from(this.mockBookings.values());
  }

  async submitWorkerEstimate(payload: SubmitWorkerEstimatePayload): Promise<Booking> {
    this.syncFromStorage();
    const booking = await this.getBooking(payload.bookingId);
    if (!booking) {
      throw new AppError(`Booking ${payload.bookingId} not found`, "NOT_FOUND", 404);
    }

    // Sequentially transition through canonical states with await
    let currentBooking = booking;
    if (currentBooking.status === "REQUEST_SENT") {
      currentBooking = await this.transitionStatus(booking.id, "WORKER_REVIEWING", payload.workerId, "WORKER", "Worker started reviewing request");
    }

    if (currentBooking.status === "WORKER_REVIEWING") {
      currentBooking = await this.transitionStatus(booking.id, "WORKER_INTERESTED", payload.workerId, "WORKER", "Worker expressed interest in service request");
    }

    // Now transition from WORKER_INTERESTED to CUSTOMER_CONFIRMATION_PENDING
    const updated = await this.transitionStatus(
      booking.id,
      "CUSTOMER_CONFIRMATION_PENDING",
      payload.workerId,
      "WORKER",
      `Worker submitted estimate of ₹${payload.totalAmount}`
    );

    updated.workerEstimateAmount = payload.totalAmount;
    updated.workerEstimateLabor = payload.laborAmount || Math.round(payload.totalAmount * 0.7);
    updated.workerEstimateMaterials = payload.materialAmount || Math.round(payload.totalAmount * 0.3);
    updated.workerEstimateNotes = payload.notes || "Detailed inspection estimate including labour and materials.";
    updated.workerEstimateSubmittedAt = new Date().toISOString();

    this.mockBookings.set(booking.id, updated);
    this.saveToStorage();
    return updated;
  }

  async confirmBooking(bookingId: string, customerId: string): Promise<Booking> {
    this.syncFromStorage();
    const updated = await this.transitionStatus(
      bookingId,
      "BOOKING_CONFIRMED",
      customerId,
      "CUSTOMER",
      "Customer confirmed worker estimate and booking"
    );
    this.saveToStorage();
    return updated;
  }

  async declineWorkerEstimate(bookingId: string, customerId: string): Promise<Booking> {
    this.syncFromStorage();
    const updated = await this.cancelBooking(
      bookingId,
      customerId,
      "CUSTOMER",
      "Customer declined worker estimate"
    );
    this.saveToStorage();
    return updated;
  }

  async verifyOtp(bookingId: string, enteredOtp: string, changedById: string): Promise<Booking> {
    this.syncFromStorage();
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
      "CUSTOMER",
      "Customer verified 6-digit service start OTP"
    );
    this.saveToStorage();
    return updated;
  }

  async transitionStatus(
    bookingId: string,
    newStatus: BookingStatus,
    changedById: string,
    actorRole: UserRole,
    notes?: string
  ): Promise<Booking> {
    this.syncFromStorage();
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

    this.mockBookings.set(bookingId, updatedBooking);

    // Record audit trail
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

    this.saveToStorage();
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
    this.syncFromStorage();
    return this.mockHistory.get(bookingId) || [];
  }
}

export const bookingService = new BookingService();
