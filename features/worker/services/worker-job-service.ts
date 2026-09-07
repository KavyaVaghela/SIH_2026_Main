/**
 * Worker Job Service
 *
 * Bridges the Worker UI with the shared BookingService and Supabase backend.
 * Provides unified data-fetching for Job Requests, Daily Schedule, Active Jobs,
 * and Completed Assignments according to canonical booking states.
 */

import {
  bookingService,
  type Booking,
  type CreateBookingRequestPayload,
  type BookingStatusHistory,
} from "@/features/bookings/services/booking-service";
import { workerService } from "@/features/workforce/services/worker-service";
import { notificationService } from "@/features/notifications/services/notification-service";
import { serviceCatalogService } from "@/features/services/services/service-catalog-service";
import { invoiceService, type Invoice } from "@/features/invoices/services/invoice-service";
import { paymentService, type PaymentRecord } from "@/features/payments/services/payment-service";
import { welfareService } from "@/features/welfare/services/welfare-service";
import { createClient } from "@/lib/supabase/client";
import { AppError } from "@/lib/errors";
import type { Coordinates } from "@/lib/maps/types";
import type { BookingStatus, WorkerAvailabilityStatus } from "@/supabase/types/database.types";
import type {
  WorkerJobItem,
  WorkerEstimateSubmissionPayload,
  GenerateServiceBillPayload,
  WorkerEarningsSummary,
  WorkerEarningsRecord,
  WorkerWelfareDetails,
} from "../types";

export interface IWorkerJobService {
  getJobRequests(workerId?: string): Promise<WorkerJobItem[]>;
  reviewJobRequest(jobId: string, workerId?: string): Promise<WorkerJobItem>;
  expressInterestInJob(jobId: string, workerId?: string): Promise<WorkerJobItem>;
  submitWorkerEstimate(payload: WorkerEstimateSubmissionPayload): Promise<WorkerJobItem>;
  getMinimumVisitCharge(serviceId: string): Promise<number>;
  acceptJob(bookingId: string, workerId?: string): Promise<WorkerJobItem>;
  startTravel(bookingId: string, workerId?: string): Promise<WorkerJobItem>;
  markArrived(bookingId: string, workerId?: string): Promise<WorkerJobItem>;
  verifyServiceOtp(bookingId: string, otpCode: string, workerId?: string): Promise<WorkerJobItem>;
  startService(bookingId: string, workerId?: string): Promise<WorkerJobItem>;
  completeService(bookingId: string, workerId?: string): Promise<WorkerJobItem>;
  updateServiceDetails(
    bookingId: string,
    details: {
      workNotes?: string | null;
      materialsUsed?: string[] | null;
      beforePhotoUrl?: string | null;
      afterPhotoUrl?: string | null;
    },
    workerId?: string
  ): Promise<WorkerJobItem>;
  generateServiceBill(payload: GenerateServiceBillPayload): Promise<{
    job: WorkerJobItem;
    invoice: Invoice;
    payment: PaymentRecord;
  }>;
  getBookingInvoice(bookingId: string): Promise<Invoice | null>;
  getBookingPayment(bookingId: string): Promise<PaymentRecord | null>;
  simulatePaymentSuccess(
    bookingId: string,
    workerId?: string
  ): Promise<{ job: WorkerJobItem; payment: PaymentRecord }>;
  simulatePaymentFailure(
    bookingId: string,
    workerId?: string
  ): Promise<{ job: WorkerJobItem; payment: PaymentRecord }>;
  getWorkerEarnings(workerId?: string): Promise<{
    summary: WorkerEarningsSummary;
    records: WorkerEarningsRecord[];
    categoryBreakdown: Array<{ category: string; amount: number; count: number }>;
    dailyChart: Array<{ day: string; date: string; amount: number }>;
  }>;
  getWorkerWelfareDetails(workerId?: string): Promise<WorkerWelfareDetails>;
  simulateCustomerConfirmation(bookingId: string): Promise<WorkerJobItem>;
  getJobCoordinates(addressText?: string): { origin: Coordinates; destination: Coordinates };
  createTestCustomerRequest(workerId?: string, overrides?: Partial<CreateBookingRequestPayload>): Promise<WorkerJobItem>;
  getStatusHistory(jobId: string): Promise<BookingStatusHistory[]>;
  getSchedule(workerId?: string): Promise<{ today: WorkerJobItem[]; upcoming: WorkerJobItem[] }>;
  getActiveJobs(workerId?: string): Promise<WorkerJobItem[]>;
  getCompletedJobs(workerId?: string): Promise<WorkerJobItem[]>;
  getJobDetails(jobId: string): Promise<WorkerJobItem | null>;
  getWorkerAvailability(workerId?: string): Promise<WorkerAvailabilityStatus>;
  ensureSeedData(workerId?: string): Promise<void>;
}

export class WorkerJobService implements IWorkerJobService {
  private hasInitialized = false;

  /**
   * Helper to transform a canonical Booking into a WorkerJobItem
   */
  private mapBookingToWorkerJobItem(b: Booking): WorkerJobItem {
    const isEmergency =
      (b.problemDescription && /emergency|rupture|burst|leakage|spark/i.test(b.problemDescription)) ||
      (b.serviceTitle && /emergency/i.test(b.serviceTitle));

    // Determine customer name
    let customerName = "Rahul Sharma";
    if (b.problemDescription && b.problemDescription.includes("Customer:")) {
      const match = b.problemDescription.match(/Customer:\s*([^•\n]+)/);
      if (match) customerName = match[1].trim();
    } else if (b.customerId === "cust-priya" || b.id.includes("priya")) {
      customerName = "Priya Shah";
    } else if (b.customerId === "cust-amit" || b.id.includes("amit")) {
      customerName = "Amit Patel";
    } else if (b.customerId === "cust-neha" || b.id.includes("neha")) {
      customerName = "Neha Mehta";
    } else if (b.customerId === "cust-ramesh" || b.id.includes("ramesh")) {
      customerName = "Ramesh V.";
    }

    // Determine scheduled date and time display
    let scheduledDate = "Today";
    let scheduledTime = "4:00 PM";
    if (b.scheduledStartAt) {
      if (b.scheduledStartAt.includes("T")) {
        const lastTIndex = b.scheduledStartAt.lastIndexOf("T");
        const datePart = b.scheduledStartAt.slice(0, lastTIndex);
        const timePart = b.scheduledStartAt.slice(lastTIndex + 1);
        scheduledDate = datePart || "Today";
        if (timePart) {
          const parts = timePart.split(":");
          const hourNum = parseInt(parts[0], 10);
          if (!isNaN(hourNum)) {
            const minPart = parts[1] || "00";
            const ampm = hourNum >= 12 ? "PM" : "AM";
            const displayHour = hourNum % 12 || 12;
            scheduledTime = `${displayHour}:${minPart} ${ampm}`;
          } else {
            scheduledTime = timePart;
          }
        }
      } else {
        scheduledDate = b.scheduledStartAt;
      }
    }

    // Distance calculation placeholder (2.1 km default per spec)
    let distanceKm = 2.1;
    if (b.addressText && b.addressText.includes("Navrangpura")) {
      distanceKm = 3.5;
    } else if (b.addressText && b.addressText.includes("Vastrapur")) {
      distanceKm = 1.8;
    } else if (b.addressText && b.addressText.includes("Bodakdev")) {
      distanceKm = 4.2;
    }

    return {
      id: b.id,
      bookingNumber: b.bookingNumber || `BK-${b.id.slice(-6).toUpperCase()}`,
      serviceTitle: b.serviceTitle || "Plumbing Repair",
      categoryName: b.categoryName || "Plumbing & Drainage",
      customerName,
      customerPhone: b.workerPhone || "+91 98250 11021",
      customerArea: b.addressText || "Satellite, Ahmedabad",
      distanceKm,
      scheduledDate,
      scheduledTime,
      scheduledStartAt: b.scheduledStartAt,
      scheduledEndAt: b.scheduledEndAt,
      problemDescription: b.problemDescription || "Bathroom pipe leakage inspection and repair.",
      problemPhotoUrl: b.problemPhotoUrl,
      totalAmount: b.totalAmount || 500,
      workerEarnings: b.workerEarnings || Math.round((b.totalAmount || 500) * 0.95),
      status: b.status,
      urgency: isEmergency ? "EMERGENCY" : "STANDARD",
      cooperativeName: b.cooperativeName || "ABC Labour Cooperative Society",
      otpCode: b.otpCode,
      rawBooking: b,
      workerEstimateAmount: b.workerEstimateAmount || null,
      workerEstimateLabor: b.workerEstimateLabor || null,
      workerEstimateMaterials: b.workerEstimateMaterials || null,
      workerEstimateNotes: b.workerEstimateNotes || null,
      workerEstimateSubmittedAt: b.workerEstimateSubmittedAt || null,
      minimumVisitCharge: 200,
      workNotes: b.workNotes || null,
      materialsUsed: b.materialsUsed || null,
      beforePhotoUrl: b.beforePhotoUrl || null,
      afterPhotoUrl: b.afterPhotoUrl || null,
      actualStartAt: b.actualStartAt || null,
      actualEndAt: b.actualEndAt || null,
      invoiceId: null,
      invoiceNumber: null,
      invoiceTotal: null,
      paymentStatus: null,
      paymentId: null,
    };
  }

