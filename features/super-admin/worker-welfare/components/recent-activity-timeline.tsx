"use client";

import * as React from "react";
import { Clock, PlusCircle, RefreshCw, CheckCircle, Award, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RECENT_WELFARE_ACTIVITIES } from "../data/welfare-mock-data";

function getActivityIcon(type: string) {
  switch (type) {
    case "training_created":
      return <PlusCircle className="h-4 w-4 text-emerald-600" />;
    case "scheme_updated":
      return <RefreshCw className="h-4 w-4 text-rose-600" />;
    case "training_published":
      return <CheckCircle className="h-4 w-4 text-blue-600" />;
    case "certification_batch":
      return <Award className="h-4 w-4 text-purple-600" />;
    case "review_completed":
      return <ShieldCheck className="h-4 w-4 text-amber-600" />;
    default:
      return <Clock className="h-4 w-4 text-emerald-600" />;
  }
}

export interface RecentActivityTimelineProps {
  onViewAll?: () => void;
}

export function RecentActivityTimeline({ onViewAll }: RecentActivityTimelineProps) {
  return (
    <Card className="border border-border/80 shadow-sm flex flex-col justify-between h-full min-w-0 max-w-full overflow-hidden">
      <CardHeader className="pb-2 border-b border-border/60">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="h-5 w-5 text-emerald-600 shrink-0" />
            <CardTitle className="text-base font-bold text-foreground truncate">
              Recent Activity
            </CardTitle>
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

      <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between min-w-0 max-w-full">
        {RECENT_WELFARE_ACTIVITIES.map((item) => (
          <div key={item.id} className="flex items-start gap-2.5 text-xs">
            <div className="p-1.5 rounded-full bg-muted border border-border/60 shrink-0 mt-0.5">
              {getActivityIcon(item.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground truncate">{item.title}</div>
              <div className="text-[11px] text-muted-foreground truncate">{item.subtitle}</div>
            </div>
            <div className="text-[10px] text-muted-foreground font-medium shrink-0 pt-0.5">
              {item.timeAgo}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
