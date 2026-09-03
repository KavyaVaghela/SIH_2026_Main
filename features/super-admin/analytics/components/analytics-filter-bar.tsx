"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Filter, Check } from "lucide-react";
import type { AnalyticsFilters, AnalyticsTimeframe } from "../types";

interface AnalyticsFilterBarProps {
  filters: AnalyticsFilters;
  onTimeframeChange: (range: AnalyticsTimeframe) => void;
  onCustomRangeChange: (from: string, to: string) => void;
}

export function AnalyticsFilterBar({
  filters,
  onTimeframeChange,
  onCustomRangeChange,
}: AnalyticsFilterBarProps) {
  const [isCustomOpen, setIsCustomOpen] = React.useState(filters.range === "custom");
  const [customFrom, setCustomFrom] = React.useState(filters.customFrom || "");
  const [customTo, setCustomTo] = React.useState(filters.customTo || "");

  const handleCustomApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (customFrom && customTo) {
      onCustomRangeChange(customFrom, customTo);
    }
  };

  const timeframeOptions: Array<{ key: AnalyticsTimeframe; label: string }> = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "year", label: "This Year" },
    { key: "custom", label: "Custom Range" },
  ];

  return (
    <div className="flex flex-col space-y-3 p-3.5 rounded-xl border bg-card shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Timeframe Quick Pills */}
        <div className="flex items-center space-x-1 bg-muted/60 p-1 rounded-lg border self-start sm:self-auto flex-wrap">
          {timeframeOptions.map((opt) => (
            <Button
              key={opt.key}
              variant={filters.range === opt.key ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                if (opt.key === "custom") {
                  setIsCustomOpen(true);
                } else {
                  setIsCustomOpen(false);
                  onTimeframeChange(opt.key);
                }
              }}
              className={
                filters.range === opt.key
                  ? "bg-emerald-800 text-white hover:bg-emerald-900 h-8 px-3 text-xs font-semibold shadow-xs"
                  : "h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
              }
            >
              <Calendar className="h-3 w-3 mr-1 inline" />
              {opt.label}
            </Button>
          ))}
        </div>

        <div className="text-xs text-muted-foreground flex items-center self-start sm:self-auto">
          <Filter className="h-3.5 w-3.5 mr-1 text-emerald-700" />
          <span>
            Active Scope:{" "}
            <span className="font-semibold text-foreground capitalize">
              {filters.range === "custom" && filters.customFrom && filters.customTo
                ? `${filters.customFrom} to ${filters.customTo}`
                : filters.range}
            </span>
          </span>
        </div>
      </div>

      {/* Expandable Custom Date Range Selector */}
      {isCustomOpen && (
        <form
          onSubmit={handleCustomApply}
          className="pt-2 border-t flex flex-col sm:flex-row sm:items-center gap-3 animate-in fade-in-0 duration-200"
        >
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-muted-foreground">From:</label>
            <Input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-8 text-xs w-40 bg-background"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-muted-foreground">To:</label>
            <Input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-8 text-xs w-40 bg-background"
              required
            />
          </div>

          <Button
            type="submit"
            size="sm"
            className="h-8 text-xs bg-emerald-800 text-white hover:bg-emerald-900 font-semibold"
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            Apply Date Filter
          </Button>
        </form>
      )}
    </div>
  );
}
