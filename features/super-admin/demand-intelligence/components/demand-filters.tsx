"use client";

import * as React from "react";
import { Search, RotateCcw, Calendar, Filter, MapPin, Building2, Briefcase } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { DemandFilterOptions, DemandDateRange } from "../types";

interface DemandFiltersProps {
  filters: DemandFilterOptions;
  locations: string[];
  societies: Array<{ id: string; name: string }>;
  services: string[];
  onFilterChange: (newFilters: Partial<DemandFilterOptions>) => void;
  onReset: () => void;
}

export function DemandFilters({
  filters,
  locations,
  societies,
  services,
  onFilterChange,
  onReset,
}: DemandFiltersProps) {
  const hasActiveFilters =
    filters.location !== "ALL" ||
    filters.society !== "ALL" ||
    filters.service !== "ALL" ||
    filters.dateRange !== "30d";

  return (
    <div className="flex flex-col space-y-3 p-4 rounded-xl border bg-card shadow-xs">
      {/* Date Range Quick Toggles & Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-1 bg-muted/60 p-1 rounded-lg border self-start sm:self-auto shrink-0">
          {(
            [
              { key: "today", label: "Today" },
              { key: "7d", label: "Last 7 Days" },
              { key: "30d", label: "Last 30 Days" },
              { key: "90d", label: "Last 90 Days" },
            ] as Array<{ key: DemandDateRange; label: string }>
          ).map((range) => (
            <Button
              key={range.key}
              variant={filters.dateRange === range.key ? "default" : "ghost"}
              size="sm"
              onClick={() => onFilterChange({ dateRange: range.key })}
              className={
                filters.dateRange === range.key
                  ? "bg-emerald-800 text-white hover:bg-emerald-900 h-8 px-3 text-xs font-semibold shadow-xs"
                  : "h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
              }
            >
              <Calendar className="h-3 w-3 mr-1 inline" />
              {range.label}
            </Button>
          ))}
        </div>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="h-8 text-xs text-muted-foreground hover:text-foreground border-dashed self-start sm:self-auto"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset All Filters
          </Button>
        )}
      </div>

      {/* Filter Dropdowns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* Location Filter */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 flex items-center">
            <MapPin className="h-3 w-3 mr-1 text-emerald-700" />
            Regional Cluster / Location
          </label>
          <Select
            value={filters.location}
            onChange={(e) => onFilterChange({ location: e.target.value })}
            className="h-8 text-xs"
          >
            <option value="ALL">All Regional Hotspots</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </Select>
        </div>

        {/* Society / Federation Filter */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 flex items-center">
            <Building2 className="h-3 w-3 mr-1 text-emerald-700" />
            Cooperative Society
          </label>
          <Select
            value={filters.society}
            onChange={(e) => onFilterChange({ society: e.target.value })}
            className="h-8 text-xs"
          >
            <option value="ALL">All Cooperative Societies</option>
            {societies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Service Filter */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 flex items-center">
            <Briefcase className="h-3 w-3 mr-1 text-emerald-700" />
            Trade Service / Craft
          </label>
          <Select
            value={filters.service}
            onChange={(e) => onFilterChange({ service: e.target.value })}
            className="h-8 text-xs"
          >
            <option value="ALL">All Services</option>
            {services.map((srv) => (
              <option key={srv} value={srv}>
                {srv}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
