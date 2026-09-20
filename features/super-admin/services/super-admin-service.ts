import { createClient } from "@/lib/supabase/client";
import type {
  SuperAdminOverviewData,
  SuperAdminOverviewStats,
  OverviewTimeframe,
  BookingActivityPoint,
  DemandCategorySummary,
  CriticalAlert,
} from "../types";

export class SuperAdminService {
  /**
   * Fetches Super Admin Overview metrics, trends, and operational alerts.
   * Directly queries real Supabase data with zero mock fallback values.
   */
  async getOverviewData(
    timeframe: OverviewTimeframe = "30d",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clientOverride?: any
  ): Promise<SuperAdminOverviewData> {
    if (typeof window !== "undefined" && !clientOverride) {
      try {
        const res = await fetch(`/api/super-admin/overview?timeframe=${timeframe}`);
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.warn("Notice: falling back to direct client query for overview:", e);
      }
    }

    const supabase = clientOverride || createClient();

    let stats: SuperAdminOverviewStats = {
      totalSocieties: 0,
      totalWorkers: 0,
      activeWorkers: 0,
      availableWorkers: 0,
      totalCustomers: 0,
      totalBookings: 0,
      completedServices: 0,
      activeJobs: 0,
      pendingRequests: 0,
      averageRating: 0,
    };

    const activityTrends: BookingActivityPoint[] = [];
    const alerts: CriticalAlert[] = [];
    const topDemandCategories: DemandCategorySummary[] = [];

    try {
      // 1. Parallel queries for platform governance metrics
      const [
        { count: federationCount },
        { data: workersData },
        { count: customerCount },
        { data: bookingsData },
        { count: openJobRequestsCount },
        { data: reviewsData },
        { count: pendingFedsCount },
        { data: complaintsData },
        { data: servicesData },
      ] = await Promise.all([
        supabase.from("federations").select("*", { count: "exact", head: true }),
        supabase.from("workers").select("account_status, availability_status, verification_status"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "CUSTOMER"),
        supabase.from("bookings").select("id, status, created_at, service_id"),
        supabase.from("job_requests").select("*", { count: "exact", head: true }).eq("status", "OPEN"),
        supabase.from("reviews").select("rating"),
        supabase.from("federations").select("*", { count: "exact", head: true }).or("is_active.eq.false,status.eq.PENDING"),
        supabase.from("complaints").select("id, status, description, created_at"),
        supabase.from("services").select("id, title, category:service_categories(id, name)"),
      ]);

      const workers = (workersData || []) as Array<{
        account_status?: string;
        availability_status?: string;
        verification_status?: string;
      }>;
      const bookings = (bookingsData || []) as Array<{
        id: string;
        status?: string;
        created_at?: string;
        service_id?: string;
      }>;
      const reviews = (reviewsData || []) as Array<{ rating?: number }>;

      // Compute exact counts
      const totalWorkers = workers.length;
      const activeWorkers = workers.filter((w) => w.account_status === "ACTIVE").length;
      const availableWorkers = workers.filter((w) => w.availability_status === "AVAILABLE").length;
      const pendingKycWorkers = workers.filter((w) => w.verification_status === "pending_verification").length;

      const totalBookings = bookings.length;
      const completedServices = bookings.filter((b) =>
        b.status && ["BOOKING_COMPLETED", "SERVICE_COMPLETED"].includes(b.status)
      ).length;
      const activeJobs = bookings.filter((b) =>
        b.status && ["ON_THE_WAY", "ARRIVED", "OTP_VERIFIED", "SERVICE_STARTED", "BOOKING_CONFIRMED"].includes(b.status)
      ).length;
      const pendingRequests =
        bookings.filter((b) =>
          b.status && ["REQUEST_SENT", "WORKER_REVIEWING", "CUSTOMER_CONFIRMATION_PENDING"].includes(b.status)
        ).length + (openJobRequestsCount || 0);

      let avgRating = 0;
      if (reviews.length > 0) {
        const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
        avgRating = Number((sum / reviews.length).toFixed(1));
      }

      stats = {
        totalSocieties: federationCount || 0,
        totalWorkers,
        activeWorkers,
        availableWorkers,
        totalCustomers: customerCount || 0,
        totalBookings,
        completedServices,
        activeJobs,
        pendingRequests,
        averageRating: avgRating,
      };

      // 2. Real Booking Activity Trends based on timeframe
      const now = new Date();

      if (timeframe === "7d") {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        for (let i = 6; i >= 0; i--) {
          const targetDate = new Date(now);
          targetDate.setDate(targetDate.getDate() - i);
          const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0).getTime();
          const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59).getTime();

          const bInDay = bookings.filter((b) => {
            if (!b.created_at) return false;
            const bTime = new Date(b.created_at).getTime();
            return bTime >= dayStart && bTime <= dayEnd;
          });

          activityTrends.push({
            date: days[targetDate.getDay()],
            completed: bInDay.filter((b) => ["BOOKING_COMPLETED", "SERVICE_COMPLETED"].includes(b.status || "")).length,
            active: bInDay.filter((b) =>
              ["ON_THE_WAY", "ARRIVED", "OTP_VERIFIED", "SERVICE_STARTED", "BOOKING_CONFIRMED"].includes(b.status || "")
            ).length,
            pending: bInDay.filter((b) =>
              ["REQUEST_SENT", "WORKER_REVIEWING", "CUSTOMER_CONFIRMATION_PENDING"].includes(b.status || "")
            ).length,
            cancelled: bInDay.filter((b) => b.status === "CANCELLED").length,
          });
        }
      } else if (timeframe === "90d") {
        const months = [
          { label: "Month 1", startDaysAgo: 90, endDaysAgo: 60 },
          { label: "Month 2", startDaysAgo: 60, endDaysAgo: 30 },
          { label: "Month 3", startDaysAgo: 30, endDaysAgo: 0 },
        ];

        for (const m of months) {
          const start = now.getTime() - m.startDaysAgo * 86400000;
          const end = now.getTime() - m.endDaysAgo * 86400000;

          const bInWindow = bookings.filter((b) => {
            if (!b.created_at) return false;
            const bTime = new Date(b.created_at).getTime();
            return bTime >= start && bTime <= end;
          });

          activityTrends.push({
            date: m.label,
            completed: bInWindow.filter((b) => ["BOOKING_COMPLETED", "SERVICE_COMPLETED"].includes(b.status || "")).length,
            active: bInWindow.filter((b) =>
              ["ON_THE_WAY", "ARRIVED", "OTP_VERIFIED", "SERVICE_STARTED", "BOOKING_CONFIRMED"].includes(b.status || "")
            ).length,
            pending: bInWindow.filter((b) =>
              ["REQUEST_SENT", "WORKER_REVIEWING", "CUSTOMER_CONFIRMATION_PENDING"].includes(b.status || "")
            ).length,
            cancelled: bInWindow.filter((b) => b.status === "CANCELLED").length,
          });
        }
      } else {
        // Default 30d
        const weeks = [
          { label: "Week 1", startDaysAgo: 28, endDaysAgo: 21 },
          { label: "Week 2", startDaysAgo: 21, endDaysAgo: 14 },
          { label: "Week 3", startDaysAgo: 14, endDaysAgo: 7 },
          { label: "Week 4", startDaysAgo: 7, endDaysAgo: 0 },
        ];

        for (const w of weeks) {
          const start = now.getTime() - w.startDaysAgo * 86400000;
          const end = now.getTime() - w.endDaysAgo * 86400000;

          const bInWindow = bookings.filter((b) => {
            if (!b.created_at) return false;
            const bTime = new Date(b.created_at).getTime();
            return bTime >= start && bTime <= end;
          });

          activityTrends.push({
            date: w.label,
            completed: bInWindow.filter((b) => ["BOOKING_COMPLETED", "SERVICE_COMPLETED"].includes(b.status || "")).length,
            active: bInWindow.filter((b) =>
              ["ON_THE_WAY", "ARRIVED", "OTP_VERIFIED", "SERVICE_STARTED", "BOOKING_CONFIRMED"].includes(b.status || "")
            ).length,
            pending: bInWindow.filter((b) =>
              ["REQUEST_SENT", "WORKER_REVIEWING", "CUSTOMER_CONFIRMATION_PENDING"].includes(b.status || "")
            ).length,
            cancelled: bInWindow.filter((b) => b.status === "CANCELLED").length,
          });
        }
      }

