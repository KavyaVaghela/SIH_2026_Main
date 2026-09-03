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
} from "lucide-react";
import { useBookingDetail } from "../hooks/use-booking-detail";
import { BookingStatusBadge } from "./booking-status-badge";
import { BookingLifecycle } from "./booking-lifecycle";
import { BookingTimeline } from "./booking-timeline";

export function BookingDetailView() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";

  const { booking, timeline, isLoading, error } = useBookingDetail(id);

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
    </div>
  );
}
