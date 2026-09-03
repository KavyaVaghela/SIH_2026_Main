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

  constructor() {
    this.syncFromStorage();
  }

  private syncFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_REVIEWS_KEY);
      if (stored) {
        const parsed: Review[] = JSON.parse(stored);
        parsed.forEach((rev) => this.mockReviews.set(rev.id, rev));
      }
    } catch (err) {
      console.error("Error reading reviews from localStorage", err);
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      const array = Array.from(this.mockReviews.values());
      localStorage.setItem(LOCAL_STORAGE_REVIEWS_KEY, JSON.stringify(array));
    } catch (err) {
      console.error("Error writing reviews to localStorage", err);
    }
  }

  async createReview(payload: CreateReviewPayload): Promise<Review> {
    this.syncFromStorage();

    const booking = await bookingService.getBooking(payload.bookingId);
    if (!booking) {
      throw new AppError("Booking not found", "NOT_FOUND", 404);
    }

    // Require booking to be completed before allowing review
    if (booking.status !== "BOOKING_COMPLETED" && booking.status !== "PAYMENT_RECEIVED") {
      throw new AppError(
        "Reviews can only be submitted for completed bookings",
        "BUSINESS_RULE_VIOLATION",
        400
      );
    }

    // Prevent duplicate review for same booking
    const existing = Array.from(this.mockReviews.values()).find((r) => r.bookingId === payload.bookingId);
    if (existing) {
      throw new AppError("You have already submitted a review for this booking", "BUSINESS_RULE_VIOLATION", 400);
    }

    if (payload.rating < 1 || payload.rating > 5) {
      throw new AppError("Rating must be between 1 and 5", "VALIDATION_ERROR", 400);
    }

    const review: Review = {
      id: `rev-${Date.now()}`,
      bookingId: payload.bookingId,
      customerId: payload.customerId,
      workerId: payload.workerId,
      rating: payload.rating,
      comment: payload.comment,
      createdAt: new Date().toISOString(),
    };

    this.mockReviews.set(review.id, review);
    this.saveToStorage();
    return review;
  }

  async getBookingReview(bookingId: string): Promise<Review | null> {
    this.syncFromStorage();
    return Array.from(this.mockReviews.values()).find((r) => r.bookingId === bookingId) || null;
  }

  async getWorkerReviews(workerId: string): Promise<Review[]> {
    this.syncFromStorage();
    return Array.from(this.mockReviews.values()).filter((r) => r.workerId === workerId);
  }

  async getAverageRatingForWorker(workerId: string): Promise<number> {
    this.syncFromStorage();
    const reviews = await this.getWorkerReviews(workerId);
    if (reviews.length === 0) return 5.0; // Default baseline rating
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }
}

export const reviewService = new ReviewService();
