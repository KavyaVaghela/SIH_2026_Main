"use client";

import * as React from "react";
import {
  Wrench,
  Zap,
  Hammer,
  Paintbrush,
  Sparkles,
  Tv,
  TreePine,
  Car,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { serviceCatalogService, ServiceCategory } from "@/features/services/services/service-catalog-service";

const ICON_MAP: Record<string, React.ElementType> = {
  Wrench,
  Zap,
  Hammer,
  Paintbrush,
  Sparkles,
  Tv,
  TreePine,
  Car,
  Droplet: Wrench,
};

export interface StepCategoryProps {
  selectedCategory: ServiceCategory | null;
  onSelectCategory: (category: ServiceCategory) => void;
  onNext: () => void;
}

export function StepCategory({
  selectedCategory,
  onSelectCategory,
  onNext,
}: StepCategoryProps) {
  const [categories, setCategories] = React.useState<ServiceCategory[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    serviceCatalogService.getCategories().then((data) => {
      setCategories(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="animate-pulse space-y-4 max-w-md mx-auto">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mx-auto" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
        <p className="text-xs text-slate-400 mt-4">Loading verified service catalog categories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Step 1: Select Service Category
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Choose the primary trade or service required for your household
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const isSelected = selectedCategory?.id === cat.id;
          const IconComp = ICON_MAP[cat.iconName || ""] || Wrench;

          return (
            <Card
              key={cat.id}
              onClick={() => onSelectCategory(cat)}
              className={`p-4 cursor-pointer transition-all duration-200 border rounded-xl flex flex-col justify-between ${
                isSelected
                  ? "bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-600 dark:border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-sm"
              }`}
            >
              <div className="space-y-2.5">
                <div
                  className={`p-2.5 rounded-lg w-fit ${
                    isSelected
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                  }`}
                >
                  <IconComp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 font-normal">
                    {cat.description || "Verified trade professional service."}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span
                  className={`font-semibold ${
                    isSelected ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400"
                  }`}
                >
                  {isSelected ? "Selected" : "Select Trade"}
                </span>
                <ChevronRight className={`w-4 h-4 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
        <Button
          disabled={!selectedCategory}
          onClick={onNext}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-6 gap-1.5"
        >
          Continue to Specific Work
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
