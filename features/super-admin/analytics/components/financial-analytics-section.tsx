"use client";

import * as React from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  Receipt,
  FileCheck2,
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Users,
  Coins,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { FinancialAnalyticsData } from "../types";

interface FinancialAnalyticsSectionProps {
  data: FinancialAnalyticsData | null;
  isLoading?: boolean;
}

export function FinancialAnalyticsSection({ data, isLoading }: FinancialAnalyticsSectionProps) {
  if (isLoading || !data) {
    return (
      <Card className="border bg-card shadow-xs p-6 space-y-4">
        <Skeleton className="h-6 w-64 mb-2" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </Card>
    );
  }

  const { overview, paymentStatusBreakdown, invoiceStatusBreakdown, trend, federationFinancials } = data;

  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatCompactCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val.toFixed(0)}`;
  };

  return (
    <Card className="border bg-card shadow-xs">
      <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Coins className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            <CardTitle className="text-base font-bold text-foreground">
              Platform Economics & Invoicing Intelligence
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Gross transaction volume, guaranteed worker earnings, federation service share, nominal sustainability fee, and statutory compliance
          </CardDescription>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 text-xs font-bold"
          >
            {formatCurrency(overview.totalTransactionVolume)} Volume
          </Badge>
          <Badge
            variant="outline"
            className="bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/70 dark:text-sky-200 text-xs font-bold"
          >
            {overview.paymentSuccessRate !== null ? `${overview.paymentSuccessRate}% Success Rate` : "—"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* 6 Cooperative Economics KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Gross Volume */}
          <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase truncate">
                Gross Volume
              </span>
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <p className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
              {formatCompactCurrency(overview.totalTransactionVolume)}
            </p>
            <p className="text-[10px] text-muted-foreground truncate" title={formatCurrency(overview.totalTransactionVolume)}>
              {overview.successfulPaymentsCount} completed payments
            </p>
          </div>

          {/* 2. Worker Earnings */}
          <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase truncate">
                Worker Earnings
              </span>
              <Users className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <p className="text-xl font-bold font-mono text-blue-700 dark:text-blue-400 mt-0.5">
              {formatCompactCurrency(overview.workerEarnings ?? 0)}
            </p>
            <p className="text-[10px] text-muted-foreground truncate" title={formatCurrency(overview.workerEarnings ?? 0)}>
              Guaranteed gig payout
            </p>
          </div>

          {/* 3. Federation Retained Share */}
          <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase truncate">
                Fed. Service Share
              </span>
              <Building2 className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <p className="text-xl font-bold font-mono text-purple-700 dark:text-purple-400 mt-0.5">
              {formatCompactCurrency(overview.federationShare ?? 0)}
            </p>
            <p className="text-[10px] text-muted-foreground truncate" title={formatCurrency(overview.federationShare ?? 0)}>
              Cooperative retained value
            </p>
          </div>

          {/* 4. Platform Sustainability Fee */}
          <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase truncate">
                Sustainability Fee
              </span>
              <Receipt className="h-3.5 w-3.5 text-indigo-600" />
            </div>
            <p className="text-xl font-bold font-mono text-foreground mt-0.5">
              {formatCompactCurrency(overview.platformCommission)}
            </p>
            <p className="text-[10px] text-muted-foreground truncate" title={formatCurrency(overview.platformCommission)}>
              5% nominal platform fee
            </p>
          </div>

          {/* 5. Tax Collected */}
          <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase truncate">
                Tax Collected
              </span>
              <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
            </div>
            <p className="text-xl font-bold font-mono text-sky-700 dark:text-sky-400 mt-0.5">
              {formatCompactCurrency(overview.taxCollected)}
            </p>
            <p className="text-[10px] text-muted-foreground truncate" title={formatCurrency(overview.taxCollected)}>
              Statutory 18% GST
            </p>
          </div>

          {/* 6. Receivables */}
          <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase truncate">
                Receivables
              </span>
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <p className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-0.5">
              {formatCompactCurrency(overview.outstandingReceivables)}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {invoiceStatusBreakdown.issuedCount} pending invoices
            </p>
          </div>
        </div>

        {/* Two-Column Grid: Left (Daily Payment Volume Trend + Status Strips), Right (Federation Financial Activity) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Trend & Status Summary */}
          <div className="space-y-4">
            {/* Financial Trend Chart */}
            <div className="p-4 rounded-xl border bg-muted/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center">
                  <TrendingUp className="h-3.5 w-3.5 mr-1.5 text-emerald-700" />
                  Transaction Settlement Trend (Volume by Date)
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {trend.length} Active Settlement Dates
                </span>
              </div>

              <div className="w-full h-56 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="financialVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        fontSize: "12px",
                        color: "hsl(var(--popover-foreground))",
                      }}
                      formatter={(val: number) => [`₹${val.toLocaleString()}`, "Settled Volume"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      stroke="#059669"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#financialVolumeGrad)"
                      name="Volume"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Operational Payment & Invoice Breakdown Strip */}
            <div className="grid grid-cols-2 gap-3">
              {/* Payment Status Box */}
              <div className="p-3.5 rounded-xl border bg-card space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span>Payment Gateway Status</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400">
                    {overview.paymentSuccessRate !== null ? `${overview.paymentSuccessRate}%` : "—"}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" /> Settled / Paid:
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {paymentStatusBreakdown.paidCount} ({formatCompactCurrency(paymentStatusBreakdown.paidAmount)})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-amber-500" /> Pending Verification:
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {paymentStatusBreakdown.pendingCount} ({formatCompactCurrency(paymentStatusBreakdown.pendingAmount)})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1 text-rose-500" /> Failed Payments:
                    </span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      {overview.failedPaymentsCount ?? paymentStatusBreakdown.failedCount}
                    </span>
                  </div>
                </div>
                <div className="pt-1.5 border-t border-border/40 text-[10px] text-muted-foreground flex justify-between">
                  <span>Avg Transaction:</span>
                  <span className="font-mono font-bold text-foreground">
                    {overview.averageTransactionValue !== null ? formatCurrency(overview.averageTransactionValue) : "—"}
                  </span>
                </div>
              </div>

              {/* Invoice Status Box */}
              <div className="p-3.5 rounded-xl border bg-card space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span>Invoicing Status</span>
                  <span className="font-mono text-foreground">
                    {invoiceStatusBreakdown.totalCount} Invoices
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center">
                      <FileCheck2 className="h-3 w-3 mr-1 text-emerald-600" /> Paid Invoices:
                    </span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {invoiceStatusBreakdown.paidCount} ({formatCompactCurrency(invoiceStatusBreakdown.paidAmount)})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1 text-amber-500" /> Issued / Outstanding:
                    </span>
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                      {invoiceStatusBreakdown.issuedCount} ({formatCompactCurrency(invoiceStatusBreakdown.issuedAmount)})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Settlement Rate:</span>
                    <span className="font-mono font-bold text-foreground">
                      {invoiceStatusBreakdown.totalCount > 0
                        ? `${((invoiceStatusBreakdown.paidCount / invoiceStatusBreakdown.totalCount) * 100).toFixed(1)}%`
                        : "—"}
                    </span>
                  </div>
                </div>
                <div className="pt-1.5 border-t border-border/40 text-[10px] text-muted-foreground flex justify-between">
                  <span>Invoice Total:</span>
                  <span className="font-mono font-bold text-foreground">
                    {formatCompactCurrency(invoiceStatusBreakdown.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Federation Financial Activity */}
          <div className="border rounded-xl flex flex-col justify-between overflow-hidden bg-card">
            <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Federation Financial Activity
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Invoices & payments linked
              </span>
            </div>

            <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                    <th className="p-2.5">Federation</th>
                    <th className="p-2.5 text-center">Location</th>
                    <th className="p-2.5 text-center">Txns</th>
                    <th className="p-2.5 text-right">Volume</th>
                    <th className="p-2.5 text-right">Platform Fee</th>
                    <th className="p-2.5 text-center">Paid Invoices</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {federationFinancials.map((fed) => {
                    const hasActivity = fed.transactionCount > 0 || fed.totalInvoicesCount > 0;
                    return (
                      <tr key={fed.federationId} className="hover:bg-muted/20 transition-colors">
                        <td className="p-2.5 font-medium text-foreground max-w-[170px] truncate" title={fed.federationName}>
                          <Link
                            href={`/super-admin/societies/${fed.federationId}`}
                            className="hover:text-emerald-700 hover:underline"
                          >
                            {fed.federationName}
                          </Link>
                        </td>
                        <td className="p-2.5 text-center text-muted-foreground truncate max-w-[90px]">
                          {fed.city}
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold">
                          {fed.transactionCount > 0 ? (
                            <span>{fed.transactionCount}</span>
                          ) : (
                            <span className="text-muted-foreground font-normal">0</span>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-foreground">
                          {hasActivity ? formatCompactCurrency(fed.transactionVolume) : "—"}
                        </td>
                        <td className="p-2.5 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                          {hasActivity ? formatCompactCurrency(fed.platformFee) : "—"}
                        </td>
                        <td className="p-2.5 text-center font-mono text-muted-foreground">
                          {fed.totalInvoicesCount > 0 ? (
                            <span>
                              {fed.paidInvoicesCount} / {fed.totalInvoicesCount}
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-normal">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t bg-muted/20 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>{federationFinancials.filter((f) => f.transactionCount > 0).length} Federations Generating Revenue</span>
              <span className="font-semibold text-foreground">Audited Multi-Region Gig Flow</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
