"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number;
  suffix?: string;
  benchmark?: string;
  description?: string;
  icon: React.ReactNode;
  max?: number;
  progressColor?: string;
  isLoading?: boolean;
  className?: string;
}

export function MetricCard({
  title,
  value,
  suffix = "%",
  benchmark,
  description,
  icon,
  max = 100,
  progressColor = "bg-emerald-600",
  isLoading,
  className,
}: MetricCardProps) {
  if (isLoading) {
    return (
      <Card className={cn("border bg-card shadow-xs", className)}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-3 w-36" />
        </CardContent>
      </Card>
    );
  }

  // Calculate percentage fill for bar
  const percentFill = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <Card className={cn("border bg-card shadow-xs hover:border-border/80 transition-colors", className)}>
      <CardContent className="p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
            {icon}
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {value}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              {suffix}
            </span>
          </div>

          {benchmark && (
            <span className="text-[11px] font-medium text-muted-foreground">
              {benchmark}
            </span>
          )}
        </div>

        {/* Visual Progress Meter */}
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", progressColor)}
            style={{ width: `${percentFill}%` }}
          />
        </div>

        {description && (
          <p className="text-[11px] text-muted-foreground leading-snug pt-0.5">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
