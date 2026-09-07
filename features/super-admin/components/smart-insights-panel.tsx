"use client";

import * as React from "react";
import Link from "next/link";
import { Lightbulb, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { SmartInsight } from "../types";

interface SmartInsightsPanelProps {
  insights?: SmartInsight[];
  isLoading?: boolean;
}

export function SmartInsightsPanel({ insights, isLoading }: SmartInsightsPanelProps) {
  if (isLoading || !insights) {
    return (
      <Card className="border shadow-sm p-4 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-24 w-full" />
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm bg-linear-to-br from-card via-card to-emerald-950/5 dark:to-emerald-950/20">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          <CardTitle className="text-base font-bold text-foreground">
            Smart Platform Insights & Recommendations
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Algorithmic analysis of workforce supply-demand imbalances, welfare utilization, and operational opportunities
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl border bg-card/80 hover:bg-card shadow-xs flex flex-col justify-between space-y-3 transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100/60 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                >
                  <Lightbulb className="h-3 w-3 mr-1 inline text-emerald-700" />
                  {item.category}
                </Badge>
              </div>

              <h4 className="text-sm font-bold text-foreground leading-snug">{item.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.insight}</p>
            </div>

            <div className="pt-2 border-t space-y-3">
              <div className="text-[11px] p-2 rounded-md bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 font-medium text-emerald-900 dark:text-emerald-200">
                <span className="font-bold">Impact: </span>
                {item.impact}
              </div>

              {item.actionLabel && item.actionUrl && (
                <Link
                  href={item.actionUrl}
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "w-full h-8 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs"
                  )}
                >
                  {item.actionLabel}
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
