"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Building2,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ComplaintOverviewAnalytics, FederationComplaintMetricsRow } from "../types/v2";

interface FederationComplaintOverviewProps {
  overview: ComplaintOverviewAnalytics | null;
  isLoading: boolean;
  onFilterChange: (filters: {
    federationId?: string;
    status?: string;
    priority?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => void;
  activeFilters: {
    federationId?: string;
    status?: string;
    priority?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  Open: "#eab308",
  "Under Review": "#3b82f6",
  "Action Required": "#f97316",
  Resolved: "#10b981",
  Rejected: "#ef4444",
  Closed: "#6b7280",
  Escalated: "#8b5cf6",
};

export function FederationComplaintOverview({
  overview,
  isLoading,
  onFilterChange,
  activeFilters,
}: FederationComplaintOverviewProps) {
  const [selectedFed, setSelectedFed] = React.useState<string>(activeFilters.federationId || "ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<string>(activeFilters.status || "ALL");
  const [selectedPriority, setSelectedPriority] = React.useState<string>(activeFilters.priority || "ALL");
  const [dateFrom, setDateFrom] = React.useState<string>(activeFilters.dateFrom || "");
  const [dateTo, setDateTo] = React.useState<string>(activeFilters.dateTo || "");

  const handleApplyFilters = () => {
    onFilterChange({
      federationId: selectedFed !== "ALL" ? selectedFed : undefined,
      status: selectedStatus !== "ALL" ? selectedStatus : undefined,
      priority: selectedPriority !== "ALL" ? selectedPriority : undefined,
      dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
    });
  };

  const handleResetFilters = () => {
    setSelectedFed("ALL");
    setSelectedStatus("ALL");
    setSelectedPriority("ALL");
    setDateFrom("");
    setDateTo("");
    onFilterChange({});
  };

  if (isLoading || !overview) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const { overallMetrics, federations, statusDistribution, volumeByFederation, volumeTrend, categoryDistribution } = overview;

  return (
    <div className="space-y-6">
      {/* 6 Top KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3 border-border/40 bg-card shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Total Complaints</span>
            <FileText className="h-3.5 w-3.5" />
          </div>
          <p className="text-xl font-bold text-foreground mt-2">{overallMetrics.totalComplaints}</p>
          <span className="text-[10px] text-muted-foreground">All time cross-federation</span>
        </Card>

        <Card className="p-3 border-border/40 bg-card shadow-sm">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs">
            <span>Open & In Review</span>
            <Clock className="h-3.5 w-3.5" />
          </div>
          <p className="text-xl font-bold text-foreground mt-2">
            {overallMetrics.openComplaints + overallMetrics.underReviewComplaints}
          </p>
          <span className="text-[10px] text-muted-foreground">
            {overallMetrics.openComplaints} open · {overallMetrics.underReviewComplaints} in review
          </span>
        </Card>

        <Card className="p-3 border-border/40 bg-card shadow-sm">
          <div className="flex items-center justify-between text-orange-600 dark:text-orange-400 text-xs">
            <span>Waiting Response</span>
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
          <p className="text-xl font-bold text-foreground mt-2">{overallMetrics.waitingForResponseComplaints}</p>
          <span className="text-[10px] text-muted-foreground">Party statement required</span>
        </Card>

        <Card className="p-3 border-border/40 bg-card shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs">
            <span>Resolved / Closed</span>
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
          <p className="text-xl font-bold text-foreground mt-2">
            {overallMetrics.resolvedComplaints + overallMetrics.closedComplaints}
          </p>
          <span className="text-[10px] text-muted-foreground">
            {overallMetrics.resolvedComplaints} resolved · {overallMetrics.closedComplaints} closed
          </span>
        </Card>

        <Card className="p-3 border-border/40 bg-card shadow-sm">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 text-xs">
            <span>Central Escalations</span>
            <Layers className="h-3.5 w-3.5" />
          </div>
          <p className="text-xl font-bold text-foreground mt-2">{overallMetrics.escalatedComplaints}</p>
          <span className="text-[10px] text-muted-foreground">Referred to Super Admin</span>
        </Card>

        <Card className="p-3 border-border/40 bg-card shadow-sm">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 text-xs">
            <span>Avg Resolution</span>
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          <p className="text-xl font-bold text-foreground mt-2">
            {overallMetrics.averageResolutionHours > 0 ? `${overallMetrics.averageResolutionHours}h` : "N/A"}
          </p>
          <span className="text-[10px] text-muted-foreground">From filing to closure</span>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-3 border-border/40 shadow-sm bg-card/60 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Filter Monitoring:</span>

            {/* Federation Dropdown */}
            <select
              aria-label="Filter overview by federation"
              value={selectedFed}
              onChange={(e) => setSelectedFed(e.target.value)}
              className="h-8 px-2.5 text-xs rounded-md border border-input bg-background text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Federations</option>
              {federations.map((f) => (
                <option key={f.federationId} value={f.federationId}>
                  {f.federationName}
                </option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              aria-label="Filter overview by status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-8 px-2.5 text-xs rounded-md border border-input bg-background text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ACTION_REQUIRED">Action Required</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CLOSED">Closed</option>
              <option value="ESCALATED">Escalated</option>
            </select>

            {/* Priority Dropdown */}
            <select
              aria-label="Filter overview by priority"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="h-8 px-2.5 text-xs rounded-md border border-input bg-background text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Date Range Inputs */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">From:</span>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-8 text-xs w-32 px-2 py-0"
              />
              <span className="text-muted-foreground">To:</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-8 text-xs w-32 px-2 py-0"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleApplyFilters} className="h-8 text-xs font-semibold px-3">
              Apply Filters
            </Button>
            {(selectedFed !== "ALL" || selectedStatus !== "ALL" || selectedPriority !== "ALL" || dateFrom || dateTo) && (
              <Button size="sm" variant="ghost" onClick={handleResetFilters} className="h-8 text-xs text-muted-foreground">
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 4 Clean Recharts Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: Status Distribution (Donut Chart) */}
        <Card className="border shadow-sm p-4">
          <CardHeader className="p-0 pb-3 border-b mb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              <span>Complaint Status Distribution</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Breakdown of active, pending response, resolved, and terminal complaints across the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-64 flex items-center justify-center">
            {statusDistribution.reduce((acc, s) => acc + s.count, 0) === 0 ? (
              <p className="text-xs text-muted-foreground">No complaint records for this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution.filter((s) => s.count > 0)}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
                    formatter={(value: any, name: any) => [`${value} complaints`, name]}
                  />
                  <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart B: Complaint Volume by Federation (Bar Chart) */}
        <Card className="border shadow-sm p-4">
          <CardHeader className="p-0 pb-3 border-b mb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              <span>Complaint Volume by Federation</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Comparative grievance volume split by Customer, Worker, and Federation-originated cases
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-64">
            {volumeByFederation.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-muted-foreground">No federation data available.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeByFederation} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="federationName"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    tickFormatter={(name) => (name.length > 18 ? `${name.slice(0, 16)}...` : name)}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
                  <Legend verticalAlign="top" align="right" height={25} iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="customer" name="Customer" fill="#3b82f6" stackId="a" />
                  <Bar dataKey="worker" name="Worker" fill="#f59e0b" stackId="a" />
                  <Bar dataKey="federation" name="Federation" fill="#8b5cf6" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart C: Complaint Volume Trend Over Time (Area Chart) */}
        <Card className="border shadow-sm p-4">
          <CardHeader className="p-0 pb-3 border-b mb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span>Complaint Volume & Resolution Trend</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Chronological daily timeline of new complaints filed versus complaints resolved
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-64">
            {volumeTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-muted-foreground">Insufficient time-series data for trend graph.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
                  <Legend verticalAlign="top" align="right" height={25} iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                  <Area type="monotone" dataKey="created" name="Filed" stroke="#ef4444" fill="#fee2e2" />
                  <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" fill="#d1fae5" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart D: Category Distribution (Horizontal Bar Chart) */}
        <Card className="border shadow-sm p-4">
          <CardHeader className="p-0 pb-3 border-b mb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              <span>Complaint Category Breakdown</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Most frequent dispute categories across all regional cooperative federations
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-64">
            {categoryDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-muted-foreground">No categories recorded.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryDistribution.slice(0, 6)}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="category" type="category" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
                  <Bar dataKey="count" name="Count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Factual Federation Metrics Table */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Federation Grievance Workload & Resolution Metrics</span>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Objective, measurable indicators per cooperative society. No arbitrary composite scores or subjective rankings.
              </CardDescription>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              Total Monitored: {federations.length} Federations
            </span>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b bg-muted/50 text-muted-foreground font-semibold">
                <th className="p-3">Federation</th>
                <th className="p-3 text-center">Total</th>
                <th className="p-3 text-center">Customer</th>
                <th className="p-3 text-center">Worker</th>
                <th className="p-3 text-center">Fed Admin</th>
                <th className="p-3 text-center">Open</th>
                <th className="p-3 text-center">Review</th>
                <th className="p-3 text-center">Waiting</th>
                <th className="p-3 text-center">Resolved</th>
                <th className="p-3 text-center">Rejected</th>
                <th className="p-3 text-center">Closed</th>
                <th className="p-3 text-center">Escalated</th>
                <th className="p-3 text-right">Avg Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {federations.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-muted-foreground">
                    No federations registered or no complaints recorded.
                  </td>
                </tr>
              ) : (
                federations.map((f) => (
                  <tr key={f.federationId} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-semibold text-foreground max-w-[220px]">
                      <div className="truncate" title={f.federationName}>
                        {f.federationName}
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {f.federationId.slice(0, 12)}...
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-foreground">
                      <span className="px-2 py-0.5 bg-muted rounded font-mono">{f.totalComplaints}</span>
                    </td>
                    <td className="p-3 text-center text-blue-600 dark:text-blue-400 font-medium">
                      {f.customerComplaints}
                    </td>
                    <td className="p-3 text-center text-amber-600 dark:text-amber-400 font-medium">
                      {f.workerComplaints}
                    </td>
                    <td className="p-3 text-center text-purple-600 dark:text-purple-400 font-medium">
                      {f.federationComplaints}
                    </td>
                    <td className="p-3 text-center text-yellow-600 dark:text-yellow-400 font-medium">
                      {f.openComplaints}
                    </td>
                    <td className="p-3 text-center text-blue-500 font-medium">
                      {f.underReviewComplaints}
                    </td>
                    <td className="p-3 text-center text-orange-600 dark:text-orange-400 font-medium">
                      {f.waitingForResponseComplaints}
                    </td>
                    <td className="p-3 text-center text-emerald-600 dark:text-emerald-400 font-bold">
                      {f.resolvedComplaints}
                    </td>
                    <td className="p-3 text-center text-rose-600 dark:text-rose-400 font-medium">
                      {f.rejectedComplaints}
                    </td>
                    <td className="p-3 text-center text-slate-500 font-medium">
                      {f.closedComplaints}
                    </td>
                    <td className="p-3 text-center text-purple-600 dark:text-purple-400 font-semibold">
                      {f.escalatedComplaints}
                    </td>
                    <td className="p-3 text-right font-mono font-medium text-foreground">
                      {f.averageResolutionHours > 0 ? `${f.averageResolutionHours} hrs` : "N/A"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
