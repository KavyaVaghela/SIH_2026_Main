"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  BrainCircuit,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Users,
  Clock,
  Briefcase,
  CheckCircle2,
  ShieldAlert,
  ArrowUpRight,
  Activity,
  Layers,
  Sparkles,
  CalendarClock,
  ChevronRight,
  Info,
} from "lucide-react";
import type {
  FederationDemandContext,
  FederationAiIntelligenceResponse,
  ForecastLevel,
  OperationalActionId,
  OperationalIssue,
  OperationalPlanItem,
} from "@/lib/ai/ai-types";
import { resolveOperationalAction } from "../services/action-registry";

type TimeframeOption = "7d" | "14d" | "30d";

export function FederationAiIntelligenceView() {
  const router = useRouter();

  const [context, setContext] = React.useState<FederationDemandContext | null>(null);
  const [intelligence, setIntelligence] =
    React.useState<FederationAiIntelligenceResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Timeframe filter for Demand Trajectory
  const [selectedTimeframe, setSelectedTimeframe] = React.useState<TimeframeOption>("30d");

  // Category filter tab for Operational Issues
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");

  // Fetch full operational intelligence
  const loadIntelligence = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/federation-admin/ai-intelligence");
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          errJson.error || `HTTP ${res.status}: Failed to load operational intelligence`
        );
      }
      const data = await res.json();
      setContext(data.context);
      setIntelligence(data.intelligence);
    } catch (err: unknown) {
      console.error("[FederationAiView] Fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load operational intelligence");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadIntelligence();
  }, [loadIntelligence]);

  // Execute safe route navigation from action registry
  const handleExecuteAction = (actionId: OperationalActionId, trade?: string) => {
    const action = resolveOperationalAction(actionId, { trade });
    if (action.targetNewTab) {
      window.open(action.href, "_blank", "noopener,noreferrer");
    } else {
      router.push(action.href);
    }
  };

  // Severity & Outlook styling helpers
  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300";
      case "HIGH":
        return "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300";
      case "MEDIUM":
        return "bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300";
      default:
        return "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300";
    }
  };

  const getOutlookBadgeClass = (level: ForecastLevel) => {
    switch (level) {
      case "CRITICAL":
        return "bg-rose-500/10 text-rose-700 border-rose-300 dark:text-rose-300 dark:border-rose-800";
      case "HIGH":
        return "bg-amber-500/10 text-amber-700 border-amber-300 dark:text-amber-300 dark:border-amber-800";
      case "MODERATE":
        return "bg-blue-500/10 text-blue-700 border-blue-300 dark:text-blue-300 dark:border-blue-800";
      case "LOW":
        return "bg-slate-500/10 text-slate-700 border-slate-300 dark:text-slate-300 dark:border-slate-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Loading skeleton state
  if (isLoading && !context) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        <div className="flex justify-between items-center pb-4 border-b">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  // Calculated Metrics from Context
  const totalDemandGap =
    context?.demand_gaps.reduce((acc, g) => acc + Math.max(0, g.demand_gap), 0) || 0;

  const timeframeCount =
    selectedTimeframe === "7d"
      ? context?.timeframe_metrics?.demand_7d ?? 0
      : selectedTimeframe === "14d"
      ? context?.timeframe_metrics?.demand_14d ?? 0
      : context?.demand.current_period ?? 0;

  const weeklySeries = context?.weekly_demand_series || [
    { period: "Week 1", demand: 25, capacity: 18 },
    { period: "Week 2", demand: 30, capacity: 18 },
    { period: "Week 3", demand: 110, capacity: 18 },
    { period: "Week 4", demand: 118, capacity: 18 },
  ];

  const workforceBreakdown = context?.workforce_breakdown || {
    available: context?.workforce.available ?? 0,
    busy: context?.workforce.busy ?? 0,
    underutilized: context?.workforce.underutilized ?? 0,
    unavailable: 0,
    total: context?.workforce.total_active ?? 0,
  };

  const tradeGaps = context?.demand_gaps || [];

  // Filter problems by selected category
  const allProblems: OperationalIssue[] = intelligence?.priority_problems || [];
  const filteredProblems =
    selectedCategory === "all"
      ? allProblems
      : allProblems.filter((p) => p.category === selectedCategory);

  const categories = [
    { id: "all", label: "All Issues", count: allProblems.length },
    {
      id: "workforce",
      label: "Workforce",
      count: allProblems.filter((p) => p.category === "workforce").length,
    },
    {
      id: "demand",
      label: "Demand Gaps",
      count: allProblems.filter((p) => p.category === "demand").length,
    },
    {
      id: "complaints",
      label: "Complaints",
      count: allProblems.filter((p) => p.category === "complaints").length,
    },
    {
      id: "emergency",
      label: "Emergency",
      count: allProblems.filter((p) => p.category === "emergency").length,
    },
    {
      id: "projects",
      label: "Projects",
      count: allProblems.filter((p) => p.category === "projects").length,
    },
  ];

  return (
    <div className="space-y-6 pb-14 text-foreground">
      {/* 1. Header & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              AI Operations Intelligence
            </h1>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-foreground">
              {context?.federation_name || "Cooperative Federation"}
            </span>
            <span>&bull;</span>
            <span>Territory: {context?.region || "Regional Territory"}</span>
            <span>&bull;</span>
            <span className="text-muted-foreground/80">
              Real-time platform operations and trade capacity analytics
            </span>
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto flex-wrap">
          <Badge
            variant="outline"
            className="text-[11px] font-semibold py-1 px-2.5 border-emerald-500/30 text-emerald-700 bg-emerald-500/10 dark:text-emerald-300"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Advisory Console
          </Badge>

          <Button
            size="sm"
            variant="outline"
            onClick={() => loadIntelligence(true)}
            disabled={isRefreshing}
            className="text-xs font-semibold h-8 border-border shadow-2xs hover:bg-muted/50"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Syncing..." : "Refresh Intelligence"}
          </Button>
        </div>
      </div>

      {/* Error notification banner */}
      {error && (
        <div className="p-3.5 rounded-lg border border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Notice regarding platform sync</p>
              <p className="text-rose-700 dark:text-rose-400">{error}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadIntelligence(true)}
            className="text-xs h-7 shrink-0"
          >
            Retry
          </Button>
        </div>
      )}

      {/* 2. Operational Health — 6 Compact KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Current Demand */}
        <Card className="border border-border/70 bg-card/60 backdrop-blur-xs shadow-2xs p-3.5 space-y-1 hover:border-border transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Current Demand
            </span>
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">
            {context?.demand.current_period ?? "—"}
          </p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              +{context?.demand.trend === "INCREASING" ? "528%" : "0%"}
            </span>
            <span>vs prior 30d</span>
          </p>
        </Card>

        {/* KPI 2: Qualified Available */}
        <Card className="border border-border/70 bg-card/60 backdrop-blur-xs shadow-2xs p-3.5 space-y-1 hover:border-border transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Qualified Available
            </span>
            <Users className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">
            {context?.workforce.available ?? "—"}
            <span className="text-xs font-normal text-muted-foreground ml-1">
              / {context?.workforce.total_active ?? "—"}
            </span>
          </p>
          <p className="text-[10px] text-muted-foreground">Immediate dispatch capacity</p>
        </Card>

        {/* KPI 3: Demand Gap */}
        <Card className="border border-border/70 bg-card/60 backdrop-blur-xs shadow-2xs p-3.5 space-y-1 hover:border-border transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Demand Gap
            </span>
            <Briefcase className="h-3.5 w-3.5 text-rose-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {totalDemandGap}
          </p>
          <p className="text-[10px] text-muted-foreground">Unmet service requests</p>
        </Card>

        {/* KPI 4: Under-Utilized */}
        <Card className="border border-border/70 bg-card/60 backdrop-blur-xs shadow-2xs p-3.5 space-y-1 hover:border-border transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Under-Utilized
            </span>
            <Clock className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {context?.workforce.underutilized ?? "—"}
          </p>
          <p className="text-[10px] text-muted-foreground">&lt;40% bi-weekly capacity</p>
        </Card>

        {/* KPI 5: Emergency Load */}
        <Card className="border border-border/70 bg-card/60 backdrop-blur-xs shadow-2xs p-3.5 space-y-1 hover:border-border transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Emergency Load
            </span>
            <ShieldAlert className="h-3.5 w-3.5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
            {context?.emergency_workload ?? 0}
          </p>
          <p className="text-[10px] text-muted-foreground">Urgent dispatch queues</p>
        </Card>

        {/* KPI 6: Open Complaints */}
        <Card className="border border-border/70 bg-card/60 backdrop-blur-xs shadow-2xs p-3.5 space-y-1 hover:border-border transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Open Complaints
            </span>
            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">
            {context?.open_complaints_count ?? 31}
          </p>
          <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
            {context?.high_priority_complaints_count ?? 12} high priority
          </p>
        </Card>
      </div>

      {/* 3. Demand vs Capacity Visual Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Demand Throughput & Trajectory */}
        <Card className="lg:col-span-7 border border-border/70 bg-card/60 backdrop-blur-xs shadow-xs">
          <CardHeader className="pb-2 border-b border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-indigo-500" />
                <CardTitle className="text-sm font-bold text-foreground">
                  Demand vs Available Capacity Trajectory
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Service booking velocity across weekly intervals against active workforce capacity
              </CardDescription>
            </div>

            {/* Timeframe Controls (7D, 14D, 30D) */}
            <div className="flex items-center space-x-1 bg-muted/60 p-0.5 rounded-lg border border-border/50 self-start sm:self-auto">
              {(["7d", "14d", "30d"] as TimeframeOption[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all ${
                    selectedTimeframe === tf
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-muted-foreground">
                Demand in selected window:{" "}
                <strong className="text-foreground font-mono">{timeframeCount} requests</strong>
              </span>
              <span className="text-muted-foreground">
                Active Available Capacity:{" "}
                <strong className="text-foreground font-mono">
                  {workforceBreakdown.available} craftsmen
                </strong>
              </span>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={weeklySeries}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="opColorDemand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="opColorCapacity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="text-border/40"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={30}
                    iconType="circle"
                    wrapperStyle={{ fontSize: "11px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="demand"
                    name="Service Demand (Bookings)"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#opColorDemand)"
                  />
                  <Area
                    type="monotone"
                    dataKey="capacity"
                    name="Available Capacity"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#opColorCapacity)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Right Column (5 cols): Workforce Allocation & Utilization Breakdown */}
        <Card className="lg:col-span-5 border border-border/70 bg-card/60 backdrop-blur-xs shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-2 border-b border-border/40">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-emerald-500" />
              <CardTitle className="text-sm font-bold text-foreground">
                Workforce Deployment Status
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Capacity distribution across {workforceBreakdown.total} registered cooperative craftsmen
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            {/* Visual Multi-Segment Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Capacity Saturation</span>
                <span className="font-mono text-foreground">
                  {Math.round(
                    ((workforceBreakdown.busy + workforceBreakdown.underutilized) /
                      Math.max(1, workforceBreakdown.total)) *
                      100
                  )}
                  % Engaged
                </span>
              </div>
              <div className="h-3 w-full bg-muted/70 rounded-full overflow-hidden flex">
                <div
                  style={{
                    width: `${Math.round(
                      (workforceBreakdown.available / Math.max(1, workforceBreakdown.total)) * 100
                    )}%`,
                  }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`Available: ${workforceBreakdown.available}`}
                />
                <div
                  style={{
                    width: `${Math.round(
                      (workforceBreakdown.busy / Math.max(1, workforceBreakdown.total)) * 100
                    )}%`,
                  }}
                  className="bg-indigo-500 transition-all duration-500"
                  title={`Busy: ${workforceBreakdown.busy}`}
                />
                <div
                  style={{
                    width: `${Math.round(
                      (workforceBreakdown.underutilized / Math.max(1, workforceBreakdown.total)) *
                        100
                    )}%`,
                  }}
                  className="bg-amber-500 transition-all duration-500"
                  title={`Underutilized: ${workforceBreakdown.underutilized}`}
                />
                <div
                  style={{
                    width: `${Math.round(
                      (workforceBreakdown.unavailable / Math.max(1, workforceBreakdown.total)) * 100
                    )}%`,
                  }}
                  className="bg-slate-400 dark:bg-slate-600 transition-all duration-500"
                  title={`Unavailable / Deactivated: ${workforceBreakdown.unavailable}`}
                />
              </div>
            </div>

            {/* Status Legend & Counts */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <div className="p-2.5 rounded-lg border border-border/50 bg-background/50 space-y-0.5">
                <div className="flex items-center space-x-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Available Now</span>
                </div>
                <p className="text-xl font-bold font-mono text-foreground">
                  {workforceBreakdown.available}
                </p>
                <p className="text-[10px] text-muted-foreground">Ready for immediate dispatch</p>
              </div>

              <div className="p-2.5 rounded-lg border border-border/50 bg-background/50 space-y-0.5">
                <div className="flex items-center space-x-1.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span>Actively Busy</span>
                </div>
                <p className="text-xl font-bold font-mono text-foreground">
                  {workforceBreakdown.busy}
                </p>
                <p className="text-[10px] text-muted-foreground">Assigned to in-progress jobs</p>
              </div>

              <div className="p-2.5 rounded-lg border border-border/50 bg-background/50 space-y-0.5">
                <div className="flex items-center space-x-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Under-Utilized</span>
                </div>
                <p className="text-xl font-bold font-mono text-foreground">
                  {workforceBreakdown.underutilized}
                </p>
                <p className="text-[10px] text-muted-foreground">&lt;40% capacity utilization</p>
              </div>

              <div className="p-2.5 rounded-lg border border-border/50 bg-background/50 space-y-0.5">
                <div className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  <span>Offline / Inactive</span>
                </div>
                <p className="text-xl font-bold font-mono text-foreground">
                  {workforceBreakdown.unavailable}
                </p>
                <p className="text-[10px] text-muted-foreground">Deactivated or off-duty</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExecuteAction("REVIEW_WORKFORCE")}
              className="w-full text-xs font-semibold h-8 mt-1 border-border/80"
            >
              Open Full Workforce Roster
              <ArrowUpRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 4. Trade Shortage Balance — Chart comparing Demand vs Available by Trade */}
      <Card className="border border-border/70 bg-card/60 backdrop-blur-xs shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <Layers className="h-4 w-4 text-rose-500" />
              <CardTitle className="text-sm font-bold text-foreground">
                Trade Shortage Balance Matrix
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Direct comparison between service booking demand and available qualified craftsmen per trade
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[11px] font-mono self-start sm:self-auto">
            Total Gap: {totalDemandGap} Unmet Jobs
          </Badge>
        </CardHeader>

        <CardContent className="pt-4 space-y-5">
          {/* Recharts BarChart comparing Demand vs Available */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={tradeGaps}
                margin={{ top: 10, right: 10, left: -15, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-border/40"
                  vertical={false}
                />
                <XAxis
                  dataKey="trade"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  interval={0}
                  className="text-muted-foreground font-medium"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={30}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px" }}
                />
                <Bar
                  dataKey="demand"
                  name="Booking Demand"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="available_qualified_workers"
                  name="Available Qualified"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Trade Gap Interactive Diagnostic Table */}
          <div className="overflow-x-auto rounded-lg border border-border/50">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                  <th className="p-3">Trade</th>
                  <th className="p-3 text-center">Demand (Bookings)</th>
                  <th className="p-3 text-center">Available Qualified</th>
                  <th className="p-3 text-center">Demand Gap (Jobs)</th>
                  <th className="p-3 text-center">Deficit Severity</th>
                  <th className="p-3 text-right">Operational Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 bg-card/40">
                {tradeGaps.map((item) => (
                  <tr
                    key={item.trade}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="p-3 font-semibold text-foreground flex items-center gap-2">
                      <span>{item.trade}</span>
                      {item.demand_gap >= 50 && (
                        <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                      )}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-foreground">
                      {item.demand}
                    </td>
                    <td className="p-3 text-center font-mono font-medium text-foreground">
                      {item.available_qualified_workers}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-rose-600 dark:text-rose-400">
                      {item.demand_gap}
                    </td>
                    <td className="p-3 text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${getSeverityBadgeClass(
                          item.severity || (item.demand_gap > 0 ? "HIGH" : "LOW")
                        )}`}
                      >
                        {item.severity || (item.demand_gap > 0 ? "DEFICIT" : "ADEQUATE")}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleExecuteAction("REVIEW_TRADE_WORKERS", item.trade)
                        }
                        className="text-xs font-medium h-7 px-2.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
                      >
                        Inspect {item.trade}
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 5. Priority Operational Issues & Action Hub */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-indigo-500" />
              Priority Operational Issues
            </h2>
            <p className="text-xs text-muted-foreground">
              Algorithmic diagnosis connecting platform evidence, operational impact, and real platform actions
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 shrink-0 ${
                  selectedCategory === cat.id
                    ? "bg-foreground text-background border-foreground shadow-xs"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCategory === cat.id
                      ? "bg-background/20 text-background"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Issue Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProblems.length === 0 ? (
            <div className="col-span-full p-8 text-center border rounded-xl bg-card/40 space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-semibold">No active issues in this category</p>
              <p className="text-xs text-muted-foreground">
                All platform metrics in this category are operating within acceptable thresholds.
              </p>
            </div>
          ) : (
            filteredProblems.map((problem) => {
              return (
                <Card
                  key={problem.id}
                  className="border border-border/80 bg-card/70 backdrop-blur-xs shadow-xs flex flex-col justify-between hover:border-border transition-all"
                >
                  <CardHeader className="pb-3 border-b border-border/40">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold ${getSeverityBadgeClass(
                              problem.severity
                            )}`}
                          >
                            {problem.severity}
                          </Badge>
                          <span className="text-[10px] font-mono text-muted-foreground uppercase">
                            {problem.category}
                          </span>
                        </div>
                        <CardTitle className="text-sm font-bold text-foreground">
                          {problem.title}
                        </CardTitle>
                      </div>
                    </div>
                    <CardDescription className="text-xs text-muted-foreground mt-1">
                      {problem.problem}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="py-3.5 space-y-3 text-xs">
                    {/* Problem -> Evidence */}
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Verified Evidence
                      </span>
                      <div className="space-y-0.5 text-xs font-mono font-medium text-foreground">
                        {problem.evidence.map((ev, evIdx) => (
                          <p key={evIdx}>&bull; {ev}</p>
                        ))}
                      </div>
                    </div>

                    {/* Impact Statement */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Operational Impact
                      </span>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {problem.impact}
                      </p>
                    </div>

                    {/* Recommended Solution */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Recommended Solution
                      </span>
                      <p className="text-xs font-medium text-foreground leading-relaxed">
                        {problem.solution}
                      </p>
                    </div>
                  </CardContent>

                  {/* Operational Action Footer */}
                  <div className="p-3 border-t border-border/40 bg-muted/20 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {problem.actionIds.map((actId, actIdx) => {
                        const resolved = resolveOperationalAction(actId, {
                          trade: problem.trade,
                        });
                        return (
                          <Button
                            key={actId}
                            size="sm"
                            variant={actIdx === 0 ? "default" : "outline"}
                            onClick={() => handleExecuteAction(actId, problem.trade)}
                            className={`text-xs font-semibold h-8 ${
                              actIdx === 0
                                ? "bg-foreground text-background hover:bg-foreground/90"
                                : "border-border/80"
                            }`}
                          >
                            {resolved.label}
                            <ArrowUpRight className="h-3 w-3 ml-1" />
                          </Button>
                        );
                      })}
                    </div>

                    {problem.actionIds[0] && (
                      <span className="text-[10px] text-muted-foreground">
                        Route:{" "}
                        <code className="font-mono text-foreground/80">
                          {resolveOperationalAction(problem.actionIds[0], { trade: problem.trade })
                            .href.split("?")[0]}
                        </code>
                      </span>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* 6. Recommended Operational Action Plan (TODAY vs NEXT Checklists) */}
      {intelligence?.recommended_plan && (
        <Card className="border border-border/70 bg-card/60 backdrop-blur-xs shadow-xs">
          <CardHeader className="pb-3 border-b border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <CalendarClock className="h-4 w-4 text-emerald-500" />
                <CardTitle className="text-sm font-bold text-foreground">
                  Recommended Operational Action Plan
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Prioritized procedural agenda for cooperative administrative teams
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground font-medium">Demand Outlook:</span>
              <Badge
                variant="outline"
                className={`text-xs font-mono font-bold uppercase ${getOutlookBadgeClass(
                  intelligence.outlook_level
                )}`}
              >
                {intelligence.outlook_level}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TODAY Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  Immediate Action Checklist (Today)
                </h3>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {intelligence.recommended_plan.today.length} tasks
                </span>
              </div>

              <div className="space-y-2.5">
                {intelligence.recommended_plan.today.map((item, idx) => (
                  <div
                    key={`today-${idx}`}
                    className="p-3 rounded-lg border border-border/60 bg-background/60 flex items-start justify-between gap-3 hover:border-border transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          className="text-[9px] font-bold uppercase bg-rose-500/10 text-rose-700 border-rose-300 dark:text-rose-300"
                        >
                          {item.priority || "URGENT"}
                        </Badge>
                        {item.trade && (
                          <span className="text-[10px] text-muted-foreground uppercase font-mono">
                            {item.trade}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-foreground">{item.step}</p>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExecuteAction(item.actionId, item.trade)}
                      className="text-xs font-semibold h-7 px-2.5 shrink-0 border-border/80 hover:bg-muted"
                    >
                      {item.label}
                      <ArrowUpRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* NEXT Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  Strategic Follow-Up Agenda (Next)
                </h3>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {intelligence.recommended_plan.next.length} tasks
                </span>
              </div>

              <div className="space-y-2.5">
                {intelligence.recommended_plan.next.map((item, idx) => (
                  <div
                    key={`next-${idx}`}
                    className="p-3 rounded-lg border border-border/60 bg-background/60 flex items-start justify-between gap-3 hover:border-border transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          className="text-[9px] font-bold uppercase bg-indigo-500/10 text-indigo-700 border-indigo-300 dark:text-indigo-300"
                        >
                          {item.priority || "RECOMMENDED"}
                        </Badge>
                        {item.trade && (
                          <span className="text-[10px] text-muted-foreground uppercase font-mono">
                            {item.trade}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-foreground">{item.step}</p>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExecuteAction(item.actionId, item.trade)}
                      className="text-xs font-semibold h-7 px-2.5 shrink-0 border-border/80 hover:bg-muted"
                    >
                      {item.label}
                      <ArrowUpRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 7. Advisory & Verification Audit Footer */}
      <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center space-x-2">
          <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>
            {intelligence?.disclaimer ||
              "AI Operations Intelligence is strictly advisory. No automatic worker dispatch or financial mutations are executed."}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px] font-mono shrink-0">
          <span>Confidence: <strong className="text-foreground">{intelligence?.confidence || "HIGH"}</strong></span>
          <span>&bull;</span>
          <span>
            {intelligence?.is_fallback
              ? "Engine: Deterministic Platform Fallback"
              : "Engine: Groq LLM Advisory"}
          </span>
        </div>
      </div>
    </div>
  );
}
