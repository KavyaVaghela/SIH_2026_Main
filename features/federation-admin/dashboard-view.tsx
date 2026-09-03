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
} from "lucide-react";
import { useFederationDashboard } from "./hooks/use-federation-dashboard";
import { DashboardHeader } from "./components/dashboard-header";
import { StatCard } from "./components/stat-card";
import { MetricCard } from "./components/metric-card";
import { DashboardSection } from "./components/dashboard-section";
import { Button } from "@/components/ui/button";

// Visualizations
import { JobStatusChart } from "./components/charts/job-status-chart";
import { JobsComparativeChart } from "./components/charts/jobs-comparative-chart";
import { ProfessionDistributionChart } from "./components/charts/profession-distribution-chart";
import { JobActivityChart } from "./components/charts/job-activity-chart";
import { WorkerPerformanceChart } from "./components/charts/worker-performance-chart";
import { DemandDistributionChart } from "./components/charts/demand-distribution-chart";

export function FederationAdminDashboardView() {
  const {
    data,
    isLoading,
    error,
    timeframe,
    setTimeframe,
    refresh,
  } = useFederationDashboard();

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
      />

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

        {/* Visualizations Grid Row 1: Status Distribution & Comparative */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <JobStatusChart
            data={data?.charts.jobsByStatus}
            isLoading={isLoading}
          />
          <JobsComparativeChart
            data={data?.charts.completedVsRunning}
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

        {/* Visualizations Grid Row 4: Service Demand Distribution */}
        <DemandDistributionChart
          data={data?.charts.demandDistribution}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
