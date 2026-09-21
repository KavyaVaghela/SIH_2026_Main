"use client";

import * as React from "react";
import { Users2, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FederationCoverageItem } from "../types";

export interface FederationCoverageListProps {
  federations: FederationCoverageItem[];
  onViewFederation: (fed: FederationCoverageItem) => void;
  onViewAll?: () => void;
}

export function FederationCoverageList({
  federations,
  onViewFederation,
  onViewAll,
}: FederationCoverageListProps) {
  return (
    <Card className="border border-border/80 shadow-sm flex flex-col h-full min-w-0 max-w-full overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Users2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <CardTitle className="text-base font-bold text-foreground truncate">
                Federation Welfare Coverage
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Compare welfare coverage and identify federations requiring support.
            </p>
          </div>

          <Button
            onClick={onViewAll}
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 px-2 font-medium shrink-0"
          >
            View All &rarr;
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4 min-w-0 max-w-full">
        {federations.map((fed) => (
          <div
            key={fed.id}
            onClick={() => onViewFederation(fed)}
            className="group p-2.5 rounded-lg border border-transparent hover:border-emerald-200 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all cursor-pointer min-w-0"
          >
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5 min-w-0">
              <span className="text-foreground group-hover:text-emerald-600 transition-colors truncate min-w-0 flex-1 mr-2">
                {fed.name}
              </span>
              <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                <span className="font-bold text-foreground">
                  {fed.coveredWorkers} / {fed.totalWorkers}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 min-w-[32px] text-right">
                  {fed.coveragePercentage}%
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${fed.coveragePercentage}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
