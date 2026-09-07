"use client";

import * as React from "react";
import { Search, RotateCcw, Filter, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { WelfareFilterOptions, WelfareCoverageStatus } from "../types";

interface WelfareFiltersProps {
  filters: WelfareFilterOptions;
  societies: Array<{ id: string; name: string }>;
  onFilterChange: (newFilters: Partial<WelfareFilterOptions>) => void;
  onReset: () => void;
}

export function WelfareFilters({
  filters,
  societies,
  onFilterChange,
  onReset,
}: WelfareFiltersProps) {
  const hasActiveFilters =
    filters.status !== "ALL" ||
    filters.society !== "ALL" ||
    filters.searchQuery !== "";

  const statusPills: Array<{ key: "ALL" | WelfareCoverageStatus; label: string }> = [
    { key: "ALL", label: "All Records" },
    { key: "ACTIVE", label: "Active Coverage" },
    { key: "EXPIRING_SOON", label: "Expiring Soon" },
    { key: "EXPIRED", label: "Expired" },
    { key: "NO_COVERAGE", label: "No Coverage" },
  ];

  return (
    <div className="flex flex-col space-y-3 p-4 rounded-xl border bg-card shadow-xs">
      {/* Top Status Tabs & Search */}
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

        {/* Search Worker / Policy */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search worker, trade, policy number..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="pl-9 h-9 text-xs bg-background"
          />
        </div>
      </div>

      {/* Dropdown Filters & Reset Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-emerald-700 shrink-0" />
            <span className="text-xs font-semibold text-muted-foreground">Society:</span>
          </div>
          <Select
            value={filters.society}
            onChange={(e) => onFilterChange({ society: e.target.value })}
            className="h-8 text-xs w-64"
          >
            <option value="ALL">All Cooperative Societies</option>
            {societies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>

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
