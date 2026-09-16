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
  Building2,
  Home,
  Flame,
  HardHat,
  Layers,
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
    id: "ceb1ccc9-e769-47cb-9540-167158c684f2",
    name: "Plumbing",
    icon: Wrench,
    description: "Tap repair, pipe leaks & drainage",
  },
  {
    id: "2985a030-5e9a-4c21-9ecb-43edae490f00",
    name: "Electrical",
    icon: Zap,
    description: "Wiring, switchboards & MCB repair",
  },
  {
    id: "9394b752-b921-45cf-b77d-4f9cdfd3b61f",
    name: "Carpentry",
    icon: Hammer,
    description: "Furniture assembly & door fixes",
  },
  {
    id: "d710bed5-7724-469f-8930-e9400398fc92",
    name: "Painting",
    icon: Paintbrush,
    description: "House painting & wall touchups",
  },
  {
    id: "eedc33a1-3d03-4bcb-bb44-3375365adea4",
    name: "Cleaning",
    icon: Sparkles,
    description: "Deep house & kitchen sanitization",
  },
  {
    id: "cd97b6b4-91eb-4c50-b15f-efba528b31d1",
    name: "Appliance Repair",
    icon: Tv,
    description: "AC, Fridge & Washing Machine",
  },
  {
    id: "18c5af04-2db5-41d6-983a-ddd5f02d86d1",
    name: "Gardening",
    icon: TreePine,
    description: "Lawn care & plant maintenance",
  },
  {
    id: "c4432db8-8be9-4975-941a-901f392fae68",
    name: "Driver Services",
    icon: Car,
    description: "Personal & outstation drivers",
  },
  {
    id: "ebda254d-3500-492e-b35c-83f5a00c5239",
    name: "Masonry",
    icon: Building2,
    description: "Brickwork, plastering & wall construction",
  },
  {
    id: "f106c3b4-bdd2-4c05-9b01-d63ecae29dea",
    name: "House Help / Domestic Help",
    icon: Home,
    description: "Daily cleaning, dishwashing & dusting",
  },
  {
    id: "3bd5ddac-31be-4163-807a-0a0871ed4161",
    name: "Welding",
    icon: Flame,
    description: "Grills, gates, railings & metal fabrication",
  },
  {
    id: "3fa324d5-3904-4d9a-b24a-3603d355834d",
    name: "Construction Labour",
    icon: HardHat,
    description: "Site shifting, material handling & digging",
  },
  {
    id: "1e73e7ac-f6da-45b9-9d6c-49d44ffa22ef",
    name: "Tile & Floor Work",
    icon: Layers,
    description: "Floor tiles, marble fixing & grout restoration",
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
          {CUSTOMER_SERVICE_CATEGORIES.length} Categories
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
