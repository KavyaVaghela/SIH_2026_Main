"use client";

import * as React from "react";
import { ChevronRight, ArrowLeft, Calendar as CalendarIcon, Clock, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TIME_SLOTS = [
  { id: "slot-morning", label: "Morning Slot", timeRange: "09:00 AM - 12:00 PM", icon: Clock },
  { id: "slot-afternoon", label: "Afternoon Slot", timeRange: "12:00 PM - 03:00 PM", icon: Clock },
  { id: "slot-evening", label: "Evening Slot", timeRange: "03:00 PM - 06:00 PM", icon: Clock },
];

export interface StepScheduleProps {
  preferredDate: string;
  preferredTimeSlot: string;
  onChangeDate: (dateStr: string) => void;
  onChangeTimeSlot: (slotStr: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepSchedule({
  preferredDate,
  preferredTimeSlot,
  onChangeDate,
  onChangeTimeSlot,
  onNext,
  onBack,
}: StepScheduleProps) {
  const [error, setError] = React.useState<string | null>(null);

  // Today's date string YYYY-MM-DD
  const todayStr = React.useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  // Quick date presets (Today, Tomorrow, Day after)
  const quickDates = React.useMemo(() => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(today.getDate() + 2);

    return [
      { label: "Today", value: today.toISOString().split("T")[0] },
      { label: "Tomorrow", value: tomorrow.toISOString().split("T")[0] },
      { label: dayAfter.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }), value: dayAfter.toISOString().split("T")[0] },
    ];
  }, []);

  const handleContinue = () => {
    if (!preferredDate) {
      setError("Please choose a preferred service date.");
      return;
    }
    if (preferredDate < todayStr) {
      setError("Service date cannot be in the past.");
      return;
    }
    if (!preferredTimeSlot) {
      setError("Please select a preferred time slot.");
      return;
    }

    setError(null);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Step 6: Select Preferred Date & Time
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Specify when you prefer the cooperative worker to arrive
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 p-3 rounded-xl border border-rose-200 text-xs font-medium">
          {error}
        </div>
      )}

      <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl space-y-5">
        {/* Date Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-emerald-600" />
            <span>Preferred Date <span className="text-rose-500">*</span></span>
          </label>

          {/* Quick Date Presets */}
          <div className="grid grid-cols-3 gap-2">
            {quickDates.map((qd) => (
              <button
                type="button"
                key={qd.value}
                onClick={() => onChangeDate(qd.value)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  preferredDate === qd.value
                    ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                }`}
              >
                {qd.label}
              </button>
            ))}
          </div>

          <div className="pt-1">
            <Input
              type="date"
              min={todayStr}
              value={preferredDate}
              onChange={(e) => onChangeDate(e.target.value)}
              className="text-xs max-w-xs bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700"
            />
          </div>
        </div>

        {/* Time Slot Selection */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Preferred Time Slot <span className="text-rose-500">*</span></span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TIME_SLOTS.map((slot) => {
              const isSelected = preferredTimeSlot === slot.timeRange;

              return (
                <div
                  key={slot.id}
                  onClick={() => onChangeTimeSlot(slot.timeRange)}
                  className={`p-3.5 cursor-pointer rounded-xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20"
                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <span className="font-bold text-xs block text-slate-900 dark:text-slate-100">
                      {slot.label}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {slot.timeRange}
                    </span>
                  </div>

                  <span className={`text-[10px] font-semibold mt-2 block ${isSelected ? "text-emerald-700" : "text-slate-400"}`}>
                    {isSelected ? "Selected Slot" : "Select Slot"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Availability Info Banner */}
        <div className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Info className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Note: Worker availability will be matched and confirmed in the next step.</span>
        </div>
      </Card>

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" size="sm" onClick={onBack} className="text-xs border-slate-300">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-6 gap-1.5"
        >
          Review Requirement Summary
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
