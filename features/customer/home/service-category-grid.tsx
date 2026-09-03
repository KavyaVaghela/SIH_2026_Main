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
} from "lucide-react";
import { Card } from "@/components/ui/card";

export interface ServiceCategoryItem {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
}

export const CUSTOMER_SERVICE_CATEGORIES: ServiceCategoryItem[] = [
  {
    id: "cat-plumbing",
    name: "Plumbing",
    icon: Wrench,
    description: "Tap repair, pipe leaks & drainage",
  },
  {
    id: "cat-electrical",
    name: "Electrical",
    icon: Zap,
    description: "Wiring, switchboards & MCB repair",
  },
  {
    id: "cat-carpentry",
    name: "Carpentry",
    icon: Hammer,
    description: "Furniture assembly & door fixes",
  },
  {
    id: "cat-painting",
    name: "Painting",
    icon: Paintbrush,
    description: "House painting & wall touchups",
  },
  {
    id: "cat-cleaning",
    name: "Cleaning",
    icon: Sparkles,
    description: "Deep house & kitchen sanitization",
  },
  {
    id: "cat-appliance",
    name: "Appliance Repair",
    icon: Tv,
    description: "AC, Fridge & Washing Machine",
  },
  {
    id: "cat-gardening",
    name: "Gardening",
    icon: TreePine,
    description: "Lawn care & plant maintenance",
  },
  {
    id: "cat-driver",
    name: "Driver Services",
    icon: Car,
    description: "Personal & outstation drivers",
  },
];

export interface ServiceCategoryGridProps {
  onCategorySelect?: (categoryId: string) => void;
  filterQuery?: string;
}

export function ServiceCategoryGrid({
  onCategorySelect,
  filterQuery = "",
}: ServiceCategoryGridProps) {
  const filteredCategories = CUSTOMER_SERVICE_CATEGORIES.filter((cat) =>
    cat.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Explore Service Categories
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select a verified cooperative trade service
          </p>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
          8 Categories
        </span>
      </div>

      {filteredCategories.length === 0 ? (
        <Card className="p-6 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 text-sm rounded-xl">
          No matching service category found for &quot;{filterQuery}&quot;.
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {filteredCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card
                key={category.id}
                onClick={() => onCategorySelect?.(category.id)}
                className="p-4 cursor-pointer transition-all duration-200 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-600/60 dark:hover:border-emerald-500/60 hover:shadow-md flex flex-col items-start text-left group rounded-xl"
              >
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 mb-3 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-colors">
                  <IconComponent className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {category.name}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1 font-normal">
                  {category.description}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
