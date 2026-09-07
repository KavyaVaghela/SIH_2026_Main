"use client";

import * as React from "react";
import { Search, RotateCcw, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { SocietyFilterOptions } from "../types";

interface SocietyFiltersProps {
  filters: SocietyFilterOptions;
  locations: string[];
  onFilterChange: (newFilters: Partial<SocietyFilterOptions>) => void;
  onReset: () => void;
  onAddClick: () => void;
}

export function SocietyFilters({
  filters,
  locations,
  onFilterChange,
  onReset,
  onAddClick,
}: SocietyFiltersProps) {
  const hasActiveFilters =
    filters.searchQuery !== "" ||
    filters.location !== "ALL" ||
    filters.status !== "ALL" ||
    filters.sortBy !== "name";

  return (
    <div className="flex flex-col space-y-3 p-4 rounded-xl border bg-card shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search society name, code, admin..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="pl-9 h-10 bg-background text-sm"
          />
        </div>

        {/* Action Button */}
        <Button
          onClick={onAddClick}
          className="h-10 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold shadow-xs shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Cooperative Society
        </Button>
      </div>

      {/* Dropdown Filters & Sorting */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
            Location
          </label>
          <Select
            value={filters.location}
            onChange={(e) => onFilterChange({ location: e.target.value })}
            className="h-9 text-xs"
          >
            <option value="ALL">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
            Status Filter
          </label>
          <Select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="h-9 text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active & Verified</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
            <option value="SUSPENDED">Suspended</option>
          </Select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
            Sort By
          </label>
          <Select
            value={filters.sortBy}
            onChange={(e) =>
              onFilterChange({
                sortBy: e.target.value as SocietyFilterOptions["sortBy"],
              })
            }
            className="h-9 text-xs"
          >
            <option value="name">Society Name</option>
            <option value="registrationDate">Registration Date</option>
            <option value="totalWorkers">Total Workers</option>
            <option value="totalBookings">Total Bookings</option>
            <option value="averageRating">Average Rating</option>
          </Select>
        </div>

        <div className="flex items-end space-x-2">
          <Select
            value={filters.sortOrder}
            onChange={(e) =>
              onFilterChange({
                sortOrder: e.target.value as "asc" | "desc",
              })
            }
            className="h-9 text-xs flex-1"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground shrink-0"
              title="Reset Filters"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
