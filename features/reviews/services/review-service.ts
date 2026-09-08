import { bookingService } from "../../bookings/services/booking-service";
import { AppError } from "../../../lib/errors";

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  workerId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface CreateReviewPayload {
  bookingId: string;
  customerId: string;
  workerId: string;
  rating: number;
  comment?: string;
}

export interface IReviewService {
  createReview(payload: CreateReviewPayload): Promise<Review>;
  getBookingReview(bookingId: string): Promise<Review | null>;
  getWorkerReviews(workerId: string): Promise<Review[]>;
  getAverageRatingForWorker(workerId: string): Promise<number>;
}

const LOCAL_STORAGE_REVIEWS_KEY = "kaushalyasetu_reviews_db";

export class ReviewService implements IReviewService {
  private mockReviews: Map<string, Review> = new Map();

  constructor() {}


  async createReview(payload: CreateReviewPayload): Promise<Review> {
    const booking = await bookingService.getBooking(payload.bookingId);
    if (!booking) {
      throw new AppError("Booking not found", "NOT_FOUND", 404);
    }

    if (booking.status !== "BOOKING_COMPLETED" && booking.status !== "PAYMENT_RECEIVED") {
      throw new AppError(
        "Reviews can only be submitted for completed bookings",
        "BUSINESS_RULE_VIOLATION",
        400
      );
    }

    const existing = Array.from(this.mockReviews.values()).find((r) => r.bookingId === payload.bookingId);
    if (existing) {
      throw new AppError("You have already submitted a review for this booking", "BUSINESS_RULE_VIOLATION", 400);
    }

    if (payload.rating < 1 || payload.rating > 5) {
      throw new AppError("Rating must be between 1 and 5", "VALIDATION_ERROR", 400);
    }

    let dbReview: Review | null = null;
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("reviews") as any)
        .insert({
          booking_id: payload.bookingId.startsWith("bk-") ? null : payload.bookingId,
          customer_id: payload.customerId,
          worker_id: payload.workerId.startsWith("w-") ? null : payload.workerId,
          rating: payload.rating,
          comment: payload.comment || null,
        })
        .select()
        .single();

      if (!error && data) {
        dbReview = {
          id: data.id,
          bookingId: data.booking_id || payload.bookingId,
          customerId: data.customer_id,
          workerId: data.worker_id || payload.workerId,
          rating: data.rating,
          comment: data.comment,
          createdAt: data.created_at,
        };
      }
    } catch (err) {
      console.warn("DB createReview insert notice:", err);
    }

    const review: Review = dbReview || {
      id: `rev-${Date.now()}`,
      bookingId: payload.bookingId,
      customerId: payload.customerId,
      workerId: payload.workerId,
      rating: payload.rating,
      comment: payload.comment,
      createdAt: new Date().toISOString(),
    };

    this.mockReviews.set(review.id, review);
    return review;
  }

  async getBookingReview(bookingId: string): Promise<Review | null> {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("reviews") as any)
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (!error && data) {
        const mapped: Review = {
          id: data.id,
          bookingId: data.booking_id,
          customerId: data.customer_id,
          workerId: data.worker_id,
          rating: data.rating,
          comment: data.comment,
          createdAt: data.created_at,
        };
        this.mockReviews.set(mapped.id, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn("DB getBookingReview query notice:", err);
    }
    return Array.from(this.mockReviews.values()).find((r) => r.bookingId === bookingId) || null;
  }

  async getWorkerReviews(workerId: string): Promise<Review[]> {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("reviews") as any)
        .select("*")
        .eq("worker_id", workerId)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dbReviews: Review[] = data.map((r: any) => ({
          id: r.id,
          bookingId: r.booking_id,
          customerId: r.customer_id,
          workerId: r.worker_id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.created_at,
        }));
        dbReviews.forEach((r) => this.mockReviews.set(r.id, r));
        return dbReviews;
      }
    } catch (err) {
      console.warn("DB getWorkerReviews query notice:", err);
    }
    return Array.from(this.mockReviews.values()).filter((r) => r.workerId === workerId);
  }

  async getAverageRatingForWorker(workerId: string): Promise<number> {
    const reviews = await this.getWorkerReviews(workerId);
    if (reviews.length === 0) return 5.0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }
}

export const reviewService = new ReviewService();
