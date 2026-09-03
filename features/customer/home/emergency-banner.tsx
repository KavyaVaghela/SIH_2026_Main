"use client";

import * as React from "react";
import { AlertOctagon, ChevronRight, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface EmergencyBannerProps {
  onEmergencyClick?: () => void;
}

export function EmergencyBanner({ onEmergencyClick }: EmergencyBannerProps) {
  return (
    <Card className="bg-amber-50/80 dark:bg-slate-900 border border-amber-300/80 dark:border-amber-800/80 p-5 shadow-xs relative overflow-hidden rounded-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-lg border border-amber-300 dark:border-amber-700 shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-200/70 dark:bg-amber-950 text-amber-900 dark:text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700 uppercase tracking-wide">
                24/7 Urgent Dispatch
              </span>
            </div>
            <h3 className="font-bold text-sm md:text-base text-slate-900 dark:text-slate-100 mt-1">
              Emergency Household Service Needed?
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 max-w-xl mt-0.5 font-normal">
              Priority deployment for pipe bursts, electrical short circuits, gas leaks, or urgent door lockouts in Ahmedabad.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold gap-1.5 shrink-0 shadow-xs px-4"
          onClick={onEmergencyClick}
        >
          <Zap className="w-3.5 h-3.5" />
          Request Emergency Service
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
}
