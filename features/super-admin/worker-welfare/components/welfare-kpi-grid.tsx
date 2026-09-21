"use client";

import * as React from "react";
import { Users, ShieldCheck, AlertTriangle, BookOpen, GraduationCap, Award } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface WelfareKpiGridProps {
  dateFilter?: string;
}

export function WelfareKpiGrid({ dateFilter = "30_DAYS" }: WelfareKpiGridProps) {
  const getPeriodLabel = () => {
    switch (dateFilter) {
      case "7_DAYS":
        return "vs. last 7 days";
      case "90_DAYS":
        return "vs. last 90 days";
      case "ALL":
        return "all time overall";
      default:
        return "vs. last 30 days";
    }
  };

  const periodLabel = getPeriodLabel();

  const cards = React.useMemo(() => {
    if (dateFilter === "7_DAYS") {
      return [
        {
          title: "Total Workers",
          value: "12,480",
          subtitle: "Workers registered across all federations",
          trend: "↑ 3%",
          trendLabel: periodLabel,
          icon: <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
          iconBg: "bg-emerald-100 dark:bg-emerald-950/60",
        },
        {
          title: "Workers Covered",
          value: "8,742",
          subtitle: "70% welfare coverage",
          trend: "↑ 4%",
          trendLabel: periodLabel,
          icon: <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
          iconBg: "bg-emerald-100 dark:bg-emerald-950/60",
        },
        {
          title: "Assistance Required",
          value: "112",
          subtitle: "Workers needing welfare support in 7 days",
          trend: "↓ 12%",
          trendLabel: periodLabel,
          icon: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
          iconBg: "bg-amber-100 dark:bg-amber-950/60",
        },
        {
          title: "Active Welfare Programs",
          value: "24",
          subtitle: "Programs currently available",
          trend: "↑ 1%",
          trendLabel: periodLabel,
          icon: <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
          iconBg: "bg-blue-100 dark:bg-blue-950/60",
        },
        {
          title: "Training Programs",
          value: "14",
          subtitle: "Active skill & safety programs in 7 days",
          trend: "↑ 5%",
          trendLabel: periodLabel,
          icon: <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
          iconBg: "bg-purple-100 dark:bg-purple-950/60",
        },
        {
          title: "Certifications Issued",
          value: "1,420",
          subtitle: "Certifications completed in last 7 days",
          trend: "↑ 8%",
          trendLabel: periodLabel,
          icon: <Award className="h-5 w-5 text-rose-600 dark:text-rose-400" />,
          iconBg: "bg-rose-100 dark:bg-rose-950/60",
        },
      ];
    }

    if (dateFilter === "90_DAYS") {
      return [
        {
          title: "Total Workers",
          value: "14,120",
          subtitle: "Workers registered across all federations",
          trend: "↑ 14%",
          trendLabel: periodLabel,
          icon: <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
          iconBg: "bg-emerald-100 dark:bg-emerald-950/60",
        },
        {
          title: "Workers Covered",
          value: "9,884",
          subtitle: "70% welfare coverage",
          trend: "↑ 18%",
          trendLabel: periodLabel,
          icon: <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
          iconBg: "bg-emerald-100 dark:bg-emerald-950/60",
        },
        {
          title: "Assistance Required",
          value: "1,240",
          subtitle: "Workers needing welfare support in 90 days",
          trend: "↓ 4%",
          trendLabel: periodLabel,
          icon: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
          iconBg: "bg-amber-100 dark:bg-amber-950/60",
        },
        {
          title: "Active Welfare Programs",
          value: "28",
          subtitle: "Programs currently available",
          trend: "↑ 6%",
          trendLabel: periodLabel,
          icon: <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
          iconBg: "bg-blue-100 dark:bg-blue-950/60",
        },
        {
          title: "Training Programs",
          value: "54",
          subtitle: "Active skill & safety programs in 90 days",
          trend: "↑ 22%",
          trendLabel: periodLabel,
          icon: <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
          iconBg: "bg-purple-100 dark:bg-purple-950/60",
        },
        {
          title: "Certifications Issued",
          value: "16,840",
          subtitle: "Certifications completed in last 90 days",
          trend: "↑ 19%",
          trendLabel: periodLabel,
          icon: <Award className="h-5 w-5 text-rose-600 dark:text-rose-400" />,
          iconBg: "bg-rose-100 dark:bg-rose-950/60",
        },
      ];
    }

    if (dateFilter === "ALL") {
      return [
        {
          title: "Total Workers",
          value: "15,840",
          subtitle: "Total registered workers historically",
          trend: "↑ 25%",
          trendLabel: periodLabel,
          icon: <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
          iconBg: "bg-emerald-100 dark:bg-emerald-950/60",
        },
        {
          title: "Workers Covered",
          value: "11,088",
          subtitle: "70% overall historical coverage",
          trend: "↑ 30%",
          trendLabel: periodLabel,
          icon: <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
          iconBg: "bg-emerald-100 dark:bg-emerald-950/60",
        },
        {
          title: "Assistance Required",
          value: "2,860",
          subtitle: "Total historical welfare requests",
          trend: "↓ 2%",
          trendLabel: periodLabel,
          icon: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
          iconBg: "bg-amber-100 dark:bg-amber-950/60",
        },
        {
          title: "Active Welfare Programs",
          value: "32",
          subtitle: "Total programs launched all-time",
          trend: "↑ 10%",
          trendLabel: periodLabel,
          icon: <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
          iconBg: "bg-blue-100 dark:bg-blue-950/60",
        },
        {
          title: "Training Programs",
          value: "78",
          subtitle: "Total skill & safety programs launched",
          trend: "↑ 35%",
          trendLabel: periodLabel,
          icon: <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
          iconBg: "bg-purple-100 dark:bg-purple-950/60",
        },
        {
          title: "Certifications Issued",
          value: "28,450",
          subtitle: "Total historical certifications issued",
          trend: "↑ 28%",
          trendLabel: periodLabel,
          icon: <Award className="h-5 w-5 text-rose-600 dark:text-rose-400" />,
          iconBg: "bg-rose-100 dark:bg-rose-950/60",
        },
      ];
    }

    // Default 30_DAYS
    return [
      {
        title: "Total Workers",
        value: "12,480",
        subtitle: "Workers registered across all federations",
        trend: "↑ 8%",
        trendLabel: periodLabel,
        icon: <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
        iconBg: "bg-emerald-100 dark:bg-emerald-950/60",
      },
      {
        title: "Workers Covered",
        value: "8,742",
        subtitle: "70% welfare coverage",
        trend: "↑ 12%",
        trendLabel: periodLabel,
        icon: <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
        iconBg: "bg-emerald-100 dark:bg-emerald-950/60",
      },
      {
        title: "Assistance Required",
        value: "486",
        subtitle: "Workers needing welfare support",
        trend: "↓ 6%",
        trendLabel: periodLabel,
        icon: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
        iconBg: "bg-amber-100 dark:bg-amber-950/60",
      },
      {
        title: "Active Welfare Programs",
        value: "24",
        subtitle: "Programs currently available",
        trend: "↑ 3%",
        trendLabel: periodLabel,
        icon: <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
        iconBg: "bg-blue-100 dark:bg-blue-950/60",
      },
      {
        title: "Training Programs",
        value: "38",
        subtitle: "Active skill & safety programs",
        trend: "↑ 15%",
        trendLabel: periodLabel,
        icon: <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
        iconBg: "bg-purple-100 dark:bg-purple-950/60",
      },
      {
        title: "Certifications Issued",
        value: "6,284",
        subtitle: "Certifications completed across federations",
        trend: "↑ 11%",
        trendLabel: periodLabel,
        icon: <Award className="h-5 w-5 text-rose-600 dark:text-rose-400" />,
        iconBg: "bg-rose-100 dark:bg-rose-950/60",
      },
    ];
  }, [dateFilter, periodLabel]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 min-w-0 max-w-full">
      {cards.map((card, idx) => (
        <Card
          key={idx}
          className="p-4 border border-border/70 hover:border-emerald-500/30 transition-all duration-150 shadow-sm flex flex-col justify-between min-w-0 overflow-hidden"
        >
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
              <div className={`p-2 rounded-lg ${card.iconBg} shrink-0`}>
                {card.icon}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-x-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 min-w-0 text-right">
                <span className="shrink-0">{card.trend}</span>
                <span className="text-[10px] text-muted-foreground font-normal truncate max-w-[85px] sm:max-w-none">
                  {card.trendLabel}
                </span>
              </div>
            </div>

            <div className="text-2xl font-bold text-foreground tracking-tight truncate">
              {card.value}
            </div>
            <div className="text-xs font-semibold text-muted-foreground mt-0.5 truncate">
              {card.title}
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground/80 mt-2 truncate">
            {card.subtitle}
          </div>
        </Card>
      ))}
    </div>
  );
}
