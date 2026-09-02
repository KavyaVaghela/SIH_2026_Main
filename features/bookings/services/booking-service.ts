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
  totalAmount: number;
  platformFee: number;
  workerEarnings: number;
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
  serviceId: string;
  federationId: string;
  addressId: string;
  problemDescription?: string;
  problemPhotoUrl?: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  totalAmount: number;
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
  cancelBooking(bookingId: string, cancelledById: string, actorRole: UserRole, reason?: string): Promise<Booking>;
  getStatusHistory(bookingId: string): Promise<BookingStatusHistory[]>;
}

export class BookingService implements IBookingService {
  private mockBookings: Map<string, Booking> = new Map();
  private mockHistory: Map<string, BookingStatusHistory[]> = new Map();

  constructor() {
    // Seed initial mock booking
    const defaultBooking: Booking = {
      id: "bk-1001",
      bookingNumber: "BK-902142",
      customerId: "cust-1",
      workerId: "w-1",
      serviceId: "srv-1",
      federationId: "fed-1",
      addressId: "addr-1",
      status: "REQUEST_SENT",
      scheduledStartAt: new Date().toISOString(),
      scheduledEndAt: new Date(Date.now() + 7200000).toISOString(),
      totalAmount: 350,
      platformFee: 17.5,
      workerEarnings: 332.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.mockBookings.set(defaultBooking.id, defaultBooking);
  }

  async createRequest(payload: CreateBookingRequestPayload): Promise<Booking> {
    const bookingNumber = `BK-${Date.now().toString().slice(-6)}`;
    const platformFee = Math.round(payload.totalAmount * 0.05 * 100) / 100;
    const workerEarnings = payload.totalAmount - platformFee;

    const booking: Booking = {
      id: `bk-${Date.now()}`,
      bookingNumber,
      customerId: payload.customerId,
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

    return booking;
  }

  async getBooking(bookingId: string): Promise<Booking | null> {
    return this.mockBookings.get(bookingId) || null;
  }

  async getCustomerBookings(customerId: string): Promise<Booking[]> {
    return Array.from(this.mockBookings.values()).filter((b) => b.customerId === customerId);
  }

  async getWorkerBookings(workerId: string): Promise<Booking[]> {
    return Array.from(this.mockBookings.values()).filter((b) => b.workerId === workerId);
  }

  async getFederationBookings(federationId: string): Promise<Booking[]> {
    return Array.from(this.mockBookings.values()).filter((b) => b.federationId === federationId);
  }

  async getPlatformBookings(): Promise<Booking[]> {
    return Array.from(this.mockBookings.values());
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
    return this.mockHistory.get(bookingId) || [];
  }
}

export const bookingService = new BookingService();
