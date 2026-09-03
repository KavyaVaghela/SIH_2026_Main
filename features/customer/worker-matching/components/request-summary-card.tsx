"use client";

import * as React from "react";
import { Wrench, MapPin, Calendar, Clock, Receipt, Edit3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceBookingDraft } from "@/features/customer/service-booking/types";

export interface RequestSummaryCardProps {
  draft: ServiceBookingDraft | null;
  onEditClick?: () => void;
}

export function RequestSummaryCard({ draft, onEditClick }: RequestSummaryCardProps) {
  if (!draft) return null;

  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4 md:p-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100">
            Booking Requirement Summary
          </h3>
        </div>

        {onEditClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEditClick}
            className="text-xs h-7 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 gap-1 font-semibold"
          >
            <Edit3 className="w-3 h-3" />
            Modify Booking
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Service & Category */}
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Trade & Service</span>
          <p className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
            {draft.service?.title || "Household Repair"}
          </p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
            {draft.category?.name || "Service Category"}
          </p>
        </div>

        {/* Location */}
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-600" /> Location
          </span>
          <p className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
            {draft.address?.addressLine1 || "Satellite"}
          </p>
          <p className="text-[11px] text-slate-500 line-clamp-1">
            {draft.address?.city || "Ahmedabad"} - {draft.address?.postalCode || "380015"}
          </p>
        </div>

        {/* Date & Time Slot */}
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block flex items-center gap-1">
            <Calendar className="w-3 h-3 text-emerald-600" /> Schedule
          </span>
          <p className="font-bold text-slate-900 dark:text-slate-100">
            {draft.preferredDate || "Today"}
          </p>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {draft.preferredTimeSlot || "Morning Slot"}
          </p>
        </div>

        {/* Initial Platform Estimate */}
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block flex items-center gap-1">
            <Receipt className="w-3 h-3 text-emerald-600" /> Initial Estimate
          </span>
          <p className="font-extrabold text-sm text-emerald-800 dark:text-emerald-300">
            ₹{Math.round(draft.estimate?.estimatedTotal || 350)}
          </p>
          <p className="text-[10px] text-slate-400">
            Min Visit: ₹{draft.estimate?.minimumVisitCharge || 200}
          </p>
        </div>
      </div>
    </Card>
  );
}
