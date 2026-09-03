"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type StatCardTone = "emerald" | "blue" | "amber" | "rose" | "slate" | "indigo";

interface StatCardProps {
  title: string;
  value?: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  tone?: StatCardTone;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "outline" | "destructive";
  };
  isLoading?: boolean;
  className?: string;
}

const toneStyles: Record<
  StatCardTone,
  { iconBg: string; iconColor: string; borderAccent?: string }
> = {
  emerald: {
    iconBg: "bg-emerald-50 dark:bg-emerald-950/60",
    iconColor: "text-emerald-700 dark:text-emerald-400",
    borderAccent: "hover:border-emerald-500/40",
  },
  blue: {
    iconBg: "bg-blue-50 dark:bg-blue-950/60",
    iconColor: "text-blue-700 dark:text-blue-400",
    borderAccent: "hover:border-blue-500/40",
  },
  amber: {
    iconBg: "bg-amber-50 dark:bg-amber-950/60",
    iconColor: "text-amber-700 dark:text-amber-400",
    borderAccent: "hover:border-amber-500/40",
  },
  rose: {
    iconBg: "bg-rose-50 dark:bg-rose-950/60",
    iconColor: "text-rose-700 dark:text-rose-400",
    borderAccent: "hover:border-rose-500/40",
  },
  indigo: {
    iconBg: "bg-indigo-50 dark:bg-indigo-950/60",
    iconColor: "text-indigo-700 dark:text-indigo-400",
    borderAccent: "hover:border-indigo-500/40",
  },
  slate: {
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    borderAccent: "hover:border-border",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  tone = "slate",
  badge,
  isLoading,
  className,
}: StatCardProps) {
  const currentTone = toneStyles[tone];

  if (isLoading) {
    return (
      <Card className={cn("border bg-card shadow-xs", className)}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "border bg-card shadow-xs transition-colors",
        currentTone.borderAccent,
        className
      )}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", currentTone.iconBg, currentTone.iconColor)}>
            {icon}
          </div>
        </div>

        <div className="flex items-baseline justify-between pt-0.5">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {value !== undefined ? value.toLocaleString() : "--"}
          </span>
          {badge && (
            <span
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                badge.variant === "destructive"
                  ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                  : badge.variant === "secondary"
                  ? "bg-muted text-muted-foreground border-border"
                  : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              )}
            >
              {badge.text}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-xs text-muted-foreground pt-0.5">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
