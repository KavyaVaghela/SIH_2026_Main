"use client";

import * as React from "react";
import { HeartHandshake, Download, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface WelfareHeaderProps {
  federationFilter: string;
  setFederationFilter: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  dateFilter: string;
  setDateFilter: (val: string) => void;
  onExportReport: () => void;
  federationOptions: Array<{ id: string; name: string }>;
}

export function WelfareHeader({
  federationFilter,
  setFederationFilter,
  categoryFilter,
  setCategoryFilter,
  dateFilter,
  setDateFilter,
  onExportReport,
  federationOptions,
}: WelfareHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Top Banner Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 shrink-0 mt-0.5">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Welfare Management
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-3xl">
              Manage worker welfare programs, scheme coverage, assistance, training and certification initiatives across all federations.
            </p>
          </div>
        </div>

        {/* Quote Badge & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <div className="hidden xl:block text-right pr-2">
            <p className="text-xs italic font-semibold text-emerald-800 dark:text-emerald-400">
              &quot;Empowered Workers
            </p>
            <p className="text-xs italic font-semibold text-emerald-700 dark:text-emerald-500">
              Stronger Communities
            </p>
            <p className="text-[11px] italic text-emerald-600 dark:text-emerald-600">
              A Better Tomorrow&quot;
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Federation Dropdown Filter */}
            <div className="relative">
              <select
                value={federationFilter}
                onChange={(e) => setFederationFilter(e.target.value)}
                className="h-9 text-xs font-medium bg-background border border-border/80 rounded-md px-3 py-1 pr-8 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-foreground cursor-pointer shadow-sm"
              >
                <option value="ALL">All Federations</option>
                {federationOptions.map((fed) => (
                  <option key={fed.id} value={fed.name}>
                    {fed.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Dropdown Filter */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-9 text-xs font-medium bg-background border border-border/80 rounded-md px-3 py-1 pr-8 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-foreground cursor-pointer shadow-sm"
              >
                <option value="ALL">All Welfare Categories</option>
                <option value="Pension">Pension</option>
                <option value="Insurance">Insurance</option>
                <option value="Health">Health</option>
                <option value="Skill Development">Skill Development</option>
                <option value="Safety">Safety</option>
                <option value="Social Welfare">Social Welfare</option>
              </select>
            </div>

            {/* Date Range Dropdown Filter */}
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-9 text-xs font-medium bg-background border border-border/80 rounded-md px-3 py-1 pr-8 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-foreground cursor-pointer shadow-sm"
              >
                <option value="30_DAYS">Last 30 Days</option>
                <option value="7_DAYS">Last 7 Days</option>
                <option value="90_DAYS">Last 90 Days</option>
                <option value="ALL">All Time</option>
              </select>
            </div>

            {/* Export Report Button */}
            <Button
              onClick={onExportReport}
              className="h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-1.5 px-3"
            >
              <Download className="h-3.5 w-3.5" />
              Export Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
