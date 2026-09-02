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
  getWorkerReviews(workerId: string): Promise<Review[]>;
  getAverageRatingForWorker(workerId: string): Promise<number>;
}

export class ReviewService implements IReviewService {
  private mockReviews: Map<string, Review> = new Map();

  async createReview(payload: CreateReviewPayload): Promise<Review> {
    const booking = await bookingService.getBooking(payload.bookingId);
    if (!booking) {
      throw new AppError("Booking not found", "NOT_FOUND", 404);
    }

    // Require booking to be completed before allowing review
    if (booking.status !== "BOOKING_COMPLETED" && booking.status !== "PAYMENT_RECEIVED") {
      throw new AppError(
        "Reviews can only be submitted for completed or paid bookings",
        "BUSINESS_RULE_VIOLATION",
        400
      );
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
    return review;
  }

  async getWorkerReviews(workerId: string): Promise<Review[]> {
    return Array.from(this.mockReviews.values()).filter((r) => r.workerId === workerId);
  }

  async getAverageRatingForWorker(workerId: string): Promise<number> {
    const reviews = await this.getWorkerReviews(workerId);
    if (reviews.length === 0) return 5.0; // Default baseline rating
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }
}

export const reviewService = new ReviewService();
