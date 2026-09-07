"use client";

import * as React from "react";
import { Search, RotateCcw, Calendar, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { BookingFilterOptions, BookingDateFilter } from "../types";

interface BookingsFiltersProps {
  filters: BookingFilterOptions;
  societies: Array<{ id: string; name: string }>;
  services: string[];
  locations: string[];
  onFilterChange: (newFilters: Partial<BookingFilterOptions>) => void;
  onReset: () => void;
}

export function BookingsFilters({
  filters,
  societies,
  services,
  locations,
  onFilterChange,
  onReset,
}: BookingsFiltersProps) {
  const hasActiveFilters =
    filters.searchQuery !== "" ||
    filters.dateRange !== "all" ||
    filters.status !== "ALL" ||
    filters.service !== "ALL" ||
    filters.society !== "ALL" ||
    filters.location !== "ALL";

  return (
    <div className="flex flex-col space-y-3 p-4 rounded-xl border bg-card shadow-xs">
      {/* Top Search & Date Range Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Date Range Quick Selector */}
        <div className="flex items-center space-x-1 bg-muted/60 p-1 rounded-lg border self-start sm:self-auto shrink-0">
          {(
            [
              { key: "all", label: "All Time" },
              { key: "today", label: "Today" },
              { key: "7d", label: "Last 7 Days" },
              { key: "30d", label: "Last 30 Days" },
            ] as Array<{ key: BookingDateFilter; label: string }>
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

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Booking ID, customer, worker, service..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="pl-9 h-9 text-xs bg-background"
          />
        </div>
      </div>

      {/* Filter Dropdowns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
        {/* Status Filter */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
            Booking Status
          </label>
          <Select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="h-8 text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Stage: Pending Dispatch</option>
            <option value="ACCEPTED">Stage: Worker Accepted</option>
            <option value="IN_PROGRESS">Stage: In-Progress (Live)</option>
            <option value="COMPLETED">Stage: Completed</option>
            <option value="CANCELLED">Stage: Cancelled</option>
            <option value="REQUEST_SENT">State: Request Sent</option>
            <option value="CUSTOMER_CONFIRMATION_PENDING">State: Confirmation Pending</option>
            <option value="ON_THE_WAY">State: On The Way</option>
            <option value="OTP_VERIFIED">State: OTP Verified</option>
            <option value="SERVICE_STARTED">State: Service Started</option>
            <option value="BOOKING_COMPLETED">State: Booking Completed</option>
          </Select>
        </div>

        {/* Service Filter */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
            Service Title
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

        {/* Society / Federation Filter */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
            Cooperative Society
          </label>
          <Select
            value={filters.society}
            onChange={(e) => onFilterChange({ society: e.target.value })}
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

        {/* Location Filter */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
            Region / City
          </label>
          <Select
            value={filters.location}
            onChange={(e) => onFilterChange({ location: e.target.value })}
            className="h-8 text-xs"
          >
            <option value="ALL">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </Select>
        </div>

        {/* Sort Options */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
            Sort Order
          </label>
          <Select
            value={filters.sortBy}
            onChange={(e) =>
              onFilterChange({
                sortBy: e.target.value as BookingFilterOptions["sortBy"],
              })
            }
            className="h-8 text-xs"
          >
            <option value="scheduledStartAt">Scheduled Time</option>
            <option value="totalAmount">Job Value (₹)</option>
            <option value="bookingNumber">Booking Number</option>
            <option value="status">Status</option>
          </Select>
        </div>

        {/* Reset Filters */}
        <div className="flex items-end">
          {hasActiveFilters ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="h-8 w-full text-xs text-muted-foreground hover:text-foreground border-dashed"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset Filters
            </Button>
          ) : (
            <div className="h-8 flex items-center justify-center text-xs text-muted-foreground/60 w-full italic">
              <Filter className="h-3 w-3 mr-1 inline" /> Default Filters
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
