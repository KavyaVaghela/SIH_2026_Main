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
  Grid,
  Check,
} from "lucide-react";
import { SkillCategory } from "../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ViewAllCategoriesModalProps {
  categories: SkillCategory[];
  isOpen: boolean;
  onClose: () => void;
  activeCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
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

export function ViewAllCategoriesModal({
  categories,
  isOpen,
  onClose,
  activeCategoryId,
  onSelectCategory,
}: ViewAllCategoriesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-card border-border sm:rounded-2xl p-6">
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <Grid className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <DialogTitle className="text-lg font-bold text-foreground">
              All Skill Categories
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Explore all skill training tracks available in KaushalGrow for cooperative workers.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4 max-h-[60vh] overflow-y-auto pr-1">
          {categories.map((cat) => {
            const IconComp = CATEGORY_ICON_MAP[cat.iconName] || Grid;
            const isSelected = activeCategoryId === cat.id;

            return (
              <div
                key={cat.id}
                onClick={() => {
                  onSelectCategory(isSelected ? null : cat.id);
                  onClose();
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 ring-2 ring-emerald-600"
                    : "border-border bg-card hover:border-emerald-500/40 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${cat.softBg}`}>
                    <IconComp className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{cat.name}</h4>
                    <span className="text-xs text-muted-foreground">
                      {cat.courseCount} Courses
                    </span>
                  </div>
                </div>

                {isSelected ? (
                  <span className="p-1 rounded-full bg-emerald-600 text-white">
                    <Check className="h-4 w-4" />
                  </span>
                ) : (
                  <Button variant="ghost" size="sm" className="text-xs text-emerald-600 h-8">
                    Filter →
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          {activeCategoryId ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onSelectCategory(null);
                onClose();
              }}
              className="text-xs"
            >
              Clear Filter
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Click any category to filter dashboard</span>
          )}

          <Button size="sm" onClick={onClose} className="text-xs font-semibold px-5">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
