"use client";

import * as React from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/formatters/currency";

export interface EarningsChartCardProps {
  dailyData: Array<{ day: string; date: string; amount: number }>;
}

export function EarningsChartCard({ dailyData }: EarningsChartCardProps) {
  const maxAmount = Math.max(...dailyData.map((d) => d.amount), 1000);
  const total7Days = dailyData.reduce((sum, d) => sum + d.amount, 0);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="p-4 sm:p-5 border-b pb-3 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              7-Day Earnings Trend
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Daily settled payouts over the trailing 7 days
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-muted-foreground block">7-Day Total</span>
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono">
            {formatINR(total7Days)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {total7Days === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <TrendingUp className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs font-medium text-foreground">Not enough earnings data yet.</p>
            <p className="text-[11px] text-muted-foreground">
              Earnings from completed and paid service bookings will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-48 flex items-end justify-between gap-2 pt-4 px-2">
              {dailyData.map((item, idx) => {
                const heightPercent = Math.max(8, Math.round((item.amount / maxAmount) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.amount > 0 ? formatINR(item.amount) : "₹0"}
                    </span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[36px] rounded-t-md transition-all duration-300 ${
                        item.amount > 0
                          ? "bg-emerald-600 hover:bg-emerald-500"
                          : "bg-muted/40 hover:bg-muted/60"
                      }`}
                    />
                    <span className="text-[11px] font-medium text-muted-foreground mt-1">
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t flex justify-between text-[11px] text-muted-foreground px-1">
              <span>Trailing 7-Day Window</span>
              <span className="font-semibold text-foreground">100% Real Settled Records</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
