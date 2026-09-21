"use client";

import * as React from "react";
import { Plus, Building2, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WelfareProgramItem, ProgramCategory } from "../types";

export interface WelfareProgramsTableProps {
  programs: WelfareProgramItem[];
  onAddProgram: () => void;
  onViewProgram: (program: WelfareProgramItem) => void;
  onManageCategories?: () => void;
  onViewAll?: () => void;
}

function getCategoryBadgeStyle(category: ProgramCategory) {
  switch (category) {
    case "Pension":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200/60";
    case "Insurance":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200/60";
    case "Skill Development":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200/60";
    case "Health":
      return "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200/60";
    case "Safety":
      return "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200/60";
    default:
      return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200/60";
  }
}

export function WelfareProgramsTable({
  programs,
  onAddProgram,
  onViewProgram,
  onManageCategories,
  onViewAll,
}: WelfareProgramsTableProps) {
  return (
    <Card className="border border-border/80 shadow-sm flex flex-col h-full min-w-0 max-w-full overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <CardTitle className="text-base font-bold text-foreground truncate">
                Welfare Programs & Schemes
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage welfare schemes and monitor their availability and coverage across federations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              onClick={onAddProgram}
              size="sm"
              className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Welfare Program
            </Button>
            {onManageCategories && (
              <Button
                onClick={onManageCategories}
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium border-border/80"
              >
                Manage Categories
              </Button>
            )}
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

      <CardContent className="p-0 overflow-x-auto max-w-full">
        <table className="w-full min-w-[700px] text-left text-xs">
          <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border/60">
            <tr>
              <th className="py-2.5 px-4 font-semibold">Program / Scheme</th>
              <th className="py-2.5 px-3 font-semibold">Category</th>
              <th className="py-2.5 px-3 font-semibold">Federations</th>
              <th className="py-2.5 px-3 font-semibold">Eligible Workers</th>
              <th className="py-2.5 px-3 font-semibold">Covered</th>
              <th className="py-2.5 px-3 font-semibold">Status</th>
              <th className="py-2.5 px-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-foreground">
            {programs.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-muted/30 transition-colors group cursor-pointer"
                onClick={() => onViewProgram(item)}
              >
                <td className="py-3 px-4 font-medium text-foreground">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                      {item.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-foreground group-hover:text-emerald-600 transition-colors truncate max-w-[220px] sm:max-w-xs md:max-w-sm block">
                      {item.name}
                    </span>
                  </div>
                </td>

                <td className="py-3 px-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getCategoryBadgeStyle(
                      item.category
                    )}`}
                  >
                    {item.category}
                  </span>
                </td>

                <td className="py-3 px-3 font-semibold text-muted-foreground">
                  {item.federationsCount}
                </td>

                <td className="py-3 px-3 font-semibold text-muted-foreground">
                  {item.eligibleWorkers.toLocaleString()}
                </td>

                <td className="py-3 px-3 font-semibold text-foreground">
                  {item.coveredWorkers.toLocaleString()}
                </td>

                <td className="py-3 px-3">
                  <Badge
                    variant="outline"
                    className={
                      item.status === "Active"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300/60"
                        : "bg-slate-100 text-slate-700 border-slate-300"
                    }
                  >
                    {item.status}
                  </Badge>
                </td>

                <td className="py-3 px-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewProgram(item);
                    }}
                    className="h-7 px-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 gap-0.5"
                  >
                    View <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
