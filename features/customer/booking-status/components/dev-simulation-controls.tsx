"use client";

import * as React from "react";
import {
  CheckCircle2,
  Navigation,
  MapPin,
  KeyRound,
  Play,
  CheckCheck,
  AlertCircle,
  ShieldCheck,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { bookingService, Booking } from "@/features/bookings/services/booking-service";
import { BookingStatus } from "@/supabase/types/database.types";

export interface DevSimulationControlsProps {
  booking: Booking;
  onStatusUpdated: () => void;
}

export function DevSimulationControls({
  booking,
  onStatusUpdated,
}: DevSimulationControlsProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [otpInput, setOtpInput] = React.useState("");

  const handleSimulateTransition = async (targetStatus: BookingStatus, notes: string) => {
    setLoading(true);
    setError(null);
    try {
      await bookingService.transitionStatus(
        booking.id,
        targetStatus,
        booking.workerId || "w-plumber-1",
        "WORKER",
        notes
      );
      onStatusUpdated();
    } catch (err: any) {
      console.error("Simulation transition failed", err);
      setError(err?.message || "Invalid state transition attempted.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      await bookingService.verifyOtp(booking.id, otpInput || booking.otpCode || "940218", booking.customerId || "cust-1");
      onStatusUpdated();
    } catch (err: any) {
      console.error("OTP verification failed", err);
      setError(err?.message || "Invalid OTP entered. Please verify code provided to your worker.");
    } finally {
      setLoading(false);
    }
  };

  // If status is terminal (SERVICE_COMPLETED, CANCELLED, etc.), hide simulator
  if (booking.status === "SERVICE_COMPLETED" || booking.status === "CANCELLED") {
    return null;
  }

  // Only show simulator after booking is confirmed (post Task 4)
  const isPostConfirmation = [
    "BOOKING_CONFIRMED",
    "WORKER_ACCEPTED",
    "ON_THE_WAY",
    "ARRIVED",
    "OTP_VERIFIED",
    "SERVICE_STARTED",
  ].includes(booking.status);

  if (!isPostConfirmation) return null;

  return (
    <Card className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 p-4 rounded-xl space-y-3">
      <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800 pb-2.5">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-amber-700 dark:text-amber-400" />
          <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
            Development Mode Simulation Panel
          </h4>
        </div>
        <Badge variant="outline" className="bg-amber-100 border-amber-300 text-amber-800 text-[9px] font-bold">
          Worker Dashboard Simulation
        </Badge>
      </div>

      <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed font-normal">
        Since worker actions originate from the Worker Portal, use these simulation controls to test the real canonical backend state machine transitions in local development.
      </p>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-lg border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: BOOKING_CONFIRMED -> WORKER_ACCEPTED */}
      {booking.status === "BOOKING_CONFIRMED" && (
        <Button
          size="sm"
          disabled={loading}
          onClick={() => handleSimulateTransition("WORKER_ACCEPTED", "Worker accepted job schedule")}
          className="bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs gap-1.5 w-full sm:w-auto"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {loading ? "Updating Status..." : "Simulate Worker Accepted (WORKER_ACCEPTED)"}
        </Button>
      )}

      {/* Step 2: WORKER_ACCEPTED -> ON_THE_WAY */}
      {booking.status === "WORKER_ACCEPTED" && (
        <Button
          size="sm"
          disabled={loading}
          onClick={() => handleSimulateTransition("ON_THE_WAY", "Worker traveling to service address")}
          className="bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs gap-1.5 w-full sm:w-auto"
        >
          <Navigation className="w-3.5 h-3.5" />
          {loading ? "Updating Status..." : "Simulate Worker On The Way (ON_THE_WAY)"}
        </Button>
      )}

      {/* Step 3: ON_THE_WAY -> ARRIVED */}
      {booking.status === "ON_THE_WAY" && (
        <Button
          size="sm"
          disabled={loading}
          onClick={() => handleSimulateTransition("ARRIVED", "Worker arrived at customer location")}
          className="bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs gap-1.5 w-full sm:w-auto"
        >
          <MapPin className="w-3.5 h-3.5" />
          {loading ? "Updating Status..." : "Simulate Worker Arrived (ARRIVED)"}
        </Button>
      )}

      {/* Step 4: ARRIVED -> OTP_VERIFIED (Customer OTP Verification UI) */}
      {booking.status === "ARRIVED" && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200">
            <KeyRound className="w-4 h-4 text-emerald-600" />
            <span>Service Start OTP Verification</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono text-sm font-bold tracking-widest text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 w-44"
            />

            <Button
              size="sm"
              disabled={loading}
              onClick={handleVerifyOtp}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              {loading ? "Verifying..." : "Verify OTP & Confirm Arrival"}
            </Button>
          </div>

          <p className="text-[11px] text-slate-500 font-normal">
            Customer Development OTP: <strong className="font-mono text-emerald-700">{booking.otpCode || "940218"}</strong> (or click verify above)
          </p>
        </div>
      )}

      {/* Step 5: OTP_VERIFIED -> SERVICE_STARTED */}
      {booking.status === "OTP_VERIFIED" && (
        <Button
          size="sm"
          disabled={loading}
          onClick={() => handleSimulateTransition("SERVICE_STARTED", "Worker commenced trade service")}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs gap-1.5 w-full sm:w-auto"
        >
          <Play className="w-3.5 h-3.5" />
          {loading ? "Updating Status..." : "Simulate Service Start (SERVICE_STARTED)"}
        </Button>
      )}

      {/* Step 6: SERVICE_STARTED -> SERVICE_COMPLETED */}
      {booking.status === "SERVICE_STARTED" && (
        <Button
          size="sm"
          disabled={loading}
          onClick={() => handleSimulateTransition("SERVICE_COMPLETED", "Worker completed trade service")}
          className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs gap-1.5 w-full sm:w-auto"
        >
          <CheckCheck className="w-4 h-4" />
          {loading ? "Updating Status..." : "Simulate Service Completion (SERVICE_COMPLETED)"}
        </Button>
      )}
    </Card>
  );
}
