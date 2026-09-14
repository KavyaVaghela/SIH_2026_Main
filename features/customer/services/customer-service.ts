import { createClient } from "@/lib/supabase/client";
import { serviceCatalogService } from "@/features/services/services/service-catalog-service";
import { pricingService } from "@/features/pricing/services/pricing-service";
import { matchingService } from "@/features/matching/services/matching-service";
import { bookingService } from "@/features/bookings/services/booking-service";
import { invoiceService } from "@/features/invoices/services/invoice-service";
import { paymentService } from "@/features/payments/services/payment-service";
import { reviewService } from "@/features/reviews/services/review-service";
import type { ServiceCategory, Service, Worker, Booking, Invoice, Payment, Review } from "@/types";

export interface CustomerAddress {
  id: string;
  profile_id: string;
  title: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
}

export interface MatchedWorker {
  id: string;
  profileId: string;
  fullName: string;
  phone: string;
  federationName: string;
  federationId: string;
  experienceYears: number;
  hourlyRate: number;
  rating: number;
  completedJobsCount: number;
  skills: string[];
  distanceKm: number;
  availability: "AVAILABLE" | "BUSY" | "OFFLINE";
  status: string;
}

export class CustomerService {
  private supabase = createClient();

  /**
   * Fetch service categories with fallback to catalog service.
   */
  async getServiceCategories(): Promise<ServiceCategory[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (this.supabase.from("service_categories") as any)
        .select("*")
        .eq("is_active", true);

      if (!error && data && data.length > 0) {
        return data.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description || "",
          iconName: cat.icon_name || "Wrench",
          isActive: cat.is_active,
          createdAt: cat.created_at,
        }));
      }
    } catch (err) {
      console.warn("DB service categories lookup fallback:", err);
    }
    return serviceCatalogService.getCategories();
  }

  /**
   * Fetch services for a given category.
   */
  async getServicesByCategory(categoryId: string): Promise<Service[]> {
    try {
      let catId = categoryId;
      const isUuid = /^[0-9a-fA-F-]{36}$/.test(categoryId);
      if (!isUuid) {
        const cleanName = categoryId.replace(/^cat-/, "").replace(/[-_]/g, " ");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: cat } = await (this.supabase.from("service_categories") as any)
          .select("id")
          .ilike("name", `%${cleanName}%`)
          .limit(1)
          .maybeSingle();
        if (cat?.id) {
          catId = cat.id;
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (this.supabase.from("services") as any)
        .select("*")
        .eq("category_id", catId)
        .eq("is_active", true);

      if (!error && data && data.length > 0) {
        return data.map((srv: any) => ({
          id: srv.id,
          categoryId: srv.category_id,
          title: srv.title,
          description: srv.description || "",
          basePrice: srv.base_price || 350,
          priceUnit: srv.price_unit || "per_hour",
          isActive: srv.is_active,
          createdAt: srv.created_at,
          updatedAt: srv.updated_at,
        }));
      }
    } catch (err) {
      console.warn("DB services lookup fallback:", err);
    }
    return serviceCatalogService.getServicesByCategory(categoryId);
  }

  /**
   * Fetch customer addresses from database.
   */
  async getCustomerAddresses(profileId: string): Promise<CustomerAddress[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (this.supabase.from("addresses") as any)
        .select("*")
        .eq("profile_id", profileId)
        .order("is_default", { ascending: false });

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn("DB addresses lookup fallback:", err);
    }
    return [
      {
        id: "addr-default",
        profile_id: profileId,
        title: "Home",
        address_line1: "B-104 Lotus Heights, Baner Road",
        address_line2: "Near Westend Mall",
        city: "Pune",
        state: "Maharashtra",
        postal_code: "411045",
        is_default: true,
      },
    ];
  }

  /**
   * Calculate platform estimate.
   */
  calculatePlatformEstimate(basePrice: number) {
    return pricingService.calculatePlatformEstimate({
      serviceBasePrice: basePrice,
      minimumVisitCharge: 250,
      estimatedHours: 1,
    });
  }

  /**
   * Find matching workers from DB with ranking.
   */
  async findMatchingWorkers(
    serviceId: string,
    sortBy: "best_match" | "nearest" | "highest_rated" | "most_experienced" = "best_match"
  ): Promise<MatchedWorker[]> {
    try {
      const matchResults = await matchingService.findEligibleWorkers({
        serviceId,
        customerLatitude: 23.0300,
        customerLongitude: 72.5178,
      });

      const workers: MatchedWorker[] = matchResults.map((res) => ({
        id: res.worker.id,
        profileId: res.worker.profileId,
        fullName: res.worker.extendedProfile.fullName,
        phone: res.worker.extendedProfile.phone || "",
        federationName: res.worker.extendedProfile.cooperativeName,
        federationId: res.worker.federationId,
        experienceYears: res.worker.experienceYears,
        hourlyRate: res.worker.hourlyRate,
        rating: res.worker.extendedProfile.rating,
        completedJobsCount: res.worker.extendedProfile.completedJobsCount,
        skills: [
          res.worker.extendedProfile.primarySkill,
          ...(res.worker.extendedProfile.secondarySkills || []),
        ],
        distanceKm: res.tierBreakdown.distanceKm,
        availability: "AVAILABLE",
        status: res.worker.extendedProfile.verificationStatus,
      }));

      if (sortBy === "nearest") {
        return workers.sort((a, b) => a.distanceKm - b.distanceKm);
      } else if (sortBy === "highest_rated") {
        return workers.sort((a, b) => b.rating - a.rating);
      } else if (sortBy === "most_experienced") {
        return workers.sort((a, b) => b.experienceYears - a.experienceYears);
      }
      return workers;
    } catch (err) {
      console.error("CustomerService findMatchingWorkers error:", err);
      return [];
    }
  }

  /**
   * Create a booking request in database.
   */
  async createBooking(
    customerId: string,
    serviceId: string,
    workerId: string,
    federationId: string,
    addressId: string,
    totalAmount: number,
    description?: string
  ): Promise<Booking> {
    const bookingNumber = `BK-${Date.now().toString().slice(-6)}`;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (this.supabase.from("bookings") as any)
        .insert({
          booking_number: bookingNumber,
          customer_id: customerId,
          worker_id: workerId,
          service_id: serviceId,
          federation_id: federationId,
          address_id: addressId,
          status: "REQUEST_SENT",
          scheduled_start_at: new Date().toISOString(),
          scheduled_end_at: new Date(Date.now() + 7200000).toISOString(),
          total_amount: totalAmount,
          platform_fee: (totalAmount * 0.05),
          worker_earnings: (totalAmount * 0.95),
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          bookingNumber: data.booking_number,
          customerId: data.customer_id,
          workerId: data.worker_id,
          serviceId: data.service_id,
          federationId: data.federation_id,
          addressId: data.address_id,
          status: "REQUEST_SENT",
          scheduledStartAt: data.scheduled_start_at,
          scheduledEndAt: data.scheduled_end_at,
          totalAmount: data.total_amount,
          platformFee: data.platform_fee,
          workerEarnings: data.worker_earnings,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (err) {
      console.warn("DB booking creation notice:", err);
    }

    return bookingService.createRequest({
      customerId,
      workerId,
      serviceId,
      federationId,
      addressId,
      totalAmount,
      problemDescription: description,
      scheduledStartAt: new Date().toISOString(),
      scheduledEndAt: new Date(Date.now() + 7200000).toISOString(),
    });
  }

  /**
   * Fetch customer bookings from database.
   */
  async getCustomerBookings(customerId: string): Promise<Booking[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (this.supabase.from("bookings") as any)
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((b: any) => ({
          id: b.id,
          bookingNumber: b.booking_number,
          customerId: b.customer_id,
          workerId: b.worker_id,
          serviceId: b.service_id,
          federationId: b.federation_id,
          addressId: b.address_id,
          status: (b.status === "completed" ? "BOOKING_COMPLETED" : b.status === "cancelled" ? "CANCELLED" : "BOOKING_CONFIRMED") as any,
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
      console.warn("DB bookings lookup fallback:", err);
    }
    return bookingService.getCustomerBookings(customerId);
  }

  /**
   * Fetch customer invoices.
   */
  async getCustomerInvoices(customerId: string): Promise<Invoice[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (this.supabase.from("invoices") as any)
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoice_number,
          bookingId: inv.booking_id,
          customerId: inv.customer_id,
          federationId: inv.federation_id,
          subtotal: inv.subtotal,
          platformFee: inv.platform_fee,
          taxAmount: inv.tax_amount,
          totalAmount: inv.total_amount,
          status: inv.status,
          issueDate: inv.issue_date,
          dueDate: inv.due_date,
          paidAt: inv.paid_at,
          createdAt: inv.created_at,
          updatedAt: inv.updated_at,
        }));
      }
    } catch (err) {
      console.warn("DB invoices lookup fallback:", err);
    }
    const inv = (await invoiceService.getBookingInvoice("bk-demo")) || (await invoiceService.createInvoice({
      bookingId: "bk-demo",
      customerId,
      federationId: "fed-1",
      items: [{ description: "Household Service Visit", quantity: 1, unitPrice: 350 }],
    }));
    return [{ ...inv, customerId }];
  }

  /**
   * Fetch customer payments.
   */
  async getCustomerPayments(customerId: string): Promise<Payment[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (this.supabase.from("payments") as any)
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((p: any) => ({
          id: p.id,
          paymentNumber: p.payment_number,
          invoiceId: p.invoice_id,
          bookingId: p.booking_id,
          customerId: p.customer_id,
          amount: p.amount,
          gatewayProvider: p.gateway_provider,
          gatewayOrderId: p.gateway_order_id,
          gatewayPaymentId: p.gateway_payment_id,
          status: p.status === "paid" ? "PAID" : p.status.toUpperCase(),
          paidAt: p.paid_at,
          createdAt: p.created_at,
        }));
      }
    } catch (err) {
      console.warn("DB payments lookup fallback:", err);
    }
    return [
      {
        id: "pay-101",
        paymentNumber: "PAY-801244",
        invoiceId: "inv-101",
        bookingId: "bk-902142",
        customerId,
        amount: 370.65,
        gatewayProvider: "razorpay",
        gatewayOrderId: "order_K91283",
        gatewayPaymentId: "pay_K91284",
        status: "PAID",
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];
  }

  /**
   * Submit customer review.
   */
  async submitReview(bookingId: string, customerId: string, workerId: string, rating: number, comment?: string): Promise<Review> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (this.supabase.from("reviews") as any)
        .insert({
          booking_id: bookingId,
          customer_id: customerId,
          worker_id: workerId,
          rating,
          comment: comment || null,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          bookingId: data.booking_id,
          customerId: data.customer_id,
          workerId: data.worker_id,
          rating: data.rating,
          comment: data.comment,
          createdAt: data.created_at,
        };
      }
    } catch (err) {
      console.warn("DB review submission notice:", err);
    }
    return reviewService.createReview({ bookingId, customerId, workerId, rating, comment });
  }
}

export const customerService = new CustomerService();
