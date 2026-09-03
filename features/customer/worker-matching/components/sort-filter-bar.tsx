"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";

export type WorkerSortOption = "best_match" | "nearest" | "highest_rated" | "most_experienced";

export interface SortFilterBarProps {
  currentSort: WorkerSortOption;
  onSortChange: (sort: WorkerSortOption) => void;
  resultCount: number;
}

export function SortFilterBar({
  currentSort,
  onSortChange,
  resultCount,
}: SortFilterBarProps) {
  const options: Array<{ id: WorkerSortOption; label: string }> = [
    { id: "best_match", label: "Best Match" },
    { id: "nearest", label: "Nearest" },
    { id: "highest_rated", label: "Highest Rated" },
    { id: "most_experienced", label: "Most Experienced" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
      <div className="flex items-center gap-2">
        <span className="font-bold text-slate-900 dark:text-slate-100">
          Matched Workers
        </span>
        <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full text-[11px]">
          {resultCount} Available
        </span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto">
        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSortChange(opt.id)}
            className={`py-1 px-3 rounded-lg font-medium transition-colors shrink-0 text-xs ${
              currentSort === opt.id
                ? "bg-emerald-700 text-white font-semibold shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
