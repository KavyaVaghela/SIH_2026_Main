"use client";

import * as React from "react";
import { Search, X, Filter, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { WorkerFilterState } from "../types";

interface WorkerFiltersProps {
  filters: WorkerFilterState;
  professions: string[];
  areas: string[];
  onFilterChange: (key: keyof WorkerFilterState, value: string) => void;
  onReset: () => void;
}

export function WorkerFilters({
  filters,
  professions,
  areas,
  onFilterChange,
  onReset,
}: WorkerFiltersProps) {
  const hasActiveFilters =
    filters.searchQuery.trim() !== "" ||
    filters.profession !== "ALL" ||
    filters.area !== "ALL" ||
    filters.performanceTier !== "ALL";

  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 shadow-xs space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Search Query Input */}
        <div className="lg:col-span-2 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <Search className="h-4 w-4" />
          </div>
          <Input
            type="text"
            placeholder="Search by worker name or ID..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange("searchQuery", e.target.value)}
            className="pl-9 h-9 text-xs"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange("searchQuery", "")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* 2. Profession Filter */}
        <div>
          <Select
            value={filters.profession}
            onChange={(e) => onFilterChange("profession", e.target.value)}
            className="h-9 text-xs"
          >
            <option value="ALL">All Professions</option>
            {professions.map((prof) => (
              <option key={prof} value={prof}>
                {prof}
              </option>
            ))}
          </Select>
        </div>

        {/* 3. Area / Location Filter */}
        <div>
          <Select
            value={filters.area}
            onChange={(e) => onFilterChange("area", e.target.value)}
            className="h-9 text-xs"
          >
            <option value="ALL">All Areas</option>
            {areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </Select>
        </div>

        {/* 4. Performance Filter (Section 12: High, Medium, Low) */}
        <div>
          <Select
            value={filters.performanceTier}
            onChange={(e) => onFilterChange("performanceTier", e.target.value)}
            className="h-9 text-xs"
          >
            <option value="ALL">All Performance</option>
            <option value="High">High (≥ 4.5 ★)</option>
            <option value="Medium">Medium (3.5 - 4.4 ★)</option>
            <option value="Low">Low (&lt; 3.5 ★)</option>
          </Select>
        </div>
      </div>

      {/* Filter status & Reset button */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
          <div className="flex items-center space-x-1.5 text-muted-foreground">
            <Filter className="h-3 w-3 text-emerald-600" />
            <span>Active filtering criteria applied</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground flex items-center space-x-1"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
}
