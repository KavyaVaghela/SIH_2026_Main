"use client";

import * as React from "react";
import { BarChart3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CATEGORY_COVERAGE_DATA } from "../data/welfare-mock-data";

export function CoverageByCategoryCard() {
  return (
    <Card className="border border-border/80 shadow-sm flex flex-col justify-between h-full min-w-0 max-w-full overflow-hidden">
      <CardHeader className="pb-2 border-b border-border/60">
        <div className="flex items-center gap-2 min-w-0">
          <BarChart3 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div className="min-w-0">
            <CardTitle className="text-base font-bold text-foreground truncate">
              Coverage by Category
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              Welfare coverage percentage by category
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3.5 flex-1 flex flex-col justify-center min-w-0 max-w-full">
        {CATEGORY_COVERAGE_DATA.map((item) => (
          <div key={item.category} className="space-y-1 min-w-0">
            <div className="flex items-center justify-between text-xs font-semibold gap-2 min-w-0">
              <span className="text-foreground truncate min-w-0">{item.category}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                {item.percentage}%
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
