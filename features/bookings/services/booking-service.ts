import type { Booking, BookingStatus, BookingStatusHistory } from "@/types";

export interface CreateBookingRequestPayload {
  customerId: string;
  serviceId: string;
  federationId: string;
  addressId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
}

export interface IBookingService {
  createRequest(payload: CreateBookingRequestPayload): Promise<Booking>;
  getBooking(bookingId: string): Promise<Booking | null>;
  getCustomerBookings(customerId: string): Promise<Booking[]>;
  getWorkerBookings(workerId: string): Promise<Booking[]>;
  transitionStatus(
    bookingId: string,
    newStatus: BookingStatus,
    changedById: string,
    notes?: string
  ): Promise<Booking>;
  cancelBooking(bookingId: string, cancelledById: string, reason?: string): Promise<Booking>;
  getStatusHistory(bookingId: string): Promise<BookingStatusHistory[]>;
}

export class BookingService implements IBookingService {
  async createRequest(payload: CreateBookingRequestPayload): Promise<Booking> {
    const bookingNumber = `BK-${Date.now().toString().slice(-6)}`;
    return {
      id: `bk-${Date.now()}`,
      bookingNumber,
      customerId: payload.customerId,
      serviceId: payload.serviceId,
      federationId: payload.federationId,
      addressId: payload.addressId,
      status: "REQUEST_SENT",
      scheduledStartAt: payload.scheduledStartAt,
      scheduledEndAt: payload.scheduledEndAt,
      totalAmount: 350,
      platformFee: 17.5,
      workerEarnings: 332.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async getBooking(bookingId: string): Promise<Booking | null> {
    return {
      id: bookingId,
      bookingNumber: "BK-902142",
      customerId: "cust-1",
      workerId: "w-1",
      serviceId: "srv-1",
      federationId: "fed-1",
      addressId: "addr-1",
      status: "BOOKING_CONFIRMED",
      scheduledStartAt: new Date().toISOString(),
      scheduledEndAt: new Date(Date.now() + 7200000).toISOString(),
      totalAmount: 350,
      platformFee: 17.5,
      workerEarnings: 332.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async getCustomerBookings(customerId: string): Promise<Booking[]> {
    const booking = await this.getBooking("bk-1");
    return booking ? [{ ...booking, customerId }] : [];
  }

  async getWorkerBookings(workerId: string): Promise<Booking[]> {
    const booking = await this.getBooking("bk-1");
    return booking ? [{ ...booking, workerId }] : [];
  }

  async transitionStatus(
    bookingId: string,
    newStatus: BookingStatus,
    changedById: string,
    notes?: string
  ): Promise<Booking> {
    const booking = await this.getBooking(bookingId);
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    console.log(`Transitioned booking ${bookingId} to ${newStatus} by ${changedById}. Notes: ${notes || 'none'}`);
    return {
      ...booking,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
  }

  async cancelBooking(bookingId: string, cancelledById: string, reason?: string): Promise<Booking> {
    return this.transitionStatus(bookingId, "CANCELLED", cancelledById, reason || "Cancelled by user");
  }

  async getStatusHistory(bookingId: string): Promise<BookingStatusHistory[]> {
    return [
      {
        id: "hist-1",
        bookingId,
        previousStatus: null,
        newStatus: "REQUEST_SENT",
        changedById: "cust-1",
        createdAt: new Date().toISOString(),
      },
      {
        id: "hist-2",
        bookingId,
        previousStatus: "REQUEST_SENT",
        newStatus: "BOOKING_CONFIRMED",
        changedById: "w-1",
        createdAt: new Date().toISOString(),
      },
    ];
  }
}

export const bookingService = new BookingService();
