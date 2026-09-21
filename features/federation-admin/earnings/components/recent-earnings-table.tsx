"use client";

import * as React from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { RecentEarningsTransaction } from "../types";

interface RecentEarningsTableProps {
  transactions?: RecentEarningsTransaction[];
  isLoading?: boolean;
}

export function RecentEarningsTable({ transactions, isLoading }: RecentEarningsTableProps) {
  if (isLoading || !transactions) {
    return (
      <Card className="border bg-card shadow-xs">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (val: number) => `₹${val.toLocaleString("en-IN")}`;

  return (
    <Card className="border bg-card shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Recent Earnings
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Audited transaction ledger of recently completed service orders
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-medium text-muted-foreground">
            {transactions.length} Records
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-y border-border/60 text-muted-foreground font-semibold">
              <tr>
                <th scope="col" className="py-3 px-4">Date</th>
                <th scope="col" className="py-3 px-4">Service</th>
                <th scope="col" className="py-3 px-4">Customer Location</th>
                <th scope="col" className="py-3 px-4 text-right">Amount (₹)</th>
                <th scope="col" className="py-3 px-4 text-right">Commission (₹)</th>
                <th scope="col" className="py-3 px-4 text-right">Net (₹)</th>
                <th scope="col" className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                    {txn.date}
                  </td>
                  <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                    {txn.service}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                    {txn.location}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-foreground whitespace-nowrap">
                    {formatCurrency(txn.amount)}
                  </td>
                  <td className="py-3 px-4 text-right text-amber-700 dark:text-amber-400 font-medium whitespace-nowrap">
                    {formatCurrency(txn.commission)}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-700 dark:text-emerald-400 font-bold whitespace-nowrap">
                    {formatCurrency(txn.net)}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600 inline" />
                      Completed
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
