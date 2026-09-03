"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  MapPin,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Phone,
  Navigation,
  KeyRound,
  Play,
  CheckCheck,
  Receipt,
} from "lucide-react";
import { bookingService, Booking } from "@/features/bookings/services/booking-service";
import { BookingStatusTimeline } from "./components/booking-status-timeline";
import { EstimateComparisonCard } from "./components/estimate-comparison-card";
import { SimulateEstimateButton } from "./components/simulate-estimate-button";
import { TrackingMapCard } from "./components/tracking-map-card";
import { DevSimulationControls } from "./components/dev-simulation-controls";

export interface BookingStatusViewProps {
  bookingId: string;
}

export function BookingStatusView({ bookingId }: BookingStatusViewProps) {
  const router = useRouter();

  const [booking, setBooking] = React.useState<Booking | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);

  const fetchBooking = React.useCallback(async () => {
    try {
      const data = await bookingService.getBooking(bookingId);
      setBooking(data);
    } catch (err) {
      console.error("Failed to fetch booking details", err);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  // Initial fetch and 3-second polling for live estimate & status updates
  React.useEffect(() => {
    fetchBooking();
    const interval = setInterval(fetchBooking, 3000);
    return () => clearInterval(interval);
  }, [fetchBooking]);

  const handleConfirmBooking = async () => {
    if (!booking) return;
    setActionLoading(true);
    try {
      await bookingService.confirmBooking(booking.id, booking.customerId || "cust-1");
      await fetchBooking();
    } catch (err) {
      console.error("Failed to confirm booking", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineEstimate = async () => {
    if (!booking) return;
    setActionLoading(true);
    try {
      await bookingService.declineWorkerEstimate(booking.id, booking.customerId || "cust-1");
      router.push("/customer/find-worker");
    } catch (err) {
      console.error("Failed to decline estimate", err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 rounded-xl space-y-3">
        <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading booking status details...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 rounded-xl space-y-3">
        <p className="text-xs text-slate-500">Booking record not found.</p>
        <Button size="sm" onClick={() => router.push("/customer")} className="text-xs">
          Return to Customer Portal
        </Button>
      </div>
    );
  }

  const isConfirmed = booking.status === "BOOKING_CONFIRMED";
  const isPendingConfirmation = booking.status === "CUSTOMER_CONFIRMATION_PENDING" || (Boolean(booking.workerEstimateAmount) && booking.status !== "BOOKING_CONFIRMED" && booking.status !== "WORKER_ACCEPTED" && booking.status !== "ON_THE_WAY" && booking.status !== "ARRIVED" && booking.status !== "OTP_VERIFIED" && booking.status !== "SERVICE_STARTED" && booking.status !== "SERVICE_COMPLETED");
  const isExecutionStarted = [
    "BOOKING_CONFIRMED",
    "WORKER_ACCEPTED",
    "ON_THE_WAY",
    "ARRIVED",
    "OTP_VERIFIED",
    "SERVICE_STARTED",
    "SERVICE_COMPLETED",
  ].includes(booking.status);

  const getStatusContextMessage = () => {
    switch (booking.status) {
      case "BOOKING_CONFIRMED":
        return "Your booking is confirmed. The worker will accept the job schedule shortly.";
      case "WORKER_ACCEPTED":
        return "Your worker has accepted the job schedule and is preparing to travel.";
      case "ON_THE_WAY":
        return "Your worker is on the way to your location.";
      case "ARRIVED":
        return "Your worker has arrived at your address. Please verify the service start using the OTP.";
      case "OTP_VERIFIED":
        return "Worker verified. Service can now begin.";
      case "SERVICE_STARTED":
        return "Your service is currently in progress.";
      case "SERVICE_COMPLETED":
        return "Your requested service has been completed. Billing will be available next.";
      default:
        return "Your booking request is being processed.";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title={`Service Booking: ${booking.bookingNumber}`}
        description={`Status: ${booking.status.replace(/_/g, " ")}`}
        breadcrumbs={[
          { label: "Customer Portal", href: "/customer" },
          { label: "Bookings", href: "/customer" },
          { label: booking.bookingNumber },
        ]}
      />

      {/* Booking Status Lifecycle Timeline */}
      <BookingStatusTimeline currentStatus={booking.status} />

      {/* Contextual Status Alert Banner */}
      {isExecutionStarted && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-emerald-900 dark:text-emerald-200 block text-xs">
                {booking.status.replace(/_/g, " ")}
              </span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                {getStatusContextMessage()}
              </span>
            </div>
          </div>
          <Badge className="bg-emerald-700 text-white text-[10px] uppercase font-bold shrink-0">
            {booking.status}
          </Badge>
        </div>
      )}

      {/* Embedded Live Map Tracking Card */}
      {isExecutionStarted && (
        <TrackingMapCard
          status={booking.status}
          workerName={booking.workerName || "Ramesh Patel"}
          addressText={booking.addressText}
        />
      )}

      {/* Development Mode Worker Simulation Controls */}
      <DevSimulationControls booking={booking} onStatusUpdated={fetchBooking} />

      {/* Booking Overview Card */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Assigned Worker
            </span>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
              <User className="w-4 h-4 text-emerald-600" />
              {booking.workerName || "Ramesh Patel"}
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
              {booking.cooperativeName || "Satellite Artisans Cooperative Society"}
            </p>
          </div>

          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-xs font-bold py-1">
            {booking.status.replace(/_/g, " ")}
          </Badge>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Service Task</span>
            <p className="font-bold text-slate-900 dark:text-slate-100">
              {booking.serviceTitle || "Tap Repair & Leak Fix"}
            </p>
            {booking.problemDescription && (
              <p className="text-slate-500 font-normal italic">
                &quot;{booking.problemDescription}&quot;
              </p>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Service Location
            </span>
            <p className="font-bold text-slate-900 dark:text-slate-100">
              {booking.addressText || "Flat 402, Shivam Apartments, Satellite, Ahmedabad"}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Preferred Schedule
            </span>
            <p className="font-bold text-slate-900 dark:text-slate-100">
              {booking.scheduledStartAt.split("T")[0]}
            </p>
            <p className="text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-600" /> Morning Slot (09:00 AM - 12:00 PM)
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Service Start OTP</span>
            <p className="font-mono font-extrabold text-base text-emerald-800 dark:text-emerald-300">
              {booking.otpCode || "940218"}
            </p>
            <p className="text-[10px] text-slate-400">Share with worker upon arrival</p>
          </div>
        </div>
      </Card>

      {/* Estimate Comparison Card */}
      <EstimateComparisonCard booking={booking} />

      {/* Local Dev Simulator Helper Button (if estimate not submitted yet) */}
      {!isExecutionStarted && !booking.workerEstimateAmount && (
        <SimulateEstimateButton
          bookingId={booking.id}
          workerId={booking.workerId || "w-plumber-1"}
          onEstimateSubmitted={fetchBooking}
        />
      )}

      {/* Customer Confirmation Action Card */}
      {isPendingConfirmation && (
        <Card className="bg-emerald-900 text-white p-5 rounded-xl shadow-md space-y-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Worker Estimate Ready for Confirmation</h4>
              <p className="text-xs text-emerald-200 mt-0.5">
                The worker has submitted an estimate of ₹{booking.workerEstimateAmount}. Please review the estimate details and confirm your booking.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-emerald-800">
            <Button
              variant="ghost"
              size="sm"
              disabled={actionLoading}
              onClick={handleDeclineEstimate}
              className="text-xs text-rose-200 hover:text-white hover:bg-rose-950/60 gap-1"
            >
              <XCircle className="w-4 h-4" />
              Decline / Choose Another Worker
            </Button>

            <Button
              disabled={actionLoading}
              onClick={handleConfirmBooking}
              className="bg-white text-emerald-950 hover:bg-emerald-50 font-extrabold text-xs px-6 py-2.5 shadow-lg gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              {actionLoading ? "Confirming..." : "Confirm Booking"}
            </Button>
          </div>
        </Card>
      )}
      {/* Invoice & Payment Action Banner (SERVICE_COMPLETED, BILL_GENERATED, PAYMENT_PENDING, PAYMENT_RECEIVED, BOOKING_COMPLETED) */}
      {["SERVICE_COMPLETED", "BILL_GENERATED", "PAYMENT_PENDING", "PAYMENT_RECEIVED", "BOOKING_COMPLETED"].includes(booking.status) && (
        <Card className="bg-emerald-800 text-white p-5 rounded-xl shadow-md space-y-4">
          <div className="flex items-start gap-3">
            <Receipt className="w-6 h-6 text-emerald-300 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">
                {booking.status === "BOOKING_COMPLETED" ? "Tax Invoice & Settlement Complete" : "Tax Invoice & Bill Ready for Payment"}
              </h4>
              <p className="text-xs text-emerald-200 mt-0.5">
                {booking.status === "BOOKING_COMPLETED"
                  ? "Your booking has been completed and payment has been settled. View your tax invoice and worker review."
                  : "Your trade service has been completed by the worker. Review itemized charges, platform fee, GST tax, and pay your final bill."}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-emerald-700">
            <Button
              onClick={() => router.push(`/customer/bookings/${booking.id}/invoice`)}
              className="bg-white text-emerald-950 hover:bg-emerald-50 font-extrabold text-xs px-6 py-2 shadow-lg gap-2"
            >
              <Receipt className="w-4 h-4 text-emerald-700" />
              {booking.status === "BOOKING_COMPLETED" ? "View Tax Invoice & Review" : "View & Pay Tax Invoice"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
