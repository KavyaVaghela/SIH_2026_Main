import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimelineStep {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  isCompleted: boolean;
  isCurrent?: boolean;
}

export interface StatusTimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export function StatusTimeline({ steps, className }: StatusTimelineProps) {
  return (
    <div className={cn("space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:-z-10 before:bg-border", className)}>
      {steps.map((step) => {
        return (
          <div key={step.id} className="flex items-start space-x-4 group">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ring-4 ring-background",
                step.isCompleted
                  ? "bg-emerald-600 text-white"
                  : step.isCurrent
                  ? "bg-primary text-primary-foreground animate-pulse"
                  : "bg-muted text-muted-foreground border border-border"
              )}
            >
              {step.isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : step.id}
            </div>

            <div className="flex-1 space-y-0.5 pt-0.5">
              <div className="flex items-center justify-between">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    step.isCurrent
                      ? "text-primary"
                      : step.isCompleted
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </p>
                {step.timestamp && (
                  <span className="text-xs text-muted-foreground">{step.timestamp}</span>
                )}
              </div>
              {step.description && (
                <p className="text-xs text-muted-foreground">{step.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
