"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Layers,
  FileText,
} from "lucide-react";
import type { ComplaintOverviewAnalytics } from "@/features/super-admin/complaints/types/v2";

export function FederationComplaintAnalyticsSection() {
  const [data, setData] = React.useState<ComplaintOverviewAnalytics | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    async function loadComplaintAnalytics() {
      try {
        const res = await fetch("/api/complaints/analytics?scope=platform");
        if (res.ok) {
          const json = await res.json();
          if (json.overview) {
            setData(json.overview);
          }
        }
      } catch (err) {
        console.error("Failed to load platform complaint analytics:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadComplaintAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4 pt-4 border-t border-border/40">
        <Skeleton className="h-6 w-64 mb-2" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const { overallMetrics, federations, volumeTrend } = data;

  return (
    <div className="space-y-4 pt-4 border-t border-border/40">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-foreground">
            Federation Grievance & Operational Dispute Monitoring
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Factual monitoring indicators across cooperative societies. Transparent dispute counts, stage progression, and resolution time averages.
        </p>
      </div>

      {/* 4 Summary Metric Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 border-border/40 bg-card shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Total Disputes Logged</span>
            <FileText className="h-3.5 w-3.5" />
          </div>
          <p className="text-lg font-bold text-foreground mt-1.5">{overallMetrics.totalComplaints}</p>
          <span className="text-[10px] text-muted-foreground">Platform-wide cumulative</span>
        </Card>

        <Card className="p-3 border-border/40 bg-card shadow-sm">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs">
            <span>Active Grievances</span>
            <Clock className="h-3.5 w-3.5" />
          </div>
          <p className="text-lg font-bold text-foreground mt-1.5">
            {overallMetrics.openComplaints + overallMetrics.underReviewComplaints}
          </p>
          <span className="text-[10px] text-muted-foreground">
            {overallMetrics.openComplaints} open · {overallMetrics.underReviewComplaints} under review
          </span>
        </Card>

        <Card className="p-3 border-border/40 bg-card shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs">
            <span>Disputes Resolved</span>
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
          <p className="text-lg font-bold text-foreground mt-1.5">{overallMetrics.resolvedComplaints}</p>
          <span className="text-[10px] text-muted-foreground">
            {overallMetrics.closedComplaints} additional closed
          </span>
        </Card>

        <Card className="p-3 border-border/40 bg-card shadow-sm">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 text-xs">
            <span>Avg Resolution Time</span>
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          <p className="text-lg font-bold text-foreground mt-1.5">
            {overallMetrics.averageResolutionHours > 0 ? `${overallMetrics.averageResolutionHours} hrs` : "N/A"}
          </p>
          <span className="text-[10px] text-muted-foreground">Filing to recorded resolution</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Factual Federation Breakdown Table */}
        <Card className="border shadow-sm overflow-hidden p-0">
          <CardHeader className="p-4 border-b bg-muted/30">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              <span>Cooperative Society Grievance Counts</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Direct factual grievance distribution per federation jurisdiction
            </CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                  <th className="p-2.5">Federation</th>
                  <th className="p-2.5 text-center">Total</th>
                  <th className="p-2.5 text-center">Open</th>
                  <th className="p-2.5 text-center">Waiting</th>
                  <th className="p-2.5 text-center">Resolved</th>
                  <th className="p-2.5 text-right">Avg Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {federations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      No complaint records found.
                    </td>
                  </tr>
                ) : (
                  federations.map((f) => (
                    <tr key={f.federationId} className="hover:bg-muted/20">
                      <td className="p-2.5 font-medium text-foreground max-w-[180px] truncate" title={f.federationName}>
                        {f.federationName}
                      </td>
                      <td className="p-2.5 text-center font-bold font-mono text-foreground">{f.totalComplaints}</td>
                      <td className="p-2.5 text-center text-yellow-600 dark:text-yellow-400 font-medium">
                        {f.openComplaints}
                      </td>
                      <td className="p-2.5 text-center text-orange-600 dark:text-orange-400 font-medium">
                        {f.waitingForResponseComplaints}
                      </td>
                      <td className="p-2.5 text-center text-emerald-600 dark:text-emerald-400 font-bold">
                        {f.resolvedComplaints}
                      </td>
                      <td className="p-2.5 text-right font-mono text-foreground">
                        {f.averageResolutionHours > 0 ? `${f.averageResolutionHours}h` : "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Complaint Volume Trend */}
        <Card className="border shadow-sm p-4">
          <CardHeader className="p-0 pb-3 border-b mb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span>Platform Dispute Trend (Filed vs Resolved)</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Chronological progression of newly filed complaints against resolved cases
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-56">
            {volumeTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-muted-foreground">No chronological trend data available.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                  <Legend verticalAlign="top" align="right" height={20} iconSize={8} wrapperStyle={{ fontSize: "10px" }} />
                  <Area type="monotone" dataKey="created" name="Filed" stroke="#ef4444" fill="#fee2e2" />
                  <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" fill="#d1fae5" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