      // 3. Real Operational Alerts derived from platform state
      // Alert 1: Escalated Complaints
      const complaints = (complaintsData || []) as Array<{ status?: string; description?: string }>;
      const escalatedCount = complaints.filter((c) => {
        if (c.status === "ESCALATED") return true;
        if (c.description && c.description.includes('"escalation"')) return true;
        return false;
      }).length;

      if (escalatedCount > 0) {
        alerts.push({
          id: "alt-grievance-escalation",
          type: "HIGH_COMPLAINT",
          severity: "CRITICAL",
          title: "Escalated Grievance Arbitration",
          description: `${escalatedCount} grievance(s) escalated to Super Admin requiring central arbitration.`,
          timestamp: "Immediate Action",
          actionUrl: "/super-admin/complaints",
        });
      }

      // Alert 2: Pending Cooperative Society Verification
      if (pendingFedsCount && pendingFedsCount > 0) {
        alerts.push({
          id: "alt-society-clearance",
          type: "VERIFICATION_PENDING",
          severity: "HIGH",
          title: "Cooperative Society Audit Clearance",
          description: `${pendingFedsCount} registered cooperative unit(s) pending administrative clearance.`,
          timestamp: "Governance Review",
          actionUrl: "/super-admin/societies",
        });
      }

      // Alert 3: Pending Worker KYC / Verification
      if (pendingKycWorkers > 0) {
        alerts.push({
          id: "alt-worker-kyc",
          type: "COMPLIANCE_WARNING",
          severity: "MEDIUM",
          title: "Workforce KYC Approvals",
          description: `${pendingKycWorkers} cooperative worker member(s) awaiting credential verification.`,
          timestamp: "Credential Audit",
          actionUrl: "/super-admin/workforce",
        });
      }

