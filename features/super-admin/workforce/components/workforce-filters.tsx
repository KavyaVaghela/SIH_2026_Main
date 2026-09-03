"use client";

import * as React from "react";
import { Search, RotateCcw, Users, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { WorkforceFilterOptions } from "../types";

interface WorkforceFiltersProps {
  filters: WorkforceFilterOptions;
  societies: Array<{ id: string; name: string }>;
  skills: string[];
  onFilterChange: (newFilters: Partial<WorkforceFilterOptions>) => void;
  onReset: () => void;
}

export function WorkforceFilters({
  filters,
  societies,
  skills,
  onFilterChange,
  onReset,
}: WorkforceFiltersProps) {
  const hasActiveFilters =
    filters.searchQuery !== "" ||
    filters.societyId !== "ALL" ||
    filters.skill !== "ALL" ||
    filters.availability !== "ALL" ||
    filters.verification !== "ALL" ||
    filters.viewMode !== "ALL";

  return (
    <div className="flex flex-col space-y-3 p-4 rounded-xl border bg-card shadow-xs">
      {/* Top Controls: View Toggle & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* View Mode Mode Switcher */}
        <div className="flex items-center space-x-1 bg-muted/60 p-1 rounded-lg border shrink-0">
          <Button
            variant={filters.viewMode === "ALL" ? "default" : "ghost"}
            size="sm"
            onClick={() => onFilterChange({ viewMode: "ALL" })}
            className={
              filters.viewMode === "ALL"
                ? "bg-emerald-800 text-white hover:bg-emerald-900 h-8 px-3 text-xs font-semibold"
                : "h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
            }
          >
            <Users className="h-3.5 w-3.5 mr-1.5 inline" />
            All Workforce Directory
          </Button>

          <Button
            variant={filters.viewMode === "UNDERUTILIZED" ? "default" : "ghost"}
            size="sm"
            onClick={() => onFilterChange({ viewMode: "UNDERUTILIZED" })}
            className={
              filters.viewMode === "UNDERUTILIZED"
                ? "bg-rose-700 text-white hover:bg-rose-800 h-8 px-3 text-xs font-semibold"
                : "h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
            }
          >
            <TrendingDown className="h-3.5 w-3.5 mr-1.5 inline" />
            Underutilized Workers
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search worker name, skill, phone, society..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="pl-9 h-9 text-xs bg-background"
          />
        </div>
      </div>

      {/* Filter Dropdowns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
        {/* Society Filter */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
            Society / Federation
          </label>
          <Select
            value={filters.societyId}
            onChange={(e) => onFilterChange({ societyId: e.target.value })}
            className="h-8 text-xs"
          >
            <option value="ALL">All Societies</option>
            {societies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Primary Skill Filter */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
            Primary Skill / Profession
          </label>
          <Select
            value={filters.skill}
            onChange={(e) => onFilterChange({ skill: e.target.value })}
            className="h-8 text-xs"
          >
            <option value="ALL">All Skills</option>
            {skills.map((sk) => (
              <option key={sk} value={sk}>
                {sk}
              </option>
            ))}
          </Select>
        </div>

        {/* Availability Status Filter */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
            Availability
          </label>
          <Select
            value={filters.availability}
            onChange={(e) => onFilterChange({ availability: e.target.value })}
            className="h-8 text-xs"
          >
            <option value="ALL">All Availabilities</option>
            <option value="AVAILABLE">Available / Online</option>
            <option value="BUSY">On Job (Busy)</option>
            <option value="UNAVAILABLE">Offline</option>
          </Select>
        </div>

        {/* Verification Status Filter */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
            Verification Status
          </label>
          <Select
            value={filters.verification}
            onChange={(e) => onFilterChange({ verification: e.target.value })}
            className="h-8 text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="suspended">Suspended</option>
          </Select>
        </div>

        {/* Sorting & Clear */}
        <div className="flex items-end space-x-2">
          <Select
            value={filters.sortBy}
            onChange={(e) =>
              onFilterChange({
                sortBy: e.target.value as WorkforceFilterOptions["sortBy"],
              })
            }
            className="h-8 text-xs flex-1"
          >
            <option value="fullName">Sort: Name</option>
            <option value="averageRating">Sort: Rating</option>
            <option value="totalJobs">Sort: Total Jobs</option>
            <option value="experienceYears">Sort: Experience</option>
            <option value="joiningDate">Sort: Joining Date</option>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
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