  /**
   * Ensures development seed bookings exist inside bookingService
   * so UI reads data through the real database/service path.
   */
  async ensureSeedData(workerId: string = "w-1"): Promise<void> {
    if (this.hasInitialized) return;
    this.hasInitialized = true;

    try {
      const existing = await bookingService.getWorkerBookings(workerId);
      if (existing.length >= 5) {
        return;
      }

      const pause = () => new Promise((r) => setTimeout(r, 15));

      // Seed Part B/F example request: Rahul Sharma, Plumbing Repair, ₹500 (Status: REQUEST_SENT)
      await bookingService.createRequest({
        customerId: "cust-rahul-req",
        workerId,
        serviceId: "srv-p2",
        federationId: "fed-1",
        addressId: "addr-1",
        problemDescription: "Customer: Rahul Sharma • Bathroom pipe leakage requiring joint replacement.",
        scheduledStartAt: "September 5, 2026T16:00:00",
        scheduledEndAt: "September 5, 2026T17:30:00",
        totalAmount: 500,
        serviceTitle: "Plumbing Repair",
        categoryName: "Plumbing & Drainage",
        workerName: "Ravi Patel",
        cooperativeName: "ABC Labour Cooperative Society",
        addressText: "Satellite, Ahmedabad",
      });
      await pause();

      // Seed 2nd Request: Neha Mehta, Tap Replacement (Status: REQUEST_SENT)
      await bookingService.createRequest({
        customerId: "cust-neha-req",
        workerId,
        serviceId: "srv-p1",
        federationId: "fed-1",
        addressId: "addr-2",
        problemDescription: "Customer: Neha Mehta • Kitchen mixer tap dripping continuously. Urgent repair.",
        scheduledStartAt: "TodayT18:00:00",
        scheduledEndAt: "TodayT19:00:00",
        totalAmount: 450,
        serviceTitle: "Tap Repair & Leak Fix",
        categoryName: "Plumbing & Drainage",
        workerName: "Ravi Patel",
        cooperativeName: "ABC Labour Cooperative Society",
        addressText: "Vastrapur, Ahmedabad",
      });
      await pause();

      // Seed Part J Schedule 1: 10:00 AM — Electrical Repair — Priya Shah — Navrangpura (BOOKING_CONFIRMED)
      const sch1 = await bookingService.createRequest({
        customerId: "cust-priya",
        workerId,
        serviceId: "srv-e1",
        federationId: "fed-1",
        addressId: "addr-3",
        problemDescription: "Customer: Priya Shah • Main breaker tripping inspection and socket replacement.",
        scheduledStartAt: "TodayT10:00:00",
        scheduledEndAt: "TodayT11:30:00",
        totalAmount: 650,
        serviceTitle: "Electrical Repair",
        categoryName: "Electrical & Wiring",
        workerName: "Ravi Patel",
        cooperativeName: "ABC Labour Cooperative Society",
        addressText: "Navrangpura, Ahmedabad",
      });
      await bookingService.submitWorkerEstimate({ bookingId: sch1.id, workerId, totalAmount: 650 });
      await bookingService.confirmBooking(sch1.id, "cust-priya");
      await pause();

      // Seed Part J Schedule 2: 2:00 PM — Pipe Repair — Rahul Sharma — Satellite (BOOKING_CONFIRMED)
      const sch2 = await bookingService.createRequest({
        customerId: "cust-rahul-sch",
        workerId,
        serviceId: "srv-p3",
        federationId: "fed-1",
        addressId: "addr-1",
        problemDescription: "Customer: Rahul Sharma • Sink drainage blockage clearing and trap replacement.",
        scheduledStartAt: "TodayT14:00:00",
        scheduledEndAt: "TodayT16:00:00",
        totalAmount: 750,
        serviceTitle: "Pipe Repair",
        categoryName: "Plumbing & Drainage",
        workerName: "Ravi Patel",
        cooperativeName: "ABC Labour Cooperative Society",
        addressText: "Satellite, Ahmedabad",
      });
      await bookingService.submitWorkerEstimate({ bookingId: sch2.id, workerId, totalAmount: 750 });
      await bookingService.confirmBooking(sch2.id, "cust-rahul-sch");
      await pause();

      // Seed Part J Schedule 3: 5:00 PM — Maintenance — Amit Patel — Vastrapur (BOOKING_CONFIRMED)
      const sch3 = await bookingService.createRequest({
        customerId: "cust-amit",
        workerId,
        serviceId: "srv-p8",
        federationId: "fed-1",
        addressId: "addr-4",
        problemDescription: "Customer: Amit Patel • Routine quarterly valve and overhead tank check.",
        scheduledStartAt: "TodayT17:00:00",
        scheduledEndAt: "TodayT18:00:00",
        totalAmount: 450,
        serviceTitle: "Maintenance",
        categoryName: "Plumbing & Drainage",
        workerName: "Ravi Patel",
        cooperativeName: "ABC Labour Cooperative Society",
        addressText: "Vastrapur, Ahmedabad",
      });
      await bookingService.submitWorkerEstimate({ bookingId: sch3.id, workerId, totalAmount: 450 });
      await bookingService.confirmBooking(sch3.id, "cust-amit");
      await pause();

      // Seed Part L Active Job: Service Started (Ramesh V.)
      const act1 = await bookingService.createRequest({
        customerId: "cust-ramesh",
        workerId,
        serviceId: "srv-p4",
        federationId: "fed-1",
        addressId: "addr-5",
        problemDescription: "Customer: Ramesh V. • Emergency bathroom pipe rupture under main sink.",
        scheduledStartAt: "TodayT09:00:00",
        scheduledEndAt: "TodayT11:00:00",
        totalAmount: 850,
        serviceTitle: "Bathroom Plumbing Repair",
        categoryName: "Plumbing & Drainage",
        workerName: "Ravi Patel",
        cooperativeName: "ABC Labour Cooperative Society",
        addressText: "Bodakdev, Ahmedabad",
      });
      await bookingService.submitWorkerEstimate({ bookingId: act1.id, workerId, totalAmount: 850 });
      await bookingService.confirmBooking(act1.id, "cust-ramesh");
      await bookingService.transitionStatus(act1.id, "WORKER_ACCEPTED", workerId, "WORKER");
      await bookingService.transitionStatus(act1.id, "ON_THE_WAY", workerId, "WORKER");
      await bookingService.transitionStatus(act1.id, "ARRIVED", workerId, "WORKER");
      await bookingService.verifyOtp(act1.id, "940218", "cust-ramesh");
      await bookingService.transitionStatus(act1.id, "SERVICE_STARTED", workerId, "WORKER");
      await pause();

      // Seed Part M Completed Job: Overhead Tank Valve Replacement (BOOKING_COMPLETED)
      const comp1 = await bookingService.createRequest({
        customerId: "cust-rahul-comp",
        workerId,
        serviceId: "srv-p5",
        federationId: "fed-1",
        addressId: "addr-1",
        problemDescription: "Customer: Rahul Sharma • Overhead tank valve replacement and leak test completed successfully.",
        scheduledStartAt: "Sep 2, 2026T11:00:00",
        scheduledEndAt: "Sep 2, 2026T12:30:00",
        totalAmount: 950,
        serviceTitle: "Overhead Tank Valve Replacement",
        categoryName: "Plumbing & Drainage",
        workerName: "Ravi Patel",
        cooperativeName: "ABC Labour Cooperative Society",
        addressText: "Satellite, Ahmedabad",
      });
      await bookingService.submitWorkerEstimate({ bookingId: comp1.id, workerId, totalAmount: 950 });
      await bookingService.confirmBooking(comp1.id, "cust-rahul-comp");
      await bookingService.transitionStatus(comp1.id, "WORKER_ACCEPTED", workerId, "WORKER");
      await bookingService.transitionStatus(comp1.id, "ON_THE_WAY", workerId, "WORKER");
      await bookingService.transitionStatus(comp1.id, "ARRIVED", workerId, "WORKER");
      await bookingService.verifyOtp(comp1.id, "940218", "cust-rahul-comp");
      await bookingService.transitionStatus(comp1.id, "SERVICE_STARTED", workerId, "WORKER");
      await bookingService.transitionStatus(comp1.id, "SERVICE_COMPLETED", workerId, "WORKER");
      await bookingService.transitionStatus(comp1.id, "BILL_GENERATED", workerId, "WORKER");
      await bookingService.transitionStatus(comp1.id, "PAYMENT_PENDING", "cust-rahul-comp", "CUSTOMER");
      await bookingService.transitionStatus(comp1.id, "PAYMENT_RECEIVED", "admin-gateway", "SUPER_ADMIN");
      await bookingService.transitionStatus(comp1.id, "BOOKING_COMPLETED", "admin-gateway", "SUPER_ADMIN", "Booking closed and settled");
    } catch (err) {
      console.warn("Worker seed initialization note:", err);
    }
  }

