"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  User,
  Building2,
  MapPin,
  Clock,
  Phone,
  Mail,
  Briefcase,
  ShieldCheck,
  CreditCard,
  Receipt,
  FileText,
  AlertCircle,
  Hash,
  Zap,
  UserPlus,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useBookingDetail } from "../hooks/use-booking-detail";
import { BookingStatusBadge } from "./booking-status-badge";
import { BookingLifecycle } from "./booking-lifecycle";
import { BookingTimeline } from "./booking-timeline";
import { Dialog } from "@/components/ui/dialog";
import { bookingService } from "@/features/bookings/services/booking-service";
import { createClient } from "@/lib/supabase/client";

export function BookingDetailView() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";

  const { booking, timeline, isLoading, error } = useBookingDetail(id);

  // Admin allocation state
  const [isAllocatingModalOpen, setIsAllocatingModalOpen] = React.useState(false);
  const [candidateWorkers, setCandidateWorkers] = React.useState<Array<{
    id: string;
    profession: string;
    hourly_rate: number | null;
    profiles: { full_name: string | null; phone: string | null } | null;
  }>>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = React.useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = React.useState("");
  const [allocationReason, setAllocationReason] = React.useState("Super Admin rapid emergency dispatch assistance");
  const [isSubmittingAllocation, setIsSubmittingAllocation] = React.useState(false);
  const [allocationError, setAllocationError] = React.useState<string | null>(null);
  const [allocationSuccess, setAllocationSuccess] = React.useState(false);

  const fetchAvailableWorkers = React.useCallback(async () => {
    setIsLoadingCandidates(true);
    setAllocationError(null);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchErr } = await (supabase.from("workers") as any)
        .select(`
          id,
          profession,
          hourly_rate,
          profiles!profile_id (full_name, phone)
        `)
        .eq("account_status", "ACTIVE")
        .eq("availability_status", "AVAILABLE")
        .eq("verification_status", "verified")
        .limit(25);

      if (fetchErr) {
        throw new Error(fetchErr.message);
      }
      setCandidateWorkers((data as any[]) || []);
    } catch (err: any) {
      setAllocationError(err.message || "Failed to load candidate workers");
    } finally {
      setIsLoadingCandidates(false);
    }
  }, []);

  const handleOpenAllocationModal = () => {
    setIsAllocatingModalOpen(true);
    setAllocationSuccess(false);
    setSelectedWorkerId("");
    fetchAvailableWorkers();
  };

  const handleConfirmAllocation = async () => {
    if (!selectedWorkerId || !booking) return;
    setIsSubmittingAllocation(true);
    setAllocationError(null);
    try {
      await bookingService.allocateWorker(
        booking.id,
        selectedWorkerId,
        "super-admin",
        allocationReason
      );
      setAllocationSuccess(true);
      setTimeout(() => {
        setIsAllocatingModalOpen(false);
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setAllocationError(err.message || "Failed to allocate worker. They may have been locked by another booking.");
    } finally {
      setIsSubmittingAllocation(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-80" />
        </div>
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-6 py-12 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-rose-600" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Booking Record Not Found</h2>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          {error || "The requested service booking could not be located or has been archived."}
        </p>
        <Link
          href="/super-admin/bookings"
          className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to Bookings Overview
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <PageHeader
        title={`Booking #${booking.bookingNumber}`}
        description={`Service: ${booking.serviceTitle} | Society: ${booking.societyName} | Scheduled: ${booking.scheduledStartAt}`}
        breadcrumbs={[
          { label: "Super Admin", href: "/super-admin" },
          { label: "Bookings", href: "/super-admin/bookings" },
          { label: booking.bookingNumber },
        ]}
        actions={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="border-emerald-800/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-semibold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Button>
          </div>
        }
      />

      {/* High Emergency Rapid Dispatch Alert Banner */}
      {booking.priority === "HIGH" && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-500/15 via-red-500/10 to-rose-500/15 border border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-lg animate-pulse shrink-0 shadow-sm shadow-rose-500/50">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400">
                  HIGH-PRIORITY RAPID RESPONSE EMERGENCY
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white tracking-wide uppercase">
                  P1 Rapid Dispatch
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automated matching engine engaged. {booking.workerId ? `Assigned craftsman: ${booking.workerName}. Dispatched to job site.` : "Craftsman pending allocation. Immediate administrative action recommended."}
              </p>
            </div>
          </div>
          {!booking.workerId && (
            <Button
              size="sm"
              onClick={handleOpenAllocationModal}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 shadow-sm"
            >
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              Allocate Worker Now
            </Button>
          )}
        </div>
      )}

      {/* Service Lifecycle Progress Pipeline */}
      <BookingLifecycle status={booking.status} />

      {/* Main Grid: Details Left (2 cols), Stakeholders & Financials Right (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Service Details & Status Timeline */}
        <div className="space-y-6 lg:col-span-2">
          {/* Service Information Card */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-foreground flex items-center space-x-2">
                <FileText className="h-5 w-5 text-emerald-700" />
                <span>Service Execution Details</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <BookingStatusBadge type="status" status={booking.status} />
                <BookingStatusBadge type="payment" status={booking.paymentStatus} />
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Service Title</span>
                  <p className="text-sm font-bold text-foreground">{booking.serviceTitle}</p>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground">Category</span>
                  <p className="text-sm font-semibold text-foreground">{booking.serviceCategory}</p>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground">Scheduled Window</span>
                  <p className="text-xs font-medium text-foreground flex items-center mt-1">
                    <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    {booking.scheduledStartAt} – {booking.scheduledEndAt}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground">Security Handshake OTP</span>
                  <p className="text-xs font-mono font-bold text-foreground flex items-center mt-1">
                    <Hash className="h-3.5 w-3.5 mr-1 text-purple-600" />
                    {booking.otpCode ? (
                      <span className="bg-purple-50 dark:bg-purple-950 border border-purple-200 px-2 py-0.5 rounded text-purple-800 dark:text-purple-300">
                        {booking.otpCode}
                      </span>
                    ) : (
                      <span className="text-muted-foreground font-normal">Pending Generation</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Customer Problem Description */}
              <div className="pt-3 border-t space-y-1.5">
                <span className="text-xs text-muted-foreground font-semibold">
                  Customer Job / Problem Description
                </span>
                <p className="text-xs text-foreground bg-muted/30 p-3 rounded-lg border leading-relaxed">
                  {booking.problemDescription || "No additional problem notes specified by customer."}
                </p>
              </div>

              {/* Actual Timestamps if recorded */}
              {(booking.actualStartAt || booking.actualEndAt) && (
                <div className="pt-3 border-t grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Actual On-Site Start:</span>
                    <p className="font-semibold text-foreground mt-0.5">{booking.actualStartAt || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Actual Job End / Sign-Off:</span>
                    <p className="font-semibold text-foreground mt-0.5">{booking.actualEndAt || "N/A"}</p>
                  </div>
                </div>
              )}

              {/* Location Address */}
              <div className="pt-3 border-t space-y-1">
                <span className="text-xs text-muted-foreground">Job Site Location</span>
                <p className="text-xs font-medium text-foreground flex items-start">
                  <MapPin className="h-4 w-4 mr-1 text-emerald-700 shrink-0 mt-0.5" />
                  {booking.addressDetails || booking.location}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Chronological Audit Trail & Status Timeline */}
          <BookingTimeline timeline={timeline} />
        </div>

        {/* Right Column: Stakeholders & Financials */}
        <div className="space-y-6">
          {/* Customer Card */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold text-foreground flex items-center space-x-2">
                <User className="h-4 w-4 text-emerald-700" />
                <span>Customer Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs">
              <p className="text-sm font-bold text-foreground">{booking.customerName}</p>
              <div className="flex items-center space-x-2 text-muted-foreground pt-1">
                <Phone className="h-3.5 w-3.5 text-emerald-700" />
                <span className="font-semibold text-foreground">{booking.customerPhone || "N/A"}</span>
              </div>
              {booking.customerEmail && (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 text-emerald-700" />
                  <span>{booking.customerEmail}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Worker Card */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold text-foreground flex items-center space-x-2">
                <Briefcase className="h-4 w-4 text-emerald-700" />
                <span>Assigned Cooperative Worker</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              {booking.workerId && booking.workerName ? (
                <>
                  <div>
                    <Link
                      href={`/super-admin/workforce/${booking.workerId}`}
                      className="text-sm font-bold text-foreground hover:text-emerald-700 hover:underline"
                    >
                      {booking.workerName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{booking.workerProfession}</p>
                  </div>

                  {booking.workerPhone && (
                    <div className="flex items-center space-x-2 text-muted-foreground pt-1 border-t">
                      <Phone className="h-3.5 w-3.5 text-emerald-700" />
                      <span className="font-semibold text-foreground">{booking.workerPhone}</span>
                    </div>
                  )}

                  <div className="pt-2">
                    <Link
                      href={`/super-admin/workforce/${booking.workerId}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "w-full text-xs font-semibold"
                      )}
                    >
                      Inspect Worker Profile
                    </Link>
                  </div>
                </>
              ) : (
                <div className="py-3 text-center space-y-2">
                  <Clock className="h-6 w-6 text-amber-500 mx-auto" />
                  <p className="font-bold text-xs text-foreground">Dispatch Allocation Pending</p>
                  <p className="text-[11px] text-muted-foreground">
                    A matching cooperative craftsman has not yet been accepted for this booking.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenAllocationModal}
                    className="mt-2 text-xs font-semibold border-emerald-700/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 w-full"
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                    Assist Worker Allocation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cooperative Society Card */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold text-foreground flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-emerald-700" />
                <span>Cooperative Society</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs">
              <Link
                href={`/super-admin/societies/${booking.societyId}`}
                className="text-sm font-bold text-foreground hover:text-emerald-700 hover:underline block"
              >
                {booking.societyName}
              </Link>
              <p className="text-muted-foreground">Region: {booking.location}</p>
              <div className="pt-2">
                <Link
                  href={`/super-admin/societies/${booking.societyId}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "w-full text-xs font-semibold"
                  )}
                >
                  Inspect Society Registry
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Payment & Financials Monitoring Card */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold text-foreground flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-emerald-700" />
                <span>Payment & Financial Escrow</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-xs text-muted-foreground">Payment Status</span>
                <BookingStatusBadge type="payment" status={booking.paymentStatus} />
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer Total Amount</span>
                  <span className="font-mono font-bold text-foreground">₹{booking.totalAmount}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Cooperative Platform Fee (15%)</span>
                  <span className="font-mono">₹{booking.platformFee}</span>
                </div>
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold border-t pt-1.5">
                  <span>Worker Net Payout (85%)</span>
                  <span className="font-mono">₹{booking.workerEarnings}</span>
                </div>
              </div>

              {booking.paymentDetails && (
                <div className="p-3 rounded-lg bg-muted/40 border text-[11px] space-y-1 mt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gateway:</span>
                    <span className="font-semibold text-foreground">
                      {booking.paymentDetails.gatewayProvider || "Razorpay Escrow"}
                    </span>
                  </div>
                  {booking.paymentDetails.invoiceNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Invoice:</span>
                      <span className="font-mono font-semibold text-foreground">
                        {booking.paymentDetails.invoiceNumber}
                      </span>
                    </div>
                  )}
                  {booking.paymentDetails.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Settled At:</span>
                      <span className="font-medium text-foreground">{booking.paymentDetails.paidAt}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Admin Worker Allocation Dialog */}
      <Dialog
        isOpen={isAllocatingModalOpen}
        onClose={() => setIsAllocatingModalOpen(false)}
        title="Admin Worker Allocation Assistant"
        description={`Allocate a verified cooperative craftsman to Emergency Booking #${booking.bookingNumber}`}
      >
        <div className="space-y-4 py-2">
          {allocationError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{allocationError}</span>
            </div>
          )}

          {allocationSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Craftsman successfully allocated! Refreshing booking record...</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">
              Select Available Verified Craftsman
            </label>
            {isLoadingCandidates ? (
              <div className="flex items-center justify-center p-8 text-muted-foreground text-xs space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                <span>Scanning active workforce roster...</span>
              </div>
            ) : candidateWorkers.length === 0 ? (
              <div className="p-4 rounded-lg bg-muted/40 text-center text-xs text-muted-foreground">
                No currently available verified workers found.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {candidateWorkers.map((w) => {
                  const name = w.profiles?.full_name || "Cooperative Craftsman";
                  const phone = w.profiles?.phone || "No phone listed";
                  const isSelected = selectedWorkerId === w.id;
                  return (
                    <div
                      key={w.id}
                      onClick={() => setSelectedWorkerId(w.id)}
                      className={cn(
                        "p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between",
                        isSelected
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-600"
                          : "border-border hover:bg-muted/40"
                      )}
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-foreground">{name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {w.profession} • {phone}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                          AVAILABLE
                        </span>
                        {w.hourly_rate && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            ₹{w.hourly_rate}/hr
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t">
            <label className="text-xs font-semibold text-foreground">
              Allocation / Intervention Reason
            </label>
            <input
              type="text"
              value={allocationReason}
              onChange={(e) => setAllocationReason(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-600"
              placeholder="E.g. Rapid emergency dispatch assistance"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAllocatingModalOpen(false)}
              disabled={isSubmittingAllocation}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmAllocation}
              disabled={!selectedWorkerId || isSubmittingAllocation || allocationSuccess}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
            >
              {isSubmittingAllocation ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Allocating...
                </>
              ) : (
                "Confirm Craftsman Allocation"
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
