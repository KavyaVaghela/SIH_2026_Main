"use client";

import * as React from "react";
import { Users, Grid, BookOpen, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LMSDashboardStats } from "@/features/shared/learning/types";

export interface LMSSummaryCardsProps {
  stats: LMSDashboardStats;
}

export function LMSSummaryCards({ stats }: LMSSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full">
      {/* 1. Registered Workers */}
      <Card className="border border-border bg-card shadow-xs rounded-xl overflow-hidden hover:border-emerald-500/40 transition-all">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Registered Workers
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-baseline gap-2">
              <span>{stats.registeredWorkersCount}</span>
              <span className="text-xs text-emerald-600 font-medium">Active</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Enrolled cooperative workforce</p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 shrink-0">
            <Users className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Skill Categories */}
      <Card className="border border-border bg-card shadow-xs rounded-xl overflow-hidden hover:border-emerald-500/40 transition-all">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Skill Categories
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-baseline gap-2">
              <span>{stats.totalCategoriesCount}</span>
              <span className="text-xs text-blue-600 font-medium">Domains</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Active vocational trades</p>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 shrink-0">
            <Grid className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      {/* 3. Learning Resources */}
      <Card className="border border-border bg-card shadow-xs rounded-xl overflow-hidden hover:border-emerald-500/40 transition-all">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Learning Resources
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-baseline gap-2">
              <span>{stats.totalResourcesCount}</span>
              <span className="text-xs text-amber-600 font-medium">
                ({stats.publishedResourcesCount} Published)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">{stats.draftResourcesCount} Draft modules</p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 shrink-0">
            <BookOpen className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