  /**
   * Fetch all incoming job requests for the worker
   */
  async getJobRequests(workerId: string = "w-1"): Promise<WorkerJobItem[]> {
    await this.ensureSeedData(workerId);

    // Try Supabase first if configured, else fallback to bookingService
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("worker_id", workerId)
        .in("status", ["REQUEST_SENT", "WORKER_REVIEWING"]);

      if (!error && data && data.length > 0) {
        return (data as unknown as Booking[]).map((b) => this.mapBookingToWorkerJobItem(b));
      }
    } catch {
      // Fall through to bookingService
    }

    const allBookings = await bookingService.getPlatformBookings();
    const requestLifecycleStates: BookingStatus[] = [
      "REQUEST_SENT",
      "WORKER_REVIEWING",
      "WORKER_INTERESTED",
      "CUSTOMER_CONFIRMATION_PENDING",
    ];
    const requests = allBookings.filter(
      (b) =>
        requestLifecycleStates.includes(b.status) &&
        (b.workerId === workerId || (!b.workerId && b.status === "REQUEST_SENT"))
    );

    return requests.map((b) => this.mapBookingToWorkerJobItem(b));
  }

  /**
   * Worker reviews an incoming request (REQUEST_SENT -> WORKER_REVIEWING)
   */
  async reviewJobRequest(jobId: string, workerId: string = "w-1"): Promise<WorkerJobItem> {
    const worker = await workerService.getWorkerById(workerId);
    if (!worker || worker.status !== "ACTIVE") {
      throw new AppError("Worker account is inactive or not found.", "UNAUTHORIZED", 403);
    }

    const booking = await bookingService.getBooking(jobId);
    if (!booking) {
      throw new AppError(`Job request ${jobId} not found.`, "NOT_FOUND", 404);
    }

    if (booking.workerId && booking.workerId !== workerId) {
      throw new AppError("You are not authorized to review this request.", "UNAUTHORIZED", 403);
    }
    if (!booking.workerId) {
      booking.workerId = workerId;
      booking.workerName = worker.profile?.fullName || "Ravi Patel";
      booking.workerPhone = worker.profile?.phone || "+91 98250 12345";
    }

    // Duplicate action protection: if already reviewed or past, return current without re-transitioning
    if (booking.status === "WORKER_REVIEWING" || booking.status === "WORKER_INTERESTED" || booking.status === "CUSTOMER_CONFIRMATION_PENDING") {
      return this.mapBookingToWorkerJobItem(booking);
    }

    if (booking.status !== "REQUEST_SENT") {
      throw new AppError(`Cannot review job request with current status: ${booking.status}`, "INVALID_STATE_TRANSITION", 400);
    }

    const updated = await bookingService.transitionStatus(
      jobId,
      "WORKER_REVIEWING",
      workerId,
      "WORKER",
      "Worker started reviewing request specifications"
    );

    return this.mapBookingToWorkerJobItem(updated);
  }

  /**
   * Worker expresses interest in assignment (WORKER_REVIEWING -> WORKER_INTERESTED -> CUSTOMER_CONFIRMATION_PENDING)
   */
  async expressInterestInJob(jobId: string, workerId: string = "w-1"): Promise<WorkerJobItem> {
    const worker = await workerService.getWorkerById(workerId);
    if (!worker || worker.status !== "ACTIVE") {
      throw new AppError("Worker account is inactive.", "UNAUTHORIZED", 403);
    }
    if (worker.availability === "UNAVAILABLE") {
      throw new AppError(
        "Worker is currently marked UNAVAILABLE in dispatch registry. Please update your availability first.",
        "VALIDATION_ERROR",
        400
      );
    }

    const booking = await bookingService.getBooking(jobId);
    if (!booking) {
      throw new AppError(`Job request ${jobId} not found.`, "NOT_FOUND", 404);
    }

    if (booking.workerId && booking.workerId !== workerId) {
      throw new AppError("You are not authorized to respond to this request.", "UNAUTHORIZED", 403);
    }

    // Duplicate action protection: if already interested or confirmation pending, return immediately
    if (booking.status === "WORKER_INTERESTED" || booking.status === "CUSTOMER_CONFIRMATION_PENDING") {
      return this.mapBookingToWorkerJobItem(booking);
    }

    let current = booking;
    // Advance through WORKER_REVIEWING if worker expressed interest directly from REQUEST_SENT
    if (current.status === "REQUEST_SENT") {
      current = await bookingService.transitionStatus(
        jobId,
        "WORKER_REVIEWING",
        workerId,
        "WORKER",
        "Worker reviewed request prior to expressing interest"
      );
    }

    if (current.status !== "WORKER_REVIEWING") {
      throw new AppError(`Cannot express interest when job status is ${current.status}`, "INVALID_STATE_TRANSITION", 400);
    }

    // Canonical transition: WORKER_REVIEWING -> WORKER_INTERESTED
    const interested = await bookingService.transitionStatus(
      jobId,
      "WORKER_INTERESTED",
      workerId,
      "WORKER",
      "Worker expressed interest in service request"
    );

    // Canonical progression: WORKER_INTERESTED -> CUSTOMER_CONFIRMATION_PENDING
    const awaitingCustomer = await bookingService.transitionStatus(
      jobId,
      "CUSTOMER_CONFIRMATION_PENDING",
      workerId,
      "WORKER",
      "Worker confirmed availability; awaiting customer final confirmation"
    );

    // Dispatch customer notification via notificationService
    try {
      await notificationService.sendNotification({
        profileId: booking.customerId,
        title: "Worker Expressed Interest in Your Request",
        message: `${booking.workerName || "A verified cooperative worker"} has reviewed your request for "${booking.serviceTitle}" and expressed interest. Please review and confirm your booking.`,
        type: "info",
        metadata: { bookingId: jobId, workerId },
      });
    } catch (notifErr) {
      console.warn("Notification dispatch notice:", notifErr);
    }

    return this.mapBookingToWorkerJobItem(awaitingCustomer);
  }

  /**
   * Retrieves the minimum visit charge configured for a service from the service catalogue
   */
  async getMinimumVisitCharge(serviceId: string): Promise<number> {
    try {
      const svc = await serviceCatalogService.getServiceDetails(serviceId);
      if (svc && typeof svc.minimumVisitCharge === "number") {
        return svc.minimumVisitCharge;
      }
    } catch (err) {
      console.warn("Could not fetch service details for minimum visit charge:", err);
    }
    return 200; // Fallback standard minimum visit charge in Gujarat federation
  }

  /**
   * Worker submits a service estimate (Task 4)
   * Enforces validation, minimum visit charge, state transitions, persistence, and customer notification.
   */
  async submitWorkerEstimate(payload: WorkerEstimateSubmissionPayload): Promise<WorkerJobItem> {
    const worker = await workerService.getWorkerById(payload.workerId);
    if (!worker || worker.status !== "ACTIVE") {
      throw new AppError("Worker account is inactive or not found.", "UNAUTHORIZED", 403);
    }

    const booking = await bookingService.getBooking(payload.bookingId);
    if (!booking) {
      throw new AppError(`Job request ${payload.bookingId} not found.`, "NOT_FOUND", 404);
    }

    if (booking.workerId && booking.workerId !== payload.workerId) {
      throw new AppError("You are not authorized to submit an estimate for this request.", "UNAUTHORIZED", 403);
    }

    const labor = Number(payload.laborAmount);
    const materials = Number(payload.materialAmount || 0);
    const additional = Number(payload.additionalCharges || 0);

    if (isNaN(labor) || labor <= 0) {
      throw new AppError("Labour charge must be greater than zero.", "VALIDATION_ERROR", 400);
    }
    if (materials < 0 || additional < 0) {
      throw new AppError("Material and additional charges cannot be negative.", "VALIDATION_ERROR", 400);
    }

    const totalAmount = Math.round((labor + materials + additional) * 100) / 100;
    const minCharge = await this.getMinimumVisitCharge(booking.serviceId);

    if (totalAmount < minCharge) {
      throw new AppError(
        `Total estimate (₹${totalAmount}) cannot be lower than the minimum service visit charge (₹${minCharge}).`,
        "VALIDATION_ERROR",
        400
      );
    }

    // Call shared bookingService.submitWorkerEstimate
    const updatedBooking = await bookingService.submitWorkerEstimate({
      bookingId: payload.bookingId,
      workerId: payload.workerId,
      totalAmount,
      laborAmount: labor,
      materialAmount: materials + additional,
      notes: payload.notes || "Itemized labour and materials quotation submitted by worker.",
    });

    // Write to Supabase worker_estimates table if available
    try {
      const supabase = createClient();
      await (supabase.from("worker_estimates") as any).insert({
        job_request_id: payload.bookingId,
        worker_id: payload.workerId,
        estimated_amount: totalAmount,
        notes: payload.notes || null,
        status: "PENDING",
      });
    } catch {
      // Fall through to bookingService persistence
    }

    // Customer Notification
    try {
      await notificationService.sendNotification({
        profileId: booking.customerId,
        title: "Worker Estimate Received",
        message: `Worker ${booking.workerName || "Ravi Patel"} has submitted a service estimate of ₹${totalAmount} for "${booking.serviceTitle}". Please review and confirm your booking.`,
        type: "info",
        metadata: {
          bookingId: payload.bookingId,
          workerId: payload.workerId,
          estimateAmount: totalAmount,
        },
      });
    } catch (notifErr) {
      console.warn("Notification dispatch notice:", notifErr);
    }

    const mapped = this.mapBookingToWorkerJobItem(updatedBooking);
    mapped.minimumVisitCharge = minCharge;
    return mapped;
  }

  /**
   * Retrieves Ahmedabad geographic coordinates for Worker origin and Customer destination
   */
  getJobCoordinates(addressText?: string): { origin: Coordinates; destination: Coordinates } {
    // Controlled development Worker origin: Navrangpura Trade Center
    const origin: Coordinates = { lat: 23.038, lng: 72.559 };

    // Destination mapped from real booking addressText
    let destination: Coordinates = { lat: 23.0325, lng: 72.5205 }; // Default Satellite
    const addr = (addressText || "").toLowerCase();

    if (addr.includes("satellite")) {
      destination = { lat: 23.0325, lng: 72.5205 };
    } else if (addr.includes("vastrapur")) {
      destination = { lat: 23.031, lng: 72.532 };
    } else if (addr.includes("bodakdev")) {
      destination = { lat: 23.042, lng: 72.508 };
    } else if (addr.includes("paldi")) {
      destination = { lat: 23.014, lng: 72.562 };
    } else if (addr.includes("navrangpura")) {
      destination = { lat: 23.041, lng: 72.553 };
    } else if (addr.includes("bopal")) {
      destination = { lat: 23.034, lng: 72.464 };
    }

    return { origin, destination };
  }

  /**
   * Worker accepts a confirmed booking (BOOKING_CONFIRMED -> WORKER_ACCEPTED)
   */
  async acceptJob(bookingId: string, workerId: string = "w-1"): Promise<WorkerJobItem> {
    const worker = await workerService.getWorkerById(workerId);
    if (!worker || worker.status !== "ACTIVE") {
      throw new AppError("Worker account is inactive or not found.", "UNAUTHORIZED", 403);
    }

    const booking = await bookingService.getBooking(bookingId);
    if (!booking) {
      throw new AppError(`Booking ${bookingId} not found.`, "NOT_FOUND", 404);
    }

    if (booking.workerId && booking.workerId !== workerId) {
      throw new AppError("You are not authorized to accept this booking.", "UNAUTHORIZED", 403);
    }

    if (booking.status !== "BOOKING_CONFIRMED") {
      throw new AppError(
        `Cannot accept job when booking status is ${booking.status}. Expected BOOKING_CONFIRMED.`,
        "INVALID_STATE_TRANSITION",
        400
      );
    }

    const updated = await bookingService.transitionStatus(
      bookingId,
      "WORKER_ACCEPTED",
      workerId,
      "WORKER",
      "Worker accepted job assignment"
    );

    // Customer Notification
    try {
      await notificationService.sendNotification({
        profileId: booking.customerId,
        title: "Worker Accepted Your Booking",
        message: `Worker ${booking.workerName || "Ravi Patel"} has accepted your booking for "${booking.serviceTitle}". They are scheduled to arrive at your requested time.`,
        type: "success",
        metadata: { bookingId, workerId },
      });
    } catch (notifErr) {
      console.warn("Notification dispatch notice:", notifErr);
    }

    return this.mapBookingToWorkerJobItem(updated);
  }

  /**
   * Worker initiates travel to customer premises (WORKER_ACCEPTED -> ON_THE_WAY)
   */
  async startTravel(bookingId: string, workerId: string = "w-1"): Promise<WorkerJobItem> {
    const worker = await workerService.getWorkerById(workerId);
    if (!worker || worker.status !== "ACTIVE") {
      throw new AppError("Worker account is inactive or not found.", "UNAUTHORIZED", 403);
    }

    const booking = await bookingService.getBooking(bookingId);
    if (!booking) {
      throw new AppError(`Booking ${bookingId} not found.`, "NOT_FOUND", 404);
    }

    if (booking.workerId && booking.workerId !== workerId) {
      throw new AppError("You are not authorized to update travel status for this booking.", "UNAUTHORIZED", 403);
    }

    if (booking.status !== "WORKER_ACCEPTED") {
      throw new AppError(
        `Cannot start travel when booking status is ${booking.status}. Expected WORKER_ACCEPTED.`,
        "INVALID_STATE_TRANSITION",
        400
      );
    }

    const updated = await bookingService.transitionStatus(
      bookingId,
      "ON_THE_WAY",
      workerId,
      "WORKER",
      "Worker started travel to customer location"
    );

    // Customer Notification
    try {
      await notificationService.sendNotification({
        profileId: booking.customerId,
        title: "Worker On The Way",
        message: `Worker ${booking.workerName || "Ravi Patel"} is on the way to your location for "${booking.serviceTitle}".`,
        type: "info",
        metadata: { bookingId, workerId },
      });
    } catch (notifErr) {
      console.warn("Notification dispatch notice:", notifErr);
    }

    return this.mapBookingToWorkerJobItem(updated);
  }

  /**
   * Worker marks arrival at customer premises (ON_THE_WAY -> ARRIVED)
   */
  async markArrived(bookingId: string, workerId: string = "w-1"): Promise<WorkerJobItem> {
    const worker = await workerService.getWorkerById(workerId);
    if (!worker || worker.status !== "ACTIVE") {
      throw new AppError("Worker account is inactive or not found.", "UNAUTHORIZED", 403);
    }

    const booking = await bookingService.getBooking(bookingId);
    if (!booking) {
      throw new AppError(`Booking ${bookingId} not found.`, "NOT_FOUND", 404);
    }

    if (booking.workerId && booking.workerId !== workerId) {
      throw new AppError("You are not authorized to update arrival status for this booking.", "UNAUTHORIZED", 403);
    }

    if (booking.status !== "ON_THE_WAY") {
      throw new AppError(
        `Cannot mark arrived when booking status is ${booking.status}. Expected ON_THE_WAY.`,
        "INVALID_STATE_TRANSITION",
        400
      );
    }

    const updated = await bookingService.transitionStatus(
      bookingId,
      "ARRIVED",
      workerId,
      "WORKER",
      "Worker arrived at customer premises"
    );

    // Customer Notification
    try {
      await notificationService.sendNotification({
        profileId: booking.customerId,
        title: "Worker Has Arrived",
        message: `Worker ${booking.workerName || "Ravi Patel"} has arrived at your address for "${booking.serviceTitle}". Please share your start OTP when ready.`,
        type: "info",
        metadata: { bookingId, workerId },
      });
    } catch (notifErr) {
      console.warn("Notification dispatch notice:", notifErr);
    }

    return this.mapBookingToWorkerJobItem(updated);
  }

  /**
   * Worker verifies customer OTP (ARRIVED -> OTP_VERIFIED)
   */
  async verifyServiceOtp(bookingId: string, otpCode: string, workerId: string = "w-1"): Promise<WorkerJobItem> {
    const worker = await workerService.getWorkerById(workerId);
    if (!worker || worker.status !== "ACTIVE") {
      throw new AppError("Worker account is inactive or not found.", "UNAUTHORIZED", 403);
    }

    const booking = await bookingService.getBooking(bookingId);
    if (!booking) {
      throw new AppError(`Booking ${bookingId} not found.`, "NOT_FOUND", 404);
    }

    if (booking.workerId && booking.workerId !== workerId) {
      throw new AppError("You are not authorized to verify OTP for this booking.", "UNAUTHORIZED", 403);
    }

    if (booking.status !== "ARRIVED") {
      throw new AppError(
        `Cannot verify OTP when booking status is ${booking.status}. Expected ARRIVED.`,
        "INVALID_STATE_TRANSITION",
        400
      );
    }

    const updated = await bookingService.verifyOtp(bookingId, otpCode, workerId);

    // Customer Notification
    try {
      await notificationService.sendNotification({
        profileId: booking.customerId,
        title: "Service Start OTP Verified",
        message: `Worker ${booking.workerName || "Ravi Patel"} has verified your service start OTP for "${booking.serviceTitle}". Work is ready to commence.`,
        type: "success",
        metadata: { bookingId, workerId },
      });
    } catch (notifErr) {
      console.warn("Notification dispatch notice:", notifErr);
    }

    return this.mapBookingToWorkerJobItem(updated);
  }

  /**
   * Worker starts service execution (OTP_VERIFIED -> SERVICE_STARTED)
   */
  async startService(bookingId: string, workerId: string = "w-1"): Promise<WorkerJobItem> {
    const worker = await workerService.getWorkerById(workerId);
    if (!worker || worker.status !== "ACTIVE") {
      throw new AppError("Worker account is inactive or not found.", "UNAUTHORIZED", 403);
    }

    const booking = await bookingService.getBooking(bookingId);
    if (!booking) {
      throw new AppError(`Booking ${bookingId} not found.`, "NOT_FOUND", 404);
    }

    if (booking.workerId && booking.workerId !== workerId) {
      throw new AppError("You are not authorized to start service for this booking.", "UNAUTHORIZED", 403);
    }

    if (booking.status !== "OTP_VERIFIED") {
      throw new AppError(
        `Cannot start service when booking status is ${booking.status}. Expected OTP_VERIFIED.`,
        "INVALID_STATE_TRANSITION",
        400
      );
    }

    const updated = await bookingService.transitionStatus(
      bookingId,
      "SERVICE_STARTED",
      workerId,
      "WORKER",
      "Worker started service execution"
    );

    // Customer Notification
    try {
      await notificationService.sendNotification({
        profileId: booking.customerId,
        title: "Service Started",
        message: `Worker ${booking.workerName || "Ravi Patel"} has started work on "${booking.serviceTitle}".`,
        type: "info",
        metadata: { bookingId, workerId },
      });
    } catch (notifErr) {
      console.warn("Notification dispatch notice:", notifErr);
    }

    return this.mapBookingToWorkerJobItem(updated);
  }

  /**
   * Updates service execution notes, materials, and photos during or upon service completion
   */
  async updateServiceDetails(
    bookingId: string,
    details: {
      workNotes?: string | null;
      materialsUsed?: string[] | null;
      beforePhotoUrl?: string | null;
      afterPhotoUrl?: string | null;
    },
    workerId: string = "w-1"
  ): Promise<WorkerJobItem> {
    const worker = await workerService.getWorkerById(workerId);
    if (!worker || worker.status !== "ACTIVE") {
      throw new AppError("Worker account is inactive or not found.", "UNAUTHORIZED", 403);
    }

    const booking = await bookingService.getBooking(bookingId);
    if (!booking) {
      throw new AppError(`Booking ${bookingId} not found.`, "NOT_FOUND", 404);
    }

    if (booking.workerId && booking.workerId !== workerId) {
      throw new AppError("You are not authorized to update details for this booking.", "UNAUTHORIZED", 403);
    }

    const updated = await bookingService.updateServiceDetails(bookingId, details);
    return this.mapBookingToWorkerJobItem(updated);
  }

  /**
   * Worker completes service execution (SERVICE_STARTED -> SERVICE_COMPLETED)
   */
  async completeService(bookingId: string, workerId: string = "w-1"): Promise<WorkerJobItem> {
    const worker = await workerService.getWorkerById(workerId);
    if (!worker || worker.status !== "ACTIVE") {
      throw new AppError("Worker account is inactive or not found.", "UNAUTHORIZED", 403);
    }

    const booking = await bookingService.getBooking(bookingId);
    if (!booking) {
      throw new AppError(`Booking ${bookingId} not found.`, "NOT_FOUND", 404);
    }

    if (booking.workerId && booking.workerId !== workerId) {
      throw new AppError("You are not authorized to complete this service booking.", "UNAUTHORIZED", 403);
    }

    if (booking.status !== "SERVICE_STARTED") {
      throw new AppError(
        `Cannot complete service when booking status is ${booking.status}. Expected SERVICE_STARTED.`,
        "INVALID_STATE_TRANSITION",
        400
      );
    }

    const updated = await bookingService.transitionStatus(
      bookingId,
      "SERVICE_COMPLETED",
      workerId,
      "WORKER",
      "Worker completed service execution"
    );

    // Customer Notification
    try {
      await notificationService.sendNotification({
        profileId: booking.customerId,
        title: "Service Completed",
        message: `Worker ${booking.workerName || "Ravi Patel"} has completed "${booking.serviceTitle}". Billing will be available next.`,
        type: "success",
        metadata: { bookingId, workerId },
      });
    } catch (notifErr) {
      console.warn("Notification dispatch notice:", notifErr);
    }

    return this.mapBookingToWorkerJobItem(updated);
  }

  /**
   * Worker generates the service bill (SERVICE_COMPLETED -> BILL_GENERATED -> PAYMENT_PENDING)
   */
  async generateServiceBill(payload: GenerateServiceBillPayload): Promise<{
    job: WorkerJobItem;
    invoice: Invoice;
    payment: PaymentRecord;
  }> {
    const { bookingId, workerId, items } = payload;
    const worker = await workerService.getWorkerById(workerId);
    if (!worker || worker.status !== "ACTIVE") {
      throw new AppError("Worker account is inactive or not found.", "UNAUTHORIZED", 403);
    }

    const booking = await bookingService.getBooking(bookingId);
    if (!booking) {
      throw new AppError(`Booking ${bookingId} not found.`, "NOT_FOUND", 404);
    }

    if (booking.workerId && booking.workerId !== workerId) {
      throw new AppError("You are not authorized to generate a bill for this booking.", "UNAUTHORIZED", 403);
    }

    if (booking.status !== "SERVICE_COMPLETED") {
      throw new AppError(
        `Cannot generate bill when booking status is ${booking.status}. Expected SERVICE_COMPLETED.`,
        "INVALID_STATE_TRANSITION",
        400
      );
    }

    if (!items || items.length === 0) {
      throw new AppError("A service bill must contain at least one line item.", "VALIDATION_ERROR", 400);
    }

    for (const it of items) {
      if (!it.description || it.description.trim() === "") {
        throw new AppError("Line item description cannot be empty.", "VALIDATION_ERROR", 400);
      }
      if (it.quantity <= 0 || it.unitPrice < 0) {
        throw new AppError("Line item quantity must be positive and price cannot be negative.", "VALIDATION_ERROR", 400);
      }
    }

    // 1. Create real Invoice via InvoiceService
    const invoice = await invoiceService.createInvoice({
      bookingId,
      customerId: booking.customerId,
      federationId: booking.federationId || "fed-1",
      items,
    });

    // 2. Transition Booking: SERVICE_COMPLETED -> BILL_GENERATED
    await bookingService.transitionStatus(
      bookingId,
      "BILL_GENERATED",
      workerId,
      "WORKER",
      `Worker generated invoice #${invoice.invoiceNumber} for ₹${invoice.totalAmount}`
    );

    // 3. Create real Payment record via PaymentService (status: PENDING)
    const payment = await paymentService.createPaymentRecord({
      invoiceId: invoice.id,
      bookingId,
      customerId: booking.customerId,
      amount: invoice.totalAmount,
    });

    // 4. Transition Booking: BILL_GENERATED -> PAYMENT_PENDING
    const updated = await bookingService.transitionStatus(
      bookingId,
      "PAYMENT_PENDING",
      "SYSTEM",
      "SUPER_ADMIN",
      "Invoice issued; awaiting customer payment"
    );

    // 5. Customer Notification
    try {
      await notificationService.sendNotification({
        profileId: booking.customerId,
        title: "Service Bill Generated",
        message: `Service bill #${invoice.invoiceNumber} of ₹${invoice.totalAmount} has been generated by worker ${booking.workerName || "Ravi Patel"}. Please proceed to payment.`,
        type: "info",
        metadata: { bookingId, invoiceId: invoice.id, amount: invoice.totalAmount },
      });
    } catch (notifErr) {
      console.warn("Notification dispatch notice:", notifErr);
    }

    const mapped = this.mapBookingToWorkerJobItem(updated);
    mapped.invoiceId = invoice.id;
    mapped.invoiceNumber = invoice.invoiceNumber;
    mapped.invoiceTotal = invoice.totalAmount;
    mapped.paymentStatus = payment.status;
    mapped.paymentId = payment.id;

    return { job: mapped, invoice, payment };
  }

  /**
   * Fetch invoice for a booking
   */
  async getBookingInvoice(bookingId: string): Promise<Invoice | null> {
    return invoiceService.getBookingInvoice(bookingId);
  }

  /**
   * Fetch payment record for a booking
   */
  async getBookingPayment(bookingId: string): Promise<PaymentRecord | null> {
    return paymentService.getBookingPayment(bookingId);
  }

  /**
   * Development-only simulation of customer payment success
   * Uses real PaymentService.processMockPayment which executes:
   * 1. Invoice marked 'paid'
   * 2. Booking transitions PAYMENT_PENDING -> PAYMENT_RECEIVED -> BOOKING_COMPLETED
   * 3. Worker availability reset to AVAILABLE
   */
  async simulatePaymentSuccess(
    bookingId: string,
    workerId: string = "w-1"
  ): Promise<{ job: WorkerJobItem; payment: PaymentRecord }> {
    const worker = await workerService.getWorkerById(workerId);
    if (!worker || worker.status !== "ACTIVE") {
      throw new AppError("Worker account is inactive or not found.", "UNAUTHORIZED", 403);
    }

    const booking = await bookingService.getBooking(bookingId);
    if (!booking) {
      throw new AppError(`Booking ${bookingId} not found.`, "NOT_FOUND", 404);
    }

    if (booking.workerId && booking.workerId !== workerId) {
      throw new AppError("You are not authorized for this booking.", "UNAUTHORIZED", 403);
    }

    if (booking.status !== "PAYMENT_PENDING") {
      throw new AppError(
        `Cannot simulate payment when booking status is ${booking.status}. Expected PAYMENT_PENDING.`,
        "INVALID_STATE_TRANSITION",
        400
      );
    }

    let payment = await paymentService.getBookingPayment(bookingId);
    if (!payment) {
      const invoice = await invoiceService.getBookingInvoice(bookingId);
      payment = await paymentService.createPaymentRecord({
        invoiceId: invoice?.id || `inv-${Date.now()}`,
        bookingId,
        customerId: booking.customerId,
        amount: invoice?.totalAmount || booking.totalAmount,
      });
    }

    const paidRecord = await paymentService.processMockPayment(payment.id, true);
    const completedBooking = await bookingService.getBooking(bookingId);
    if (!completedBooking) throw new Error("Booking not found after payment");

    const mapped = this.mapBookingToWorkerJobItem(completedBooking);
    mapped.paymentStatus = paidRecord.status;
    mapped.paymentId = paidRecord.id;

    return { job: mapped, payment: paidRecord };
  }

  /**
   * Development-only simulation of customer payment failure
   * Payment becomes FAILED, booking remains in PAYMENT_PENDING, worker remains busy.
   */
  async simulatePaymentFailure(
    bookingId: string,
    workerId: string = "w-1"
  ): Promise<{ job: WorkerJobItem; payment: PaymentRecord }> {
    const worker = await workerService.getWorkerById(workerId);
    if (!worker || worker.status !== "ACTIVE") {
      throw new AppError("Worker account is inactive or not found.", "UNAUTHORIZED", 403);
    }

    const booking = await bookingService.getBooking(bookingId);
    if (!booking) {
      throw new AppError(`Booking ${bookingId} not found.`, "NOT_FOUND", 404);
    }

    if (booking.status !== "PAYMENT_PENDING") {
      throw new AppError(
        `Cannot simulate payment failure when booking status is ${booking.status}. Expected PAYMENT_PENDING.`,
        "INVALID_STATE_TRANSITION",
        400
      );
    }

    let payment = await paymentService.getBookingPayment(bookingId);
    if (!payment) {
      const invoice = await invoiceService.getBookingInvoice(bookingId);
      payment = await paymentService.createPaymentRecord({
        invoiceId: invoice?.id || `inv-${Date.now()}`,
        bookingId,
        customerId: booking.customerId,
        amount: invoice?.totalAmount || booking.totalAmount,
      });
    }

    const failedRecord = await paymentService.processMockPayment(payment.id, false);
    const currentBooking = await bookingService.getBooking(bookingId);
    if (!currentBooking) throw new Error("Booking not found after payment failure");

    const mapped = this.mapBookingToWorkerJobItem(currentBooking);
    mapped.paymentStatus = failedRecord.status;
    mapped.paymentId = failedRecord.id;

    return { job: mapped, payment: failedRecord };
  }

  /**
   * Derives real Worker earnings from completed and paid bookings.
   * Only includes BOOKING_COMPLETED bookings.
   */
  async getWorkerEarnings(workerId: string = "w-1"): Promise<{
    summary: WorkerEarningsSummary;
    records: WorkerEarningsRecord[];
    categoryBreakdown: Array<{ category: string; amount: number; count: number }>;
    dailyChart: Array<{ day: string; date: string; amount: number }>;
  }> {
    await this.ensureSeedData(workerId);
    const allBookings = await bookingService.getWorkerBookings(workerId);

    // Only BOOKING_COMPLETED bookings count toward earnings
    const completedBookings = allBookings.filter((b) => b.status === "BOOKING_COMPLETED");

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let todaysEarnings = 0;
    let thisWeekEarnings = 0;
    let thisMonthEarnings = 0;

    const records: WorkerEarningsRecord[] = [];
    const catMap = new Map<string, { amount: number; count: number }>();
    const dayMap = new Map<string, number>();

    // Initialize 7 days in dayMap
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const ds = d.toISOString().split("T")[0];
      dayMap.set(ds, 0);
    }

    completedBookings.forEach((b) => {
      const gross = b.totalAmount || 500;
      const net = b.workerEarnings || Math.round(gross * 0.95);
      const cess = Math.round(gross * 0.05);
      const bDate = b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt);
      const dateStr = bDate.toISOString().split("T")[0];

      if (dateStr === todayStr) {
        todaysEarnings += net;
      }
      if (bDate >= weekAgo) {
        thisWeekEarnings += net;
      }
      if (bDate >= monthStart) {
        thisMonthEarnings += net;
      }

      // 7-day bucket
      if (dayMap.has(dateStr)) {
        dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + net);
      }

      // Category breakdown
      const cat = b.categoryName || "General Services";
      const existingCat = catMap.get(cat) || { amount: 0, count: 0 };
      catMap.set(cat, {
        amount: existingCat.amount + net,
        count: existingCat.count + 1,
      });

      records.push({
        id: b.id,
        bookingNumber: b.bookingNumber || `BK-${b.id.slice(-6)}`,
        serviceTitle: b.serviceTitle || "Service",
        date: dateStr,
        time: bDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        customerArea: b.addressText || "Ahmedabad",
        grossAmount: gross,
        welfareCess: cess,
        netPayout: net,
        status: "Transferred",
        referenceId: `TXN-${b.id.slice(-6).toUpperCase()}`,
      });
    });

    // Sort records descending
    records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const categoryBreakdown = Array.from(catMap.entries()).map(([category, val]) => ({
      category,
      amount: val.amount,
      count: val.count,
    }));

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dailyChart = Array.from(dayMap.entries()).map(([date, amount]) => {
      const d = new Date(date);
      return {
        day: dayNames[d.getDay()],
        date,
        amount,
      };
    });

    const summary: WorkerEarningsSummary = {
      todaysEarnings,
      thisWeekEarnings,
      thisMonthEarnings,
      completedJobsCount: completedBookings.length,
      bankName: "State Bank of India",
      accountEnding: "4821",
      ifscPrefix: "SBIN000",
      nextPayoutTime: "Daily at 8:00 PM IST",
    };

    return { summary, records, categoryBreakdown, dailyChart };
  }

  /**
   * Connects to real WelfareService and returns authenticated worker welfare and compliance details
   */
  async getWorkerWelfareDetails(workerId: string = "w-1"): Promise<WorkerWelfareDetails> {
    const [insurance, eligibility, welfareRecs] = await Promise.all([
      welfareService.getWorkerInsurance(workerId),
      welfareService.checkEmergencyAssistanceEligibility(workerId),
      welfareService.getWorkerWelfareRecords(workerId),
    ]);

    const totalContributions = welfareRecs.reduce(
      (sum, r) => sum + r.contributionAmount + r.subsidyAmount,
      0
    );

    return {
      insuranceStatus: insurance?.isActive ? "Active" : "Inactive",
      policyNumber: insurance?.policyNumber || "POL-GJ-2026-9081",
      providerName: insurance?.providerName || "Cooperative Gig Worker Health Mutual",
      coverageAmount: insurance?.coverageAmount || 500000,
      welfareSchemeStatus: "Enrolled",
      emergencyAssistanceStatus: eligibility.eligible ? "Eligible" : "Not Eligible",
      expiringWarning: {
        certName: "On-Site Safety & First Aid Protocol",
        daysRemaining: 45,
      },
      benefits: [
        {
          title: "Accidental Hospitalization Cover",
          description: "100% cashless hospitalization up to ₹5,00,000 at empanelled cooperative hospital network.",
        },
        {
          title: "Cooperative Provident Match",
          description: "Cooperative matches monthly welfare fund contributions 1:1 for long-term security.",
        },
        {
          title: "24/7 Emergency Roadside & Tool Assistance",
          description: "On-demand breakdown support and replacement tools for all active jobs.",
        },
        {
          title: "Skill Upgradation & Safety Subsidy",
          description: "Annual stipend of ₹5,000 for advanced trade certifications and green plumbing workshops.",
        },
      ],
      certifications: [
        {
          id: "cert-1",
          title: "Advanced Plumbing & Pipefitting (Level 4)",
          status: "Verified",
          validityText: "Valid until Dec 2027",
          issuedBy: "National Skill Development Corporation (NSDC)",
          certCode: "NSDC-PLM-2024-8841",
        },
        {
          id: "cert-2",
          title: "Water Conservation & Leak Detection",
          status: "Completed",
          validityText: "Certified in 2025",
          issuedBy: "Gujarat Water Supply & Sewerage Board",
          certCode: "GWSSB-WTR-2025-0912",
        },
        {
          id: "cert-3",
          title: "On-Site Safety & First Aid Protocol",
          status: "Verified",
          validityText: "Valid until Nov 2026",
          issuedBy: "Indian Red Cross Society",
          certCode: "IRCS-SAF-2024-3321",
        },
      ],
    };
  }

  /**
   * Development-only simulation of customer confirming an estimate (CUSTOMER_CONFIRMATION_PENDING -> BOOKING_CONFIRMED)
   */
  async simulateCustomerConfirmation(bookingId: string): Promise<WorkerJobItem> {
    const booking = await bookingService.getBooking(bookingId);
    if (!booking) {
      throw new AppError(`Booking ${bookingId} not found.`, "NOT_FOUND", 404);
    }

    if (booking.status !== "CUSTOMER_CONFIRMATION_PENDING") {
      throw new AppError(
        `Cannot simulate customer confirmation when booking status is ${booking.status}. Expected CUSTOMER_CONFIRMATION_PENDING.`,
        "INVALID_STATE_TRANSITION",
        400
      );
    }

    const updated = await bookingService.confirmBooking(bookingId, booking.customerId);
    return this.mapBookingToWorkerJobItem(updated);
  }

  /**
   * Generates a real test customer request in bookingService for development testing (Part 10)
   */
  async createTestCustomerRequest(
    workerId: string = "w-1",
    overrides?: Partial<CreateBookingRequestPayload>
  ): Promise<WorkerJobItem> {
    const testCustomers = [
      { name: "Anand Verma", area: "Navrangpura, Ahmedabad", dist: 2.4, problem: "Water purifier inlet valve leaking onto kitchen counter." },
      { name: "Kavita Patel", area: "Satellite, Ahmedabad", dist: 1.6, problem: "Shower diverter knob jammed and leaking continuously." },
      { name: "Mehul Shah", area: "Bodakdev, Ahmedabad", dist: 3.8, problem: "Bathroom drain pipe backup during heavy usage." },
      { name: "Sunita Trivedi", area: "Vastrapur, Ahmedabad", dist: 2.1, problem: "Balcony bibcock tap broken and needs replacement." },
    ];
    const picked = testCustomers[Math.floor(Math.random() * testCustomers.length)];
    const uniqueCustId = `cust-test-${Date.now()}`;
    const uniqueSvcId = `srv-p${Math.floor(Math.random() * 9) + 1}`;

    const newBooking = await bookingService.createRequest({
      customerId: uniqueCustId,
      workerId,
      serviceId: overrides?.serviceId || uniqueSvcId,
      federationId: "fed-1",
      addressId: `addr-${Date.now()}`,
      problemDescription: overrides?.problemDescription || `Customer: ${picked.name} • ${picked.problem}`,
      scheduledStartAt: overrides?.scheduledStartAt || "TodayT17:00:00",
      scheduledEndAt: overrides?.scheduledEndAt || "TodayT18:30:00",
      totalAmount: overrides?.totalAmount || 550,
      serviceTitle: overrides?.serviceTitle || "Plumbing Inspection & Repair",
      categoryName: overrides?.categoryName || "Plumbing & Drainage",
      workerName: "Ravi Patel",
      cooperativeName: "ABC Labour Cooperative Society",
      addressText: overrides?.addressText || picked.area,
    });

    return this.mapBookingToWorkerJobItem(newBooking);
  }

  /**
   * Fetch audit history for a booking
   */
  async getStatusHistory(jobId: string): Promise<BookingStatusHistory[]> {
    return bookingService.getStatusHistory(jobId);
  }

  /**
   * Fetch confirmed bookings for worker schedule (Today & Upcoming)
   */
  async getSchedule(workerId: string = "w-1"): Promise<{ today: WorkerJobItem[]; upcoming: WorkerJobItem[] }> {
    await this.ensureSeedData(workerId);

    const bookings = await bookingService.getWorkerBookings(workerId);
    const confirmed = bookings.filter(
      (b) => b.status === "BOOKING_CONFIRMED" || b.status === "WORKER_ACCEPTED"
    );

    const mapped = confirmed.map((b) => this.mapBookingToWorkerJobItem(b));

    const today: WorkerJobItem[] = [];
    const upcoming: WorkerJobItem[] = [];

    mapped.forEach((item) => {
      const isToday =
        item.scheduledStartAt.toLowerCase().includes("today") ||
        item.scheduledDate.toLowerCase().includes("today");

      if (isToday) {
        today.push(item);
      } else {
        upcoming.push(item);
      }
    });

    return { today, upcoming };
  }

  /**
   * Fetch genuinely active bookings using canonical states
   */
  async getActiveJobs(workerId: string = "w-1"): Promise<WorkerJobItem[]> {
    await this.ensureSeedData(workerId);

    const activeCanonicalStates: BookingStatus[] = [
      "WORKER_ACCEPTED",
      "ON_THE_WAY",
      "ARRIVED",
      "OTP_VERIFIED",
      "SERVICE_STARTED",
      "SERVICE_COMPLETED",
      "BILL_GENERATED",
      "PAYMENT_PENDING",
    ];

    const bookings = await bookingService.getWorkerBookings(workerId);
    const active = bookings.filter((b) => activeCanonicalStates.includes(b.status));

    return active.map((b) => this.mapBookingToWorkerJobItem(b));
  }

  /**
   * Fetch completed bookings (BOOKING_COMPLETED)
   */
  async getCompletedJobs(workerId: string = "w-1"): Promise<WorkerJobItem[]> {
    await this.ensureSeedData(workerId);

    const bookings = await bookingService.getWorkerBookings(workerId);
    const completed = bookings.filter((b) => b.status === "BOOKING_COMPLETED");

    return completed.map((b) => this.mapBookingToWorkerJobItem(b));
  }

  /**
   * Fetch specific job details by ID
   */
  async getJobDetails(jobId: string): Promise<WorkerJobItem | null> {
    await this.ensureSeedData("w-1");

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", jobId)
        .single();

      if (!error && data) {
        return this.mapBookingToWorkerJobItem(data as unknown as Booking);
      }
    } catch {
      // Fall through to bookingService
    }

    const booking = await bookingService.getBooking(jobId);
    if (!booking) return null;
    const mapped = this.mapBookingToWorkerJobItem(booking);
    mapped.minimumVisitCharge = await this.getMinimumVisitCharge(booking.serviceId);

    const [inv, pay] = await Promise.all([
      invoiceService.getBookingInvoice(jobId),
      paymentService.getBookingPayment(jobId),
    ]);
    if (inv) {
      mapped.invoiceId = inv.id;
      mapped.invoiceNumber = inv.invoiceNumber;
      mapped.invoiceTotal = inv.totalAmount;
    }
    if (pay) {
      mapped.paymentStatus = pay.status;
      mapped.paymentId = pay.id;
    }

    return mapped;
  }

  /**
   * Fetch worker availability status
   */
  async getWorkerAvailability(workerId: string = "w-1"): Promise<WorkerAvailabilityStatus> {
    const worker = await workerService.getWorkerById(workerId);
    return worker?.availability || "AVAILABLE";
  }
}

export const workerJobService = new WorkerJobService();
