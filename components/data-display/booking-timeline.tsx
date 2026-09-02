import * as React from "react";
import { StatusTimeline, type TimelineStep } from "@/components/status/status-timeline";

export interface BookingTimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export function BookingTimeline({ steps, className }: BookingTimelineProps) {
  return (
    <div className={className}>
      <h4 className="text-sm font-semibold mb-4 text-foreground">Service Lifecycle History</h4>
      <StatusTimeline steps={steps} />
    </div>
  );
}
