"use client";

import * as React from "react";
import {
  Users,
  UserCheck,
  UserX,
  Activity,
  Briefcase,
  PlayCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Star,
  Award,
  ShieldAlert,
  AlertCircle,
  Zap,
} from "lucide-react";
import { useFederationDashboard } from "./hooks/use-federation-dashboard";
import { DashboardHeader } from "./components/dashboard-header";
import { StatCard } from "./components/stat-card";
import { MetricCard } from "./components/metric-card";
import { DashboardSection } from "./components/dashboard-section";
import { Button } from "@/components/ui/button";

// Visualizations
import { JobStatusChart } from "./components/charts/job-status-chart";
import { RecentActivityCard } from "./components/recent-activity-card";
import { ProfessionDistributionChart } from "./components/charts/profession-distribution-chart";
import { JobActivityChart } from "./components/charts/job-activity-chart";
import { WorkerPerformanceChart } from "./components/charts/worker-performance-chart";
import { createClient } from "@/lib/supabase/client";
import { getCachedProfileName, setCachedProfileName } from "@/lib/auth/session-user";

export function FederationAdminDashboardView() {
  const {
    data,
    isLoading,
    error,
    timeframe,
    setTimeframe,
    refresh,
  } = useFederationDashboard();

  // Deterministic initial state for SSR and client first render to avoid hydration mismatches
  const [adminName, setAdminName] = React.useState<string>("");
  const [isLoadingAdminName, setIsLoadingAdminName] = React.useState<boolean>(true);

  React.useEffect(() => {
    // Read cached profile name post-hydration for instantaneous UI update without hydration mismatch
    const cached = getCachedProfileName("FEDERATION_ADMIN");
    if (cached) {
      setAdminName(cached);
      setIsLoadingAdminName(false);
    }

    let isMounted = true;
    async function fetchAdminProfile() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: profile } = await (supabase.from("profiles") as any)
            .select("full_name, role")
            .eq("id", user.id)
            .maybeSingle();

          if (isMounted && profile?.full_name) {
            setCachedProfileName("FEDERATION_ADMIN", profile.full_name);
            setAdminName(profile.full_name);
          }
        }
      } catch (err) {
        console.error("Error loading federation admin profile", err);
      } finally {
        if (isMounted) setIsLoadingAdminName(false);
      }
    }
    fetchAdminProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  // Monitor active HIGH-priority emergency dispatches
  const [activeHighEmergencies, setActiveHighEmergencies] = React.useState<Array<{
    id: string;
    bookingNumber: string;
    serviceTitle: string;
    createdAt: string;
  }>>([]);

  React.useEffect(() => {
    let isMounted = true;
    async function loadHighEmergencies() {
      try {
        const supabase = createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: emBookings } = await (supabase.from("bookings") as any)
          .select("id, booking_number, created_at, status, priority, problem_description, services(title)")
          .in("status", ["REQUEST_SENT", "WORKER_REVIEWING", "ESTIMATE_SUBMITTED", "PENDING"])
          .order("created_at", { ascending: false })
          .limit(5);

        if (isMounted && emBookings) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const highOnes = emBookings.filter((b: any) => {
            return b.priority === "HIGH" || (b.problem_description && b.problem_description.includes("[PRIORITY: HIGH]"));
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          }).map((b: any) => ({
            id: b.id,
            bookingNumber: b.booking_number,
            serviceTitle: b.services?.title || "Emergency Service",
            createdAt: b.created_at,
          }));
          setActiveHighEmergencies(highOnes);
        }
      } catch {
        // quiet fallback
      }
    }
    loadHighEmergencies();

    const supabase = createClient();
    const channel = supabase.channel("emergency-dispatch").on("broadcast", { event: "high-emergency-created" }, (payload) => {
      if (isMounted && payload?.payload) {
        setActiveHighEmergencies((prev) => [
          {
            id: payload.payload.booking_id,
            bookingNumber: payload.payload.booking_number || "EMG-REQ",
            serviceTitle: payload.payload.service_title || "Rapid Response Service",
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    }).subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header with Federation Context, Timeframe, Refresh & Dev Notice */}
      <DashboardHeader
        federation={data?.federation}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        onRefresh={refresh}
        isLoading={isLoading}
        lastUpdated={data?.lastUpdated}
        isDevelopmentFallback={data?.isDevelopmentFallback}
        dataSourceNotice={data?.dataSourceNotice}
        adminName={adminName || "Vikram Shah"}
        isLoadingAdminName={isLoadingAdminName}
      />

      {/* Real-time High Emergency Rapid Dispatch Notice */}
      {activeHighEmergencies.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-500/15 via-red-500/10 to-rose-500/15 border border-rose-500/40 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-lg animate-pulse shrink-0 shadow-sm shadow-rose-500/50">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-rose-700 dark:text-rose-400">
                  RAPID RESPONSE EMERGENCY DISPATCH ENGAGED ({activeHighEmergencies.length})
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white uppercase tracking-wider animate-pulse">
                  HIGH PRIORITY
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automated matching engine active for this cooperative jurisdiction. Craftsmen auto-assigned or monitoring dispatch.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-sm">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            className="border-rose-500/40 text-rose-800 dark:text-rose-300 hover:bg-rose-500/20"
          >
            Retry
          </Button>
        </div>
      )}

      {/* 2. Key Performance Metrics (Section 7) */}
      <DashboardSection
        title="Performance & Quality Benchmarks"
        subtitle="Transparent algorithmic performance tracking based on fulfillment speed, customer dispute resolution, and worker ratings"
        icon={<Award className="h-4 w-4 text-emerald-600" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Overall Federation Performance"
            value={data?.stats.performance.overallFederationPerformance ?? 0}
            suffix="%"
            benchmark="Target: >85%"
            description="Composite index: 40% Completion + 30% Resolution + 30% Rating Score"
            icon={<TrendingUp className="h-4 w-4 text-emerald-700" />}
            progressColor="bg-emerald-600"
            isLoading={isLoading}
          />
          <MetricCard
            title="Job Completion Rate"
            value={data?.stats.performance.jobCompletionRate ?? 0}
            suffix="%"
            benchmark="SLA: >80%"
            description="Ratio of fulfilled service orders to total lifetime requests"
            icon={<CheckCircle2 className="h-4 w-4 text-blue-700" />}
            progressColor="bg-blue-600"
            isLoading={isLoading}
          />
          <MetricCard
            title="Average Worker Rating"
            value={data?.stats.performance.averageWorkerRating ?? 0}
            suffix="/ 5.0"
            benchmark="Quality Tier: >4.5★"
            description="Aggregated customer review feedback across all active federation trades"
            icon={<Star className="h-4 w-4 text-amber-600 fill-amber-500" />}
            max={5}
            progressColor="bg-amber-500"
            isLoading={isLoading}
          />
          <MetricCard
            title="Complaint Resolution Rate"
            value={data?.stats.performance.complaintResolutionRate ?? 0}
            suffix="%"
            benchmark="Statutory SLA: >80%"
            description="Percentage of customer dispute tickets successfully closed or conciliated"
            icon={<ShieldAlert className="h-4 w-4 text-indigo-700" />}
            progressColor="bg-indigo-600"
            isLoading={isLoading}
          />
        </div>
      </DashboardSection>

      {/* 3. Worker Statistics (Section 7: Account Status vs Availability strictly separated) */}
      <DashboardSection
        title="Worker Statistics"
        subtitle="Workforce accounting separation between official account registration and immediate dispatch availability"
        icon={<Users className="h-4 w-4 text-blue-600" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Workers"
            value={data?.stats.workers.totalWorkers}
            subtitle="Registered cooperative members in roster"
            icon={<Users className="h-4 w-4" />}
            tone="slate"
            isLoading={isLoading}
          />
          <StatCard
            title="Active Workers"
            value={data?.stats.workers.activeWorkers}
            subtitle="In good standing (Account Status)"
            icon={<UserCheck className="h-4 w-4" />}
            tone="emerald"
            badge={{ text: "Account Active", variant: "default" }}
            isLoading={isLoading}
          />
          <StatCard
            title="Deactivated Workers"
            value={data?.stats.workers.deactivatedWorkers}
            subtitle="Suspended or dormant (Account Status)"
            icon={<UserX className="h-4 w-4" />}
            tone="rose"
            badge={{ text: "Deactivated", variant: "destructive" }}
            isLoading={isLoading}
          />
          <StatCard
            title="Available Workers"
            value={data?.stats.workers.availableWorkers}
            subtitle="Ready for dispatch (Worker Availability)"
            icon={<Activity className="h-4 w-4" />}
            tone="blue"
            badge={{ text: "Dispatch Ready", variant: "secondary" }}
            isLoading={isLoading}
          />
        </div>
      </DashboardSection>

      {/* 4. Job Statistics & Complaints Grid (Section 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job Cards (2 columns on lg) */}
        <div className="lg:col-span-2">
          <DashboardSection
            title="Job Fulfillment Statistics"
            subtitle="Service order volume tracking from dispatch to closure"
            icon={<Briefcase className="h-4 w-4 text-amber-600" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                title="Total Jobs"
                value={data?.stats.jobs.totalJobs}
                subtitle="All bookings recorded under federation"
                icon={<Briefcase className="h-4 w-4" />}
                tone="slate"
                isLoading={isLoading}
              />
              <StatCard
                title="Running Jobs"
                value={data?.stats.jobs.runningJobs}
                subtitle="In transit, arrived, or actively undergoing repair"
                icon={<PlayCircle className="h-4 w-4" />}
                tone="amber"
                badge={{ text: "In-Progress", variant: "secondary" }}
                isLoading={isLoading}
              />
              <StatCard
                title="Completed Jobs"
                value={data?.stats.jobs.completedJobs}
                subtitle="Fulfilled and verified by customer OTP/payment"
                icon={<CheckCircle2 className="h-4 w-4" />}
                tone="emerald"
                badge={{ text: "Completed", variant: "default" }}
                isLoading={isLoading}
              />
              <StatCard
                title="Pending Jobs"
                value={data?.stats.jobs.pendingJobs}
                subtitle="Reviewing request or awaiting customer quote confirm"
                icon={<Clock className="h-4 w-4" />}
                tone="blue"
                badge={{ text: "Awaiting Confirmation", variant: "secondary" }}
                isLoading={isLoading}
              />
            </div>
          </DashboardSection>
        </div>

        {/* Complaint Cards (1 column on lg) */}
        <div>
          <DashboardSection
            title="Dispute Statistics"
            subtitle="Customer complaint resolution oversight"
            icon={<AlertTriangle className="h-4 w-4 text-rose-600" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <StatCard
                title="Pending Complaints"
                value={data?.stats.complaints.pendingComplaints}
                subtitle="Open or currently undergoing arbitration"
                icon={<AlertTriangle className="h-4 w-4" />}
                tone="rose"
                badge={{ text: "Action Needed", variant: "destructive" }}
                isLoading={isLoading}
              />
              <StatCard
                title="Resolved Complaints"
                value={data?.stats.complaints.resolvedComplaints}
                subtitle="Amicably settled or closed with customer"
                icon={<CheckCircle className="h-4 w-4" />}
                tone="emerald"
                badge={{ text: "Resolved", variant: "default" }}
                isLoading={isLoading}
              />
            </div>
          </DashboardSection>
        </div>
      </div>

      {/* 5. Visualizations Section (Section 8: Recharts) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Visual Intelligence & Trends
            </h2>
            <p className="text-xs text-muted-foreground">
              Interactive visualizations analyzing jobs, capacity distribution, activity velocity, and customer demand
            </p>
          </div>
        </div>

        {/* Visualizations Grid Row 1: Status Distribution & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <JobStatusChart
            data={data?.charts.jobsByStatus}
            isLoading={isLoading}
          />
          <RecentActivityCard
            activities={data?.recentActivities ?? []}
            isLoading={isLoading}
          />
        </div>

        {/* Visualizations Grid Row 2: Activity Velocity Trend */}
        <JobActivityChart
          data={data?.charts.activityTrend}
          timeframe={timeframe}
          isLoading={isLoading}
        />

        {/* Visualizations Grid Row 3: Profession Distribution & Worker Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProfessionDistributionChart
            data={data?.charts.jobsByProfession}
            isLoading={isLoading}
          />
          <WorkerPerformanceChart
            data={data?.charts.workerPerformance}
            averageRating={data?.stats.performance.averageWorkerRating}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
