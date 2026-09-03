"use client";

import * as React from "react";
import { Search, RotateCcw, Filter, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { NOTIFICATION_CATEGORY_META } from "../data/mock-notifications";
import type { NotificationFilterOptions, NotificationCategory } from "../types";

interface NotificationsFilterTabsProps {
  filters: NotificationFilterOptions;
  onFilterChange: (newFilters: Partial<NotificationFilterOptions>) => void;
  onReset: () => void;
}

export function NotificationsFilterTabs({
  filters,
  onFilterChange,
  onReset,
}: NotificationsFilterTabsProps) {
  const hasActiveFilters =
    filters.readStatus !== "ALL" ||
    filters.category !== "ALL" ||
    filters.searchQuery !== "";

  const viewTabs: Array<{ key: "ALL" | "UNREAD" | "READ"; label: string }> = [
    { key: "ALL", label: "All Alerts" },
    { key: "UNREAD", label: "Unread Only" },
    { key: "READ", label: "Read / Acknowledged" },
  ];

  const categories = Object.keys(NOTIFICATION_CATEGORY_META) as NotificationCategory[];

  return (
    <div className="flex flex-col space-y-3 p-4 rounded-xl border bg-card shadow-xs">
      {/* Top Row: Read Status View Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center space-x-1 bg-muted/60 p-1 rounded-lg border self-start sm:self-auto flex-wrap">
          {viewTabs.map((tab) => (
            <Button
              key={tab.key}
              variant={filters.readStatus === tab.key ? "default" : "ghost"}
              size="sm"
              onClick={() => onFilterChange({ readStatus: tab.key })}
              className={
                filters.readStatus === tab.key
                  ? "bg-emerald-800 text-white hover:bg-emerald-900 h-8 px-3 text-xs font-semibold shadow-xs"
                  : "h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
              }
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts, keywords, entity descriptions..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="pl-9 h-9 text-xs bg-background"
          />
        </div>
      </div>

      {/* Category Dropdown Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t">
        <div className="flex items-center space-x-2">
          <Tag className="h-4 w-4 text-emerald-700 shrink-0" />
          <span className="text-xs font-semibold text-muted-foreground">Category:</span>
          <Select
            value={filters.category}
            onChange={(e) =>
              onFilterChange({ category: e.target.value as "ALL" | NotificationCategory })
            }
            className="h-8 text-xs w-64"
          >
            <option value="ALL">All Event Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {NOTIFICATION_CATEGORY_META[cat].label}
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
