"use client";

import * as React from "react";
import Link from "next/link";
import { TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DemandCategorySummary } from "../types";

interface DemandSummaryPanelProps {
  categories?: DemandCategorySummary[];
  isLoading?: boolean;
}

export function DemandSummaryPanel({
  categories,
  isLoading,
}: DemandSummaryPanelProps) {
  if (isLoading || !categories) {
    return (
      <Card className="border bg-card shadow-xs p-4 space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  const hasCategories = categories.length > 0;

  return (
    <Card className="border bg-card shadow-xs flex flex-col justify-between h-full">
      <div>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            <CardTitle className="text-base font-bold text-foreground">
              Market Demand Summary
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Top requested skill categories derived from live database bookings
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {!hasCategories ? (
            <div className="py-8 text-center text-muted-foreground space-y-1">
              <p className="text-xs font-semibold text-foreground">No Category Demand Recorded</p>
              <p className="text-[11px]">As customer requests are created, service demand will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {categories.slice(0, 5).map((cat) => (
                <div
                  key={cat.categoryId}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors border"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">{cat.categoryName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {cat.bookingCount.toLocaleString()} request{cat.bookingCount === 1 ? "" : "s"} logged
                    </p>
                  </div>
                  {cat.growthPercentage > 0 && (
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold"
                    >
                      {cat.growthPercentage}% share
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </div>

      <div className="p-4 pt-0 border-t border-border/40 mt-auto">
        <Link
          href="/super-admin/analytics"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-full h-8 text-xs font-semibold mt-3 border-emerald-700/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
          )}
        >
          View Demand & Analytics
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Link>
      </div>
    </Card>
  );
}