      // 4. Real Top Demand Categories from Bookings
      const serviceToCatMap = new Map<string, { id: string; name: string }>();
      const services = (servicesData || []) as Array<{
        id: string;
        title: string;
        category?: { id: string; name: string } | null;
      }>;
      for (const s of services) {
        if (s.category) {
          serviceToCatMap.set(s.id, { id: s.category.id, name: s.category.name });
        }
      }

      const categoryCountMap = new Map<string, { name: string; count: number }>();
      for (const b of bookings) {
        if (b.service_id) {
          const cat = serviceToCatMap.get(b.service_id);
          if (cat) {
            const curr = categoryCountMap.get(cat.id) || { name: cat.name, count: 0 };
            curr.count++;
            categoryCountMap.set(cat.id, curr);
          }
        }
      }

      const sortedCategories = Array.from(categoryCountMap.entries())
        .map(([id, val]) => ({
          categoryId: id,
          categoryName: val.name,
          bookingCount: val.count,
          growthPercentage: totalBookings > 0 ? Math.round((val.count / totalBookings) * 100) : 0,
        }))
        .sort((a, b) => b.bookingCount - a.bookingCount);

      topDemandCategories.push(...sortedCategories.slice(0, 5));

    } catch (err) {
      console.error("Error loading Super Admin Overview data from Supabase:", err);
    }

    return {
      stats,
      activityTrends,
      topDemandCategories,
      districtClusters: [],
      peakHours: [],
      alerts,
      insights: [],
      lastUpdated: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  }
}

export const superAdminService = new SuperAdminService();
