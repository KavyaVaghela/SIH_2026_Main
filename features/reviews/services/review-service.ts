import type { Review } from "@/types";

export interface IReviewService {
  submitReview(bookingId: string, customerId: string, workerId: string, rating: number, comment?: string): Promise<Review>;
  getWorkerReviews(workerId: string): Promise<Review[]>;
}

export class ReviewService implements IReviewService {
  async submitReview(bookingId: string, customerId: string, workerId: string, rating: number, comment?: string): Promise<Review> {
    return {
      id: `rev-${Date.now()}`,
      bookingId,
      customerId,
      workerId,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };
  }

  async getWorkerReviews(workerId: string): Promise<Review[]> {
    return [
      {
        id: "rev-1",
        bookingId: "bk-1",
        customerId: "cust-1",
        workerId,
        rating: 5,
        comment: "Excellent cooperative electrical service!",
        createdAt: new Date().toISOString(),
      },
    ];
  }
}

export const reviewService = new ReviewService();
