"use client";

import * as React from "react";
import {
  Sun,
  Zap,
  Hammer,
  Paintbrush,
  Sparkles,
  Wrench,
  Scissors,
  Car,
  ChevronRight,
  Grid,
} from "lucide-react";
import { SkillCategory } from "../types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface SkillCategoriesGridProps {
  categories: SkillCategory[];
  activeCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onViewAllClick: () => void;
}

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  Sun,
  Zap,
  Hammer,
  Paintbrush,
  Sparkles,
  Wrench,
  Scissors,
  Car,
};

export function SkillCategoriesGrid({
  categories,
  activeCategoryId,
  onSelectCategory,
  onViewAllClick,
}: SkillCategoriesGridProps) {
  return (
    <div className="space-y-4 w-full">
      {/* Category Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Skill Categories</h2>
          <p className="text-xs text-muted-foreground">Select a domain to filter learning courses</p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onViewAllClick}
          className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 h-8"
        >
          <span>View All ({categories.length})</span>
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>

      {/* Grid of Categories (8 Categories) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 w-full">
        {categories.map((cat) => {
          const IconComp = CATEGORY_ICON_MAP[cat.iconName] || Grid;
          const isSelected = activeCategoryId === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(isSelected ? null : cat.id)}
              className={`group flex flex-col items-center justify-between p-3.5 rounded-xl border transition-all text-center space-y-2 cursor-pointer ${
                isSelected
                  ? "border-emerald-600 bg-emerald-500/15 ring-2 ring-emerald-600 dark:bg-emerald-950/40 shadow-sm scale-102"
                  : "border-border bg-card hover:border-emerald-500/40 hover:bg-accent/40"
              }`}
            >
              {/* Soft Background Icon Container */}
              <div
                className={`p-2.5 rounded-lg transition-transform group-hover:scale-110 ${cat.softBg}`}
              >
                <IconComp className="h-5 w-5" />
              </div>

              {/* Title & Count */}
              <div>
                <span className="text-xs font-bold text-foreground leading-tight block truncate max-w-[100px]">
                  {cat.name}
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  {cat.courseCount} Courses
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
