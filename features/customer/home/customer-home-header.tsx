"use client";

import * as React from "react";
import { Search, MapPin, SlidersHorizontal, ShieldCheck, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface CustomerHomeHeaderProps {
  customerName?: string;
  locationArea?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function CustomerHomeHeader({
  customerName = "Ravi",
  locationArea = "Satellite, Ahmedabad",
  searchQuery,
  onSearchChange,
}: CustomerHomeHeaderProps) {
  return (
    <div className="relative bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
      {/* Top Bar: Location & Cooperative Trust Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs text-slate-700 dark:text-slate-300 font-medium">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{locationArea}</span>
        </div>

        <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs gap-1.5 py-1 px-3 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          KaushalyaSetu Verified Worker Cooperative
        </Badge>
      </div>

      {/* Hero Greeting & Headline */}
      <div className="pt-0.5">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Good Morning, {customerName} 👋
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
          What service do you need today? Select a category or search verified trade professionals.
        </p>
      </div>

      {/* Main Search Input */}
      <div className="relative max-w-2xl pt-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search for a service (e.g. Electrician, Pipe Leakage, Deep Cleaning)..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-xs md:text-sm shadow-xs"
        />
        {searchQuery ? (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
}
