"use client";

import * as React from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bookingService } from "@/features/bookings/services/booking-service";

export interface SimulateEstimateButtonProps {
  bookingId: string;
  workerId?: string;
  onEstimateSubmitted: () => void;
}

export function SimulateEstimateButton({
  bookingId,
  workerId = "w-plumber-1",
  onEstimateSubmitted,
}: SimulateEstimateButtonProps) {
  const [loading, setLoading] = React.useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      await bookingService.submitWorkerEstimate({
        bookingId,
        workerId,
        totalAmount: 450,
        laborAmount: 300,
        materialAmount: 150,
        notes: "Detailed site assessment: includes standard labor + replacement washer & pipe coupling materials.",
      });
      onEstimateSubmitted();
    } catch (err) {
      console.error("Failed to simulate worker estimate", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-xl border border-amber-300 dark:border-amber-800 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="space-y-0.5">
        <span className="font-bold text-amber-900 dark:text-amber-200 block">
          Development Helper: Worker Simulation
        </span>
        <span className="text-[11px] text-amber-800 dark:text-amber-300">
          Simulate worker submitting a ₹450 estimate to test the Customer Confirmation stage.
        </span>
      </div>

      <Button
        size="sm"
        disabled={loading}
        onClick={handleSimulate}
        className="bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs px-4 gap-1.5 shrink-0"
      >
        <Send className="w-3.5 h-3.5" />
        {loading ? "Submitting Estimate..." : "Simulate Worker Estimate (₹450)"}
      </Button>
    </div>
  );
}
