import { describe, it, expect } from "vitest";
import { bookingService } from "../../features/bookings/services/booking-service";
import { pricingService } from "../../features/pricing/services/pricing-service";
import { matchingService } from "../../features/matching/services/matching-service";
import { paymentService } from "../../features/payments/services/payment-service";
import { invoiceService } from "../../features/invoices/services/invoice-service";
import { reviewService } from "../../features/reviews/services/review-service";
import { complaintService } from "../../features/complaints/services/complaint-service";
import { workerService } from "../../features/workforce/services/worker-service";

describe("Shared Business Services Suite", () => {
  describe("BookingService & State Machine", () => {
    it("creates a new booking in REQUEST_SENT status", async () => {
      const booking = await bookingService.createRequest({
        customerId: "cust-1",
        serviceId: "srv-1",
        federationId: "fed-1",
        addressId: "addr-1",
        scheduledStartAt: new Date().toISOString(),
        scheduledEndAt: new Date(Date.now() + 3600000).toISOString(),
        totalAmount: 500,
      });

      expect(booking.status).toBe("REQUEST_SENT");
      expect(booking.platformFee).toBe(25);
      expect(booking.workerEarnings).toBe(475);
    });

    it("allows valid transitions by authorized actors", async () => {
      const booking = await bookingService.createRequest({
        customerId: "cust-1",
        serviceId: "srv-1",
        federationId: "fed-1",
        addressId: "addr-1",
        scheduledStartAt: new Date().toISOString(),
        scheduledEndAt: new Date(Date.now() + 3600000).toISOString(),
        totalAmount: 500,
      });

      const updated = await bookingService.transitionStatus(
        booking.id,
        "WORKER_REVIEWING",
        "w-1",
        "WORKER"
      );
      expect(updated.status).toBe("WORKER_REVIEWING");
    });

    it("rejects unauthorized actor status transitions", async () => {
      const booking = await bookingService.createRequest({
        customerId: "cust-1",
        serviceId: "srv-1",
        federationId: "fed-1",
        addressId: "addr-1",
        scheduledStartAt: new Date().toISOString(),
        scheduledEndAt: new Date(Date.now() + 3600000).toISOString(),
        totalAmount: 500,
      });

      await expect(
        bookingService.transitionStatus(booking.id, "WORKER_ACCEPTED", "cust-1", "CUSTOMER")
      ).rejects.toThrow();
    });
  });

  describe("PricingService", () => {
    it("enforces minimum service visit charges in platform estimate", () => {
      const estimate = pricingService.calculatePlatformEstimate({
        serviceBasePrice: 100,
        minimumVisitCharge: 250,
      });

      expect(estimate.basePrice).toBe(250);
      expect(estimate.minimumVisitCharge).toBe(250);
    });

    it("computes final bill with materials, taxes, and discounts", () => {
      const bill = pricingService.calculateFinalBill({
        platformEstimate: 350,
        workerEstimate: 400,
        minimumVisitCharge: 200,
        materialCharges: 100,
        discountAmount: 50,
      });

      expect(bill.subtotal).toBe(500);
      expect(bill.platformFee).toBe(25);
      expect(bill.taxAmount).toBe(90);
      expect(bill.finalTotal).toBe(565);
    });
  });

  describe("MatchingService", () => {
    it("filters out inactive, unavailable, or out-of-radius workers and ranks candidates", async () => {
      const matches = await matchingService.findEligibleWorkers({
        serviceId: "srv-1",
        customerLatitude: 18.5204,
        customerLongitude: 73.8567,
        scheduledStartAt: new Date().toISOString(),
        scheduledEndAt: new Date(Date.now() + 3600000).toISOString(),
      });

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].worker.status).toBe("ACTIVE");
      expect(matches[0].worker.availability).toBe("AVAILABLE");
    });
  });

  describe("InvoiceService & PaymentService Post-Payment Workflow", () => {
    it("calculates invoice totals and executes atomic post-payment workflow", async () => {
      const invoice = await invoiceService.createInvoice({
        bookingId: "bk-1001",
        customerId: "cust-1",
        federationId: "fed-1",
        items: [{ description: "Electrical Repair", quantity: 2, unitPrice: 200 }],
      });

      expect(invoice.subtotal).toBe(400);
      expect(invoice.status).toBe("issued");

      const payment = await paymentService.createPaymentRecord({
        invoiceId: invoice.id,
        bookingId: "bk-1001",
        customerId: "cust-1",
        amount: invoice.totalAmount,
      });

      const processed = await paymentService.processMockPayment(payment.id, true);
      expect(processed.status).toBe("PAID");

      // Verify worker availability becomes AVAILABLE after payment/completion
      const worker = await workerService.getWorkerById("w-1");
      expect(worker?.availability).toBe("AVAILABLE");
    });
  });

  describe("ReviewService & ComplaintService", () => {
    it("rejects reviews for uncompleted bookings", async () => {
      await expect(
        reviewService.createReview({
          bookingId: "bk-1001",
          customerId: "cust-1",
          workerId: "w-1",
          rating: 5,
        })
      ).rejects.toThrow();
    });

    it("creates and resolves complaints with proper permissions", async () => {
      const complaint = await complaintService.createComplaint({
        raisedBy: "cust-1",
        category: "Delay",
        description: "Worker arrived late",
      });

      expect(complaint.status).toBe("OPEN");

      const resolved = await complaintService.updateStatus(
        complaint.id,
        "RESOLVED",
        "FEDERATION_ADMIN",
        "Resolved with apology voucher"
      );

      expect(resolved.status).toBe("RESOLVED");
    });
  });
});
