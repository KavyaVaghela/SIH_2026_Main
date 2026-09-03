"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Receipt,
  Navigation,
  KeyRound,
  Play,
  CheckCircle2,
} from "lucide-react";
import { bookingService, Booking } from "@/features/bookings/services/booking-service";
import { BookingStatus } from "@/supabase/types/database.types";

type BookingFilterTab = "ALL" | "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export function MyBookingsView() {
  const router = useRouter();

  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [activeTab, setActiveTab] = React.useState<BookingFilterTab>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const fetchCustomerBookings = React.useCallback(async () => {
    try {
      setLoading(true);
      const list = await bookingService.getCustomerBookings("cust-1");
      setBookings(list);
    } catch (err) {
      console.error("Failed to fetch customer bookings", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCustomerBookings();
  }, [fetchCustomerBookings]);

  // Status Categorization Map
  const isUpcoming = (status: BookingStatus) =>
    ["REQUEST_SENT", "WORKER_REVIEWING", "WORKER_INTERESTED", "CUSTOMER_CONFIRMATION_PENDING", "BOOKING_CONFIRMED", "WORKER_ACCEPTED", "ON_THE_WAY"].includes(status);

  const isActive = (status: BookingStatus) =>
    ["ARRIVED", "OTP_VERIFIED", "SERVICE_STARTED"].includes(status);

  const isCompleted = (status: BookingStatus) =>
    ["SERVICE_COMPLETED", "BILL_GENERATED", "PAYMENT_PENDING", "PAYMENT_RECEIVED", "BOOKING_COMPLETED"].includes(status);

  const filteredBookings = React.useMemo(() => {
    return bookings.filter((b) => {
      // Tab filter
      if (activeTab === "UPCOMING" && !isUpcoming(b.status)) return false;
      if (activeTab === "ACTIVE" && !isActive(b.status)) return false;
      if (activeTab === "COMPLETED" && !isCompleted(b.status)) return false;
      if (activeTab === "CANCELLED" && b.status !== "CANCELLED") return false;

      // Text search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const numMatch = b.bookingNumber.toLowerCase().includes(q);
        const serviceMatch = b.serviceTitle?.toLowerCase().includes(q);
        const workerMatch = b.workerName?.toLowerCase().includes(q);
        return numMatch || serviceMatch || workerMatch;
      }

      return true;
    });
  }, [bookings, activeTab, searchQuery]);

  const getCtaForStatus = (booking: Booking) => {
    switch (booking.status) {
      case "ON_THE_WAY":
        return { label: "Track Worker", icon: Navigation, href: `/customer/bookings/${booking.id}` };
      case "ARRIVED":
        return { label: "Verify OTP", icon: KeyRound, href: `/customer/bookings/${booking.id}` };
      case "SERVICE_STARTED":
        return { label: "Track Service", icon: Play, href: `/customer/bookings/${booking.id}` };
      case "SERVICE_COMPLETED":
      case "BILL_GENERATED":
        return { label: "View Bill", icon: Receipt, href: `/customer/bookings/${booking.id}/invoice` };
      case "PAYMENT_PENDING":
        return { label: "Pay Now", icon: Receipt, href: `/customer/bookings/${booking.id}/invoice` };
      case "PAYMENT_RECEIVED":
      case "BOOKING_COMPLETED":
        return { label: "View Receipt", icon: CheckCircle2, href: `/customer/bookings/${booking.id}/invoice` };
      default:
        return { label: "View Details", icon: ChevronRight, href: `/customer/bookings/${booking.id}` };
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="My Service Bookings"
        description="Track active trade requests, view past completed services, and manage invoices."
        breadcrumbs={[
          { label: "Customer Portal", href: "/customer" },
          { label: "My Bookings" },
        ]}
        actions={
          <Button
            onClick={() => router.push("/customer/book")}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 shadow-md gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Book New Service
          </Button>
        }
      />

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(["ALL", "UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"] as BookingFilterTab[]).map((tab) => {
            const count = bookings.filter((b) => {
              if (tab === "UPCOMING") return isUpcoming(b.status);
              if (tab === "ACTIVE") return isActive(b.status);
              if (tab === "COMPLETED") return isCompleted(b.status);
              if (tab === "CANCELLED") return b.status === "CANCELLED";
              return true;
            }).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>{tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === tab ? "bg-emerald-900 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Text Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search booking ref, service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <Card className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 space-y-2">
          <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading your service bookings...</p>
        </Card>
      ) : filteredBookings.length === 0 ? (
        /* Empty State */
        <Card className="p-10 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Calendar className="w-6 h-6 text-slate-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              No bookings found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `No service bookings match "${searchQuery}".`
                : activeTab === "ALL"
                ? "You have not placed any service booking requests yet."
                : `You don't have any ${activeTab.toLowerCase()} bookings.`}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => router.push("/customer/book")}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2"
          >
            Book a Service Now
          </Button>
        </Card>
      ) : (
        /* Bookings Grid List */
        <div className="space-y-3.5">
          {filteredBookings.map((booking) => {
            const cta = getCtaForStatus(booking);
            const CtaIcon = cta.icon;
            const displayAmount = Math.round(booking.workerEstimateAmount || booking.totalAmount);

            return (
              <Card
                key={booking.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow rounded-xl p-4 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase">
                      REF: {booking.bookingNumber}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      {booking.serviceTitle || "Trade Service"}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 text-[11px] font-bold py-0.5"
                    >
                      {booking.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
                      <User className="w-3 h-3 text-emerald-600" /> Assigned Worker
                    </span>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      {booking.workerName || "Ramesh Patel"}
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                      {booking.cooperativeName || "Artisans Cooperative"}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-600" /> Date & Location
                    </span>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      {booking.scheduledStartAt.split("T")[0]}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {booking.addressText || "Satellite, Ahmedabad"}
                    </p>
                  </div>

                  <div className="space-y-0.5 sm:text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      {isCompleted(booking.status) ? "Final Bill" : "Estimate / Amount"}
                    </span>
                    <p className="text-base font-extrabold text-emerald-800 dark:text-emerald-300 font-mono">
                      ₹{displayAmount}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Created: {new Date(booking.createdAt).toLocaleDateString("en-IN")}
                  </span>

                  <Button
                    size="sm"
                    onClick={() => router.push(cta.href)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-1.5 gap-1.5 shadow-sm"
                  >
                    <CtaIcon className="w-3.5 h-3.5" />
                    {cta.label}
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
