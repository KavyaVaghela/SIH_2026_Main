import * as React from "react";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { WorkerPerformanceTier } from "../types";

interface WorkerPerformanceBadgeProps {
  rating: number;
  tier: WorkerPerformanceTier;
}

export function WorkerPerformanceBadge({ rating, tier }: WorkerPerformanceBadgeProps) {
  const getTierBadge = () => {
    switch (tier) {
      case "High":
        return (
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 h-4 border-emerald-600/30 text-emerald-800 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/40 font-medium"
          >
            High Tier
          </Badge>
        );
      case "Medium":
        return (
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 h-4 border-amber-600/30 text-amber-800 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/40 font-medium"
          >
            Medium Tier
          </Badge>
        );
      case "Low":
        return (
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 h-4 border-rose-600/30 text-rose-800 dark:text-rose-300 bg-rose-50/60 dark:bg-rose-950/40 font-medium"
          >
            Refresher Needed
          </Badge>
        );
    }
  };

  return (
    <div className="flex items-center space-x-1.5">
      <div className="flex items-center space-x-1 font-semibold text-xs text-foreground">
        <Star className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" />
        <span>{rating.toFixed(1)}</span>
      </div>
      {getTierBadge()}
    </div>
  );
}
