"use client";

import * as React from "react";
import { Trophy, CheckCircle2, Clock, CircleAlert, Target } from "lucide-react";
import { LearningProgressStats } from "../types";
import { Card, CardTitle } from "@/components/ui/card";

export interface ProgressDashboardCardProps {
  stats: LearningProgressStats;
}

export function ProgressDashboardCard({ stats }: ProgressDashboardCardProps) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.overallProgressPercent / 100) * circumference;

  return (
    <div className="space-y-6 w-full">
      {/* 1. Horizontal Progress Breakdown Card */}
      <Card className="border border-border bg-card shadow-xs rounded-2xl overflow-hidden p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base font-bold text-foreground">
              My Learning Progress
            </CardTitle>
          </div>
          <span className="text-xs text-muted-foreground font-medium">Cooperative Track</span>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Circular Progress Ring */}
          <div className="flex items-center gap-4 shrink-0 w-full md:w-auto">
            <div className="relative h-24 w-24 flex items-center justify-center shrink-0">
              <svg className="h-full w-full transform -rotate-90" viewBox="0 0 96 96">
                {/* Background Ring */}
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="stroke-muted"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Progress Ring */}
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="stroke-emerald-600 dark:stroke-emerald-400 transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              {/* Center Percentage Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black text-foreground tracking-tight font-mono">
                  {stats.overallProgressPercent}%
                </span>
                <span className="text-[8px] uppercase font-bold text-muted-foreground tracking-wider">
                  Overall
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-foreground">Overall Skill Mastery</h4>
              <p className="text-xs text-muted-foreground">Dynamic progress from completed course modules</p>
            </div>
          </div>

          {/* Horizontal Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto flex-1">
            <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold text-foreground">Completed</span>
              </div>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-sm">{stats.completed}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20 text-xs gap-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-semibold text-foreground">In Progress</span>
              </div>
              <span className="font-bold text-amber-700 dark:text-amber-400 font-mono text-sm">{stats.inProgress}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-500/20 bg-slate-50/40 dark:bg-slate-900/40 text-xs gap-3">
              <div className="flex items-center gap-2">
                <CircleAlert className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="font-semibold text-foreground">Not Started</span>
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-300 font-mono text-sm">{stats.notStarted}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Motivational Card ("Keep Going!") - Clean Horizontal Banner without Cooperative Badge */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 bg-[#f2faf7] dark:bg-emerald-950/30 p-5 sm:p-6 flex items-center gap-5 shadow-xs">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-emerald-100/40 dark:bg-emerald-900/20 rounded-l-full pointer-events-none" />

        <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-[#dcfce7] dark:bg-emerald-900/50 text-[#065f46] dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-300/40 shadow-inner z-10">
          <Trophy className="h-7 w-7 sm:h-8 sm:w-8 stroke-[1.75]" />
        </div>

        <div className="space-y-0.5 z-10">
          <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#065f46] dark:text-emerald-400 block">
            SKILL ACHIEVEMENT
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] dark:text-white tracking-tight leading-tight">
            Keep Going!
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
            Every new skill brings a new opportunity.
          </p>
        </div>
      </div>
    </div>
  );
}
