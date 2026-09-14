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
import { multiWorkerService, CustomerServiceRequestItem } from "@/features/customer/services/multi-worker-service";
import { BookingStatus } from "@/supabase/types/database.types";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";

type BookingFilterTab = "ALL" | "REQUESTS" | "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export function MyBookingsView() {
  const router = useRouter();

  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [serviceRequests, setServiceRequests] = React.useState<CustomerServiceRequestItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [activeTab, setActiveTab] = React.useState<BookingFilterTab>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const fetchCustomerBookings = React.useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) {
        setLoading(true);
      }
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const customerId = (user?.id && user.id !== "70fbdb46-120f-459e-a616-67b4f676f5d0")
        ? user.id
        : "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";
      
      const [list, reqs] = await Promise.all([
        bookingService.getCustomerBookings(customerId),
        multiWorkerService.getCustomerServiceRequests(customerId),
      ]);
      setBookings(list);
      setServiceRequests(reqs);
    } catch (err) {
      console.error("Failed to fetch customer bookings", err);
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  }, []);

  React.useEffect(() => {
    fetchCustomerBookings();
  }, [fetchCustomerBookings]);

  // Realtime subscription for customer's bookings
  useRealtimeSubscription({
    table: "bookings",
    onPayload: () => {
      fetchCustomerBookings(true);
    },
  });

  // Realtime subscription for customer's multi-worker job requests
  useRealtimeSubscription({
    table: "job_requests",
    onPayload: () => {
      fetchCustomerBookings(true);
    },
  });

  // Realtime subscription for worker estimates updates
  useRealtimeSubscription({
    table: "worker_estimates",
    onPayload: () => {
      fetchCustomerBookings(true);
    },
  });

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
          {(["ALL", "REQUESTS", "UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"] as BookingFilterTab[]).map((tab) => {
            let count = 0;
            if (tab === "REQUESTS") {
              count = serviceRequests.length;
            } else {
              count = bookings.filter((b) => {
                if (tab === "UPCOMING") return isUpcoming(b.status);
                if (tab === "ACTIVE") return isActive(b.status);
                if (tab === "COMPLETED") return isCompleted(b.status);
                if (tab === "CANCELLED") return b.status === "CANCELLED";
                return true;
              }).length;
            }

            const label = tab === "REQUESTS" ? "Requests & Bids" : tab.charAt(0) + tab.slice(1).toLowerCase();

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
                <span>{label}</span>
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
          <p className="text-xs text-slate-500 font-medium">Loading your service bookings & requests...</p>
        </Card>
      ) : activeTab === "REQUESTS" ? (
        /* Requests & Bids View */
        (() => {
          const filteredRequests = serviceRequests.filter((r) => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
              r.requestNumber.toLowerCase().includes(q) ||
              r.serviceTitle.toLowerCase().includes(q) ||
              r.description.toLowerCase().includes(q)
            );
          });

          if (filteredRequests.length === 0) {
            return (
              <Card className="p-10 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mx-auto text-emerald-600">
                  <Calendar className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    No multi-worker requests found
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {searchQuery
                      ? `No requests match "${searchQuery}".`
                      : "When you request estimates from multiple trade workers, your requests and competing quotes will appear here."}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push("/customer/book")}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2"
                >
                  Request Worker Estimates
                </Button>
              </Card>
            );
          }

          return (
            <div className="space-y-3.5">
              {filteredRequests.map((req) => {
                const isConfirmed = req.status === "CONFIRMED";

                return (
                  <Card
                    key={req.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow rounded-xl p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase">
                          REQ: {req.requestNumber}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          {req.serviceTitle}
                          <span className="text-[11px] font-normal text-slate-500">
                            • {req.categoryName}
                          </span>
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        {isConfirmed ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-bold py-0.5">
                            Worker Confirmed
                          </Badge>
                        ) : req.submittedEstimatesCount > 0 ? (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 text-[11px] font-bold py-0.5">
                            {req.submittedEstimatesCount} Estimate{req.submittedEstimatesCount > 1 ? "s" : ""} Received
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 text-[11px] font-bold py-0.5">
                            Waiting for Worker Bids
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
                          <User className="w-3 h-3 text-emerald-600" /> Invited Workers
                        </span>
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {req.requestedWorkersCount} Workers Requested
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {req.submittedEstimatesCount} submitted estimates
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-emerald-600" /> Preferred Date
                        </span>
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {req.preferredSchedule.split("T")[0]}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {req.description}
                        </p>
                      </div>

                      <div className="space-y-0.5 sm:text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                          {isConfirmed ? "Confirmed Worker" : "Best Available Estimate"}
                        </span>
                        {isConfirmed && req.selectedWorkerName ? (
                          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                            {req.selectedWorkerName}
                          </p>
                        ) : req.bestEstimate !== null ? (
                          <p className="text-base font-extrabold text-emerald-800 dark:text-emerald-300 font-mono">
                            ₹{req.bestEstimate}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 font-medium">
                            Awaiting estimates...
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] text-slate-500 font-mono">
                        Created: {new Date(req.createdAt).toLocaleDateString("en-IN")}
                      </span>

                      <Button
                        size="sm"
                        onClick={() => router.push(`/customer/requests/${req.id}`)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-1.5 gap-1.5 shadow-sm"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                        {isConfirmed ? "View Request Details" : `Compare Estimates (${req.submittedEstimatesCount})`}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          );
        })()
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
                    {booking.status === "PAYMENT_PENDING" || booking.status === "BILL_GENERATED" ? (
                      <Badge
                        variant="outline"
                        className="bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 text-[11px] font-bold py-0.5"
                      >
                        Service Completed • Payment: Pending
                      </Badge>
                    ) : booking.status === "BOOKING_COMPLETED" || booking.status === "PAYMENT_RECEIVED" ? (
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 text-[11px] font-bold py-0.5"
                      >
                        Completed ✓ • Paid ✓
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 text-[11px] font-bold py-0.5"
                      >
                        {booking.status.replace(/_/g, " ")}
                      </Badge>
                    )}
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
                      <Calendar className="w-3 h-3 text-emerald-600" /> Date &amp; Location
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
                      {booking.status === "BOOKING_COMPLETED" || booking.status === "PAYMENT_RECEIVED"
                        ? "Final Bill (Paid ✓)"
                        : booking.status === "PAYMENT_PENDING" || booking.status === "BILL_GENERATED"
                        ? "Final Bill (Payment: Pending)"
                        : "Estimate / Amount"}
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

                  <div className="flex items-center gap-2">
                    {booking.status === "BOOKING_COMPLETED" || booking.status === "PAYMENT_RECEIVED" ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/customer/bookings/${booking.id}/invoice`)}
                          className="text-xs border-emerald-600/40 text-emerald-800 dark:text-emerald-300 font-bold px-3 py-1.5 gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          View Receipt
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/customer/bookings/${booking.id}/invoice#review`)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 py-1.5 gap-1.5 shadow-sm"
                        >
                          Rate Worker
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => router.push(cta.href)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-1.5 gap-1.5 shadow-sm"
                      >
                        <CtaIcon className="w-3.5 h-3.5" />
                        {cta.label}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
