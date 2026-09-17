"use client";

import * as React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeCategoryId: string | null;
  onFilterClick: () => void;
}

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  activeCategoryId,
  onFilterClick,
}: SearchFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
      {/* Search Input Container */}
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search skills, videos or topics (e.g. Electrical Safety, Plumbing, Painting...)"
          className="pl-10 pr-10 h-11 text-sm bg-card border-border shadow-xs focus:ring-2 focus:ring-emerald-500/30 rounded-xl"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter Button */}
      <Button
        variant={activeCategoryId ? "default" : "outline"}
        onClick={onFilterClick}
        className={`h-11 px-4 gap-2 rounded-xl text-xs font-semibold shrink-0 w-full sm:w-auto ${
          activeCategoryId ? "bg-emerald-700 hover:bg-emerald-800 text-white" : ""
        }`}
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span>Filter Categories</span>
        {activeCategoryId && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-800 text-[10px] font-bold">
            1 Active
          </span>
        )}
      </Button>
    </div>
  );
}
