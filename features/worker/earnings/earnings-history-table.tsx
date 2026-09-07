"use client";

import * as React from "react";
import { Receipt, CheckCircle2, ArrowDownRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/formatters/currency";
import type { WorkerEarningsRecord } from "../types";

export interface EarningsHistoryTableProps {
  records: WorkerEarningsRecord[];
}

export function EarningsHistoryTable({ records }: EarningsHistoryTableProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="p-4 sm:p-5 border-b pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            <Receipt className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-bold text-foreground">
            Recent Job Settlements & Payouts
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-muted/40 text-muted-foreground border-b text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Booking Details</th>
                <th className="px-4 py-3">Customer Area</th>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3 text-right">Gross Amount</th>
                <th className="px-4 py-3 text-right">Welfare Cess</th>
                <th className="px-4 py-3 text-right">Net Payout</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-muted-foreground italic">
                    No completed payouts yet. Completed and paid jobs will appear here.
                  </td>
                </tr>
              ) : (
                records.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-foreground">{item.serviceTitle}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {item.bookingNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {item.customerArea}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                      <div>{item.date}</div>
                      <div className="text-[11px] text-muted-foreground/80">{item.time}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-foreground">
                      {formatINR(item.grossAmount)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-emerald-700 dark:text-emerald-400 font-medium">
                      - {formatINR(item.welfareCess)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-emerald-700 dark:text-emerald-400">
                      {formatINR(item.netPayout)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant="success" className="text-[10px] py-0 px-2 font-medium">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                        {item.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
