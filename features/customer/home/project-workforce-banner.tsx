"use client";

import * as React from "react";
import { Building2, ChevronRight, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface ProjectWorkforceBannerProps {
  onHireProjectClick?: () => void;
}

export function ProjectWorkforceBanner({ onHireProjectClick }: ProjectWorkforceBannerProps) {
  return (
    <Card className="bg-indigo-50/60 dark:bg-slate-900 border border-indigo-200/80 dark:border-slate-800 p-5 shadow-xs rounded-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[10px] font-extrabold px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 uppercase tracking-wide">
                Institutional & Bulk Contracts
              </span>
            </div>
            <h3 className="font-bold text-sm md:text-base text-slate-900 dark:text-slate-100 mt-1">
              Hire Cooperative Workforce for Large Projects
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 max-w-xl mt-0.5 font-normal">
              Contract skilled worker team deployments for residential society renovations, commercial painting, or bulk electrical overhaul.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="border-indigo-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-indigo-900 dark:text-slate-100 hover:bg-indigo-50 text-xs font-bold gap-1.5 shrink-0 px-4"
          onClick={onHireProjectClick}
        >
          <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          Submit Project RFP
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
}
