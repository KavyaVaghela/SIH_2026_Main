"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowLeft, CheckCircle2 } from "lucide-react";
import { bookingService, Booking } from "@/features/bookings/services/booking-service";
import { invoiceService, Invoice } from "@/features/invoices/services/invoice-service";
import { InvoiceBreakdownCard } from "./components/invoice-breakdown-card";
import { PaymentSection } from "./components/payment-section";
import { CustomerReviewCard } from "./components/customer-review-card";

export interface InvoicePaymentViewProps {
  bookingId: string;
}

export function InvoicePaymentView({ bookingId }: InvoicePaymentViewProps) {
  const router = useRouter();

  const [booking, setBooking] = React.useState<Booking | null>(null);
  const [invoice, setInvoice] = React.useState<Invoice | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const initInvoiceData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let b = await bookingService.getBooking(bookingId);
      if (!b) {
        setError(`Booking ${bookingId} not found.`);
        return;
      }

      // If status is SERVICE_COMPLETED, automatically generate invoice and move to BILL_GENERATED -> PAYMENT_PENDING
      if (b.status === "SERVICE_COMPLETED") {
        try {
          const laborAmount = b.workerEstimateLabor || Math.round(b.totalAmount * 0.7);
          const materialAmount = b.workerEstimateMaterials || Math.round(b.totalAmount * 0.3);

          await invoiceService.createInvoice({
            bookingId: b.id,
            customerId: b.customerId || "cust-1",
            federationId: b.federationId || "fed-ahm-1",
            items: [
              {
                description: `Labor & Expertise: ${b.serviceTitle || "Trade Service"}`,
                quantity: 1,
                unitPrice: laborAmount,
              },
              {
                description: "Materials & Replacement Hardware Parts",
                quantity: 1,
                unitPrice: materialAmount,
              },
            ],
          });

          // Transition lifecycle to BILL_GENERATED then PAYMENT_PENDING
          await bookingService.transitionStatus(b.id, "BILL_GENERATED", b.customerId || "cust-1", "CUSTOMER", "Bill generated");
          b = await bookingService.transitionStatus(b.id, "PAYMENT_PENDING", b.customerId || "cust-1", "CUSTOMER", "Awaiting customer payment");
        } catch (err) {
          console.error("Error generating invoice on SERVICE_COMPLETED", err);
        }
      }

      setBooking(b);

      // Fetch created/existing invoice
      const inv = await invoiceService.getBookingInvoice(bookingId);
      setInvoice(inv);
    } catch (err: any) {
      console.error("Failed to load invoice payment details", err);
      setError(err?.message || "Failed to load invoice payment details.");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  React.useEffect(() => {
    initInvoiceData();
  }, [initInvoiceData]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 rounded-xl space-y-3">
        <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Generating tax invoice & billing summary...</p>
      </div>
    );
  }

  if (error || !booking || !invoice) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 rounded-xl space-y-3">
        <p className="text-xs text-slate-500">{error || "Invoice record not found."}</p>
        <Button size="sm" onClick={() => router.push("/customer")} className="text-xs">
          Return to Customer Portal
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title={`Tax Invoice #${invoice.invoiceNumber}`}
        description={`Booking Reference: ${booking.bookingNumber}`}
        breadcrumbs={[
          { label: "Customer Portal", href: "/customer" },
          { label: "Bookings", href: "/customer" },
          { label: booking.bookingNumber, href: `/customer/bookings/${booking.id}` },
          { label: "Invoice & Payment" },
        ]}
      />

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/customer/bookings/${booking.id}`)}
          className="text-xs gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Service Lifecycle
        </Button>

        {booking.status === "BOOKING_COMPLETED" && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Booking Completed & Settled</span>
          </div>
        )}
      </div>

      {/* Itemized Invoice Breakdown Card */}
      <InvoiceBreakdownCard invoice={invoice} booking={booking} />

      {/* Secure Payment Gateway & Settlement Section */}
      <PaymentSection
        invoice={invoice}
        bookingId={booking.id}
        customerId={booking.customerId || "cust-1"}
        onPaymentCompleted={initInvoiceData}
      />

      {/* Customer Review & Worker Rating Component */}
      <CustomerReviewCard booking={booking} customerId={booking.customerId || "cust-1"} />
    </div>
  );
}
