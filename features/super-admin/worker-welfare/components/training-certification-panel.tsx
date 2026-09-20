"use client";

import * as React from "react";
import { GraduationCap, Plus, BookOpen, Users, CheckCircle, Award, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TrainingStats, TrainingProgramItem } from "../types";

export interface TrainingCertificationPanelProps {
  stats: TrainingStats;
  programs: TrainingProgramItem[];
  onCreateTraining: () => void;
  onViewAll?: () => void;
}

export function TrainingCertificationPanel({
  stats,
  programs,
  onCreateTraining,
  onViewAll,
}: TrainingCertificationPanelProps) {
  const maxEnrolled = Math.max(...programs.map((p) => p.enrolledWorkers), 500);

  return (
    <Card className="border border-border/80 shadow-sm flex flex-col justify-between h-full">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base font-bold text-foreground">
                Training & Certification Management
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage training programs and monitor skill-building outcomes across federations.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={onCreateTraining}
              size="sm"
              className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Training Program
            </Button>
            <Button
              onClick={onViewAll}
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 px-2 font-medium"
            >
              View All &rarr;
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-5">
        {/* Metric tiles row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-900/50 text-center">
            <div className="text-lg font-bold text-foreground">{stats.activePrograms}</div>
            <div className="text-[11px] font-semibold text-muted-foreground">Active Programs</div>
          </div>

          <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/50 text-center">
            <div className="text-lg font-bold text-foreground">{stats.workersEnrolled.toLocaleString()}</div>
            <div className="text-[11px] font-semibold text-muted-foreground">Workers Enrolled</div>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-900/50 text-center">
            <div className="text-lg font-bold text-foreground">{stats.completedTraining.toLocaleString()}</div>
            <div className="text-[11px] font-semibold text-muted-foreground">Completed Training</div>
          </div>

          <div className="p-2.5 rounded-lg bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-900/50 text-center">
            <div className="text-lg font-bold text-foreground">{stats.certificationsIssued.toLocaleString()}</div>
            <div className="text-[11px] font-semibold text-muted-foreground">Certifications Issued</div>
          </div>

          <div className="p-2.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/50 text-center col-span-2 sm:col-span-1">
            <div className="text-lg font-bold text-rose-600 dark:text-rose-400">{stats.expiringNext3Months}</div>
            <div className="text-[11px] font-semibold text-muted-foreground">Expiring (Next 3M)</div>
          </div>
        </div>

        {/* Top Training Programs list */}
        <div>
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
            Top Training Programs
          </h4>

          <div className="space-y-3">
            {programs.map((item) => {
              const pct = Math.round((item.enrolledWorkers / maxEnrolled) * 100);
              return (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-[200px]">
                    <div className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                      {item.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-foreground truncate">{item.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-xs ml-auto">
                    <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="font-bold text-foreground text-right w-10">
                      {item.enrolledWorkers}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
