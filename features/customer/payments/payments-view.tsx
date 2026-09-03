"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Receipt,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  FileText,
  DollarSign,
} from "lucide-react";
import { invoiceService, Invoice } from "@/features/invoices/services/invoice-service";
import { paymentService, PaymentRecord } from "@/features/payments/services/payment-service";
import { bookingService, Booking } from "@/features/bookings/services/booking-service";

export function PaymentsView() {
  const router = useRouter();

  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [payments, setPayments] = React.useState<PaymentRecord[]>([]);
  const [bookingsMap, setBookingsMap] = React.useState<Map<string, Booking>>(new Map());
  const [loading, setLoading] = React.useState<boolean>(true);
  const [filter, setFilter] = React.useState<"ALL" | "PENDING" | "PAID">("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const customerBookings = await bookingService.getCustomerBookings("cust-1");
      const bMap = new Map<string, Booking>();
      customerBookings.forEach((b) => bMap.set(b.id, b));
      setBookingsMap(bMap);

      const invList: Invoice[] = [];
      for (const b of customerBookings) {
        const inv = await invoiceService.getBookingInvoice(b.id);
        if (inv) {
          invList.push(inv);
        }
      }
      setInvoices(invList);
    } catch (err) {
      console.error("Failed to load payments and invoices", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredInvoices = React.useMemo(() => {
    return invoices.filter((inv) => {
      if (filter === "PENDING" && inv.status === "paid") return false;
      if (filter === "PAID" && inv.status !== "paid") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const numMatch = inv.invoiceNumber.toLowerCase().includes(q);
        const booking = bookingsMap.get(inv.bookingId);
        const refMatch = booking?.bookingNumber.toLowerCase().includes(q);
        const serviceMatch = booking?.serviceTitle?.toLowerCase().includes(q);
        return numMatch || refMatch || serviceMatch;
      }
      return true;
    });
  }, [invoices, filter, searchQuery, bookingsMap]);

  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPending = invoices.filter((i) => i.status !== "paid").reduce((sum, i) => sum + i.totalAmount, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Payments & Tax Invoices"
        description="View itemized service bills, download official GST tax invoices, and complete pending payments."
        breadcrumbs={[
          { label: "Customer Portal", href: "/customer" },
          { label: "Payments & Bills" },
        ]}
      />

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Invoices Issued</span>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
            {invoices.length} Records
          </p>
          <span className="text-[11px] text-slate-500 font-medium">All completed trade services</span>
        </Card>

        <Card className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-amber-800 dark:text-amber-400 font-bold uppercase block">Payment Pending</span>
          <p className="text-xl font-extrabold text-amber-900 dark:text-amber-200 font-mono">
            ₹{Math.round(totalPending)}
          </p>
          <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">Awaiting settlement</span>
        </Card>

        <Card className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold uppercase block">Total Settled Amount</span>
          <p className="text-xl font-extrabold text-emerald-900 dark:text-emerald-200 font-mono">
            ₹{Math.round(totalPaid)}
          </p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">Paid & cleared</span>
        </Card>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1">
          {(["ALL", "PENDING", "PAID"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filter === t
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {t === "ALL" ? "All Invoices" : t === "PENDING" ? "Unpaid / Pending" : "Paid & Settled"}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search invoice #, booking ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Invoices List */}
      {loading ? (
        <Card className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 space-y-2">
          <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Fetching invoice records...</p>
        </Card>
      ) : filteredInvoices.length === 0 ? (
        <Card className="p-10 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
          <Receipt className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            No invoices or payment records found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Invoices are generated automatically once a service request reaches completion.
          </p>
        </Card>
      ) : (
        <div className="space-y-3.5">
          {filteredInvoices.map((inv) => {
            const booking = bookingsMap.get(inv.bookingId);
            const isPaid = inv.status === "paid";

            return (
              <Card
                key={inv.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow rounded-xl p-4 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase">
                      INVOICE #{inv.invoiceNumber}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {booking?.serviceTitle || "Trade Service"}
                    </h4>
                  </div>

                  <Badge
                    className={
                      isPaid
                        ? "bg-emerald-700 text-white text-xs font-bold"
                        : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 text-xs font-bold"
                    }
                  >
                    {isPaid ? "PAID & SETTLED" : "PAYMENT PENDING"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Booking Reference</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {booking?.bookingNumber || inv.bookingId}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Worker</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {booking?.workerName || "Assigned Worker"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Issued Date</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {inv.issueDate}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Final Total</span>
                    <p className="text-base font-extrabold text-emerald-800 dark:text-emerald-300 font-mono">
                      ₹{Math.round(inv.totalAmount)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500">
                    Includes Subtotal + 5% Platform Fee + 18% GST
                  </span>

                  <Button
                    size="sm"
                    onClick={() => router.push(`/customer/bookings/${inv.bookingId}/invoice`)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-1.5 gap-1.5 shadow-sm"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    {isPaid ? "View Tax Receipt" : "Pay Invoice"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
