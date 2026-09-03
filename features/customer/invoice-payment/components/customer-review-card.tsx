"use client";

import * as React from "react";
import { Star, MessageSquare, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { reviewService, Review } from "@/features/reviews/services/review-service";
import { Booking } from "@/features/bookings/services/booking-service";

export interface CustomerReviewCardProps {
  booking: Booking;
  customerId: string;
}

export function CustomerReviewCard({ booking, customerId }: CustomerReviewCardProps) {
  const [existingReview, setExistingReview] = React.useState<Review | null>(null);
  const [rating, setRating] = React.useState<number>(5);
  const [hoverRating, setHoverRating] = React.useState<number>(0);
  const [comment, setComment] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(true);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState<boolean>(false);

  const fetchReview = React.useCallback(async () => {
    try {
      setLoading(true);
      const rev = await reviewService.getBookingReview(booking.id);
      if (rev) {
        setExistingReview(rev);
        setSubmitted(true);
      }
    } catch (err) {
      console.error("Failed to fetch existing review", err);
    } finally {
      setLoading(false);
    }
  }, [booking.id]);

  React.useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  const handleSubmitReview = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const created = await reviewService.createReview({
        bookingId: booking.id,
        customerId,
        workerId: booking.workerId || "w-plumber-1",
        rating,
        comment,
      });
      setExistingReview(created);
      setSubmitted(true);
    } catch (err: any) {
      console.error("Failed to submit review", err);
      setError(err?.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Only allow review when booking is completed/paid
  const isEligible = booking.status === "BOOKING_COMPLETED" || booking.status === "PAYMENT_RECEIVED";

  if (!isEligible) {
    return null;
  }

  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden space-y-4">
      <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
            How was your experience?
          </CardTitle>
        </div>
        <span className="text-[11px] text-slate-400 font-semibold">
          Worker: {booking.workerName || "Ramesh Patel"}
        </span>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-lg border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {submitted || existingReview ? (
          <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Thank you for your feedback! Your review has been recorded.</span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= (existingReview?.rating || rating)
                        ? "text-amber-500 fill-amber-500"
                        : "text-slate-300 dark:text-slate-700"
                    }`}
                  />
                ))}
                <span className="font-bold text-slate-900 dark:text-white ml-1.5 text-xs">
                  {existingReview?.rating || rating} / 5 Stars
                </span>
              </div>

              {existingReview?.comment && (
                <p className="text-slate-600 dark:text-slate-300 italic text-xs pt-1">
                  &quot;{existingReview.comment}&quot;
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Rate the trade service performed by <strong className="text-slate-900 dark:text-white">{booking.workerName || "Ramesh Patel"}</strong>. Your feedback helps maintain high cooperative quality standards.
            </p>

            {/* 1-5 Star Interactive Selector */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase block">Rating Score</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = star <= (hoverRating || rating);
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          active
                            ? "text-amber-500 fill-amber-500"
                            : "text-slate-300 dark:text-slate-700 hover:text-amber-400"
                        }`}
                      />
                    </button>
                  );
                })}
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-2 font-mono">
                  {rating} of 5 Stars
                </span>
              </div>
            </div>

            {/* Written Feedback Textarea */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase block">Written Feedback (Optional)</label>
              <textarea
                rows={3}
                placeholder="Share specific details about punctuality, work quality, cleanliness, or professionalism..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <Button
              disabled={submitting}
              onClick={handleSubmitReview}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6 py-2.5 shadow-md gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {submitting ? "Submitting Review..." : "Submit Worker Review"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
