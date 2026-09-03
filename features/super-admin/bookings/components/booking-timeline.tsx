"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BookingStatusBadge } from "./booking-status-badge";
import { History, Clock, User, CheckCircle2 } from "lucide-react";
import type { BookingTimelineItem } from "../types";

interface BookingTimelineProps {
  timeline: BookingTimelineItem[];
  className?: string;
}

export function BookingTimeline({ timeline, className = "" }: BookingTimelineProps) {
  if (timeline.length === 0) {
    return (
      <Card className={`border shadow-sm ${className}`}>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-bold text-foreground flex items-center space-x-2">
            <History className="h-5 w-5 text-emerald-700" />
            <span>State Transition Audit Trail</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center text-xs text-muted-foreground">
          No previous status transition records logged for this booking yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border shadow-sm ${className}`}>
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base font-bold text-foreground flex items-center space-x-2">
          <History className="h-5 w-5 text-emerald-700" />
          <span>State Transition Audit Trail ({timeline.length} Milestones)</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted-foreground/20">
          {timeline.map((item, idx) => {
            const isLast = idx === timeline.length - 1;

            return (
              <div key={item.id} className="relative group">
                {/* Node Dot */}
                <div
                  className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-background flex items-center justify-center ${
                    isLast
                      ? "bg-emerald-600 ring-4 ring-emerald-100 dark:ring-emerald-950"
                      : "bg-muted-foreground/60"
                  }`}
                />

                {/* Content Box */}
                <div className="p-3.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-foreground">{item.title}</span>
                      <BookingStatusBadge type="status" status={item.newStatus} />
                    </div>

                    <div className="flex items-center space-x-1 text-[11px] text-muted-foreground shrink-0">
                      <Clock className="h-3 w-3" />
                      <span>{item.createdAt}</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>

                  {item.changedBy && (
                    <div className="pt-1 flex items-center space-x-1 text-[11px] text-muted-foreground">
                      <User className="h-3 w-3 text-emerald-700" />
                      <span>Action by: <span className="font-semibold text-foreground">{item.changedBy}</span></span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
