"use client";

import * as React from "react";
import { Search, RotateCcw, Filter, Building2, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ComplaintFilterOptions, ComplaintStatus, ComplaintCategory } from "../types";

interface ComplaintsFiltersProps {
  filters: ComplaintFilterOptions;
  societies: Array<{ id: string; name: string }>;
  categories: Array<{ id: ComplaintCategory; label: string }>;
  onFilterChange: (newFilters: Partial<ComplaintFilterOptions>) => void;
  onReset: () => void;
}

export function ComplaintsFilters({
  filters,
  societies,
  categories,
  onFilterChange,
  onReset,
}: ComplaintsFiltersProps) {
  const hasActiveFilters =
    filters.status !== "ALL" ||
    filters.category !== "ALL" ||
    filters.society !== "ALL" ||
    filters.searchQuery !== "";

  const statusPills: Array<{ key: "ALL" | ComplaintStatus; label: string }> = [
    { key: "ALL", label: "All Complaints" },
    { key: "OPEN", label: "Open" },
    { key: "IN_REVIEW", label: "In Review" },
    { key: "RESOLVED", label: "Resolved" },
  ];

  return (
    <div className="flex flex-col space-y-3 p-4 rounded-xl border bg-card shadow-xs">
      {/* Top Status Tabs & Search Input */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Quick Pills */}
        <div className="flex items-center space-x-1 bg-muted/60 p-1 rounded-lg border self-start sm:self-auto flex-wrap">
          {statusPills.map((pill) => (
            <Button
              key={pill.key}
              variant={filters.status === pill.key ? "default" : "ghost"}
              size="sm"
              onClick={() => onFilterChange({ status: pill.key })}
              className={
                filters.status === pill.key
                  ? "bg-emerald-800 text-white hover:bg-emerald-900 h-8 px-3 text-xs font-semibold shadow-xs"
                  : "h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
              }
            >
              {pill.label}
            </Button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search complaint ID, customer, worker, keywords..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="pl-9 h-9 text-xs bg-background"
          />
        </div>
      </div>

      {/* Category and Society Dropdowns Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:w-auto">
          {/* Category Dropdown */}
          <div className="flex items-center space-x-2">
            <Tag className="h-4 w-4 text-emerald-700 shrink-0" />
            <Select
              value={filters.category}
              onChange={(e) =>
                onFilterChange({ category: e.target.value as "ALL" | ComplaintCategory })
              }
              className="h-8 text-xs w-52"
            >
              <option value="ALL">All Dispute Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Society Dropdown */}
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-emerald-700 shrink-0" />
            <Select
              value={filters.society}
              onChange={(e) => onFilterChange({ society: e.target.value })}
              className="h-8 text-xs w-60"
            >
              <option value="ALL">All Cooperative Societies</option>
              {societies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Reset Action */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="h-8 text-xs text-muted-foreground hover:text-foreground border-dashed self-start sm:self-auto"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Clear Active Filters
          </Button>
        )}
      </div>
    </div>
  );
}
