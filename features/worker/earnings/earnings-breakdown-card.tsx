"use client";

import * as React from "react";
import { PieChart, Tag } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/formatters/currency";

export interface EarningsBreakdownCardProps {
  categories: Array<{ category: string; amount: number; count: number }>;
}

export function EarningsBreakdownCard({ categories }: EarningsBreakdownCardProps) {
  const totalAmount = categories.reduce((sum, c) => sum + c.amount, 0);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="p-4 sm:p-5 border-b pb-3 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            <PieChart className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-bold text-foreground">
            Earnings by Service Category
          </CardTitle>
        </div>
        <span className="text-xs text-muted-foreground">
          {categories.length} {categories.length === 1 ? "Category" : "Categories"}
        </span>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {categories.length === 0 ? (
          <p className="text-xs text-muted-foreground italic text-center py-6">
            No service breakdown available yet. Complete paid bookings to populate trade categories.
          </p>
        ) : (
          <div className="space-y-3">
            {categories.map((cat, idx) => {
              const percent = totalAmount > 0 ? Math.round((cat.amount / totalAmount) * 100) : 0;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-foreground flex items-center">
                      <Tag className="h-3 w-3 mr-1.5 text-emerald-600" />
                      {cat.category}
                      <span className="text-[10px] text-muted-foreground font-normal ml-1.5">
                        ({cat.count} {cat.count === 1 ? "job" : "jobs"})
                      </span>
                    </span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {formatINR(cat.amount)} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted/40 overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
