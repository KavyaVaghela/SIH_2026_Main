"use client";

import * as React from "react";
import { Sparkles, User, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VISUAL_JOURNEY_MAPS } from "../data/guidance-content";
import type { VisualJourneyMapData, VisualJourneyStep } from "../types";
import type { PlatformRole } from "@/config/navigation";

export interface VisualJourneyMapProps {
  role: PlatformRole;
  defaultJourney?: "CUSTOMER_BOOKING" | "WORKER_LIFECYCLE" | "COMPLAINT_CONCILIATION";
  currentStageCode?: string;
  className?: string;
}

export function VisualJourneyMap({
  role,
  defaultJourney,
  currentStageCode,
  className,
}: VisualJourneyMapProps) {
  const initialKey =
    defaultJourney ||
    (role === "WORKER"
      ? "WORKER_LIFECYCLE"
      : role === "FEDERATION_ADMIN" || role === "SUPER_ADMIN"
      ? "COMPLAINT_CONCILIATION"
      : "CUSTOMER_BOOKING");

  const [activeJourneyKey, setActiveJourneyKey] = React.useState<string>(initialKey);
  const [selectedStep, setSelectedStep] = React.useState<VisualJourneyStep | null>(null);

  const journeyData: VisualJourneyMapData =
    VISUAL_JOURNEY_MAPS[activeJourneyKey] || VISUAL_JOURNEY_MAPS.CUSTOMER_BOOKING;

  // Available journeys by role
  const availableJourneys = React.useMemo(() => {
    if (role === "CUSTOMER") {
      return [{ key: "CUSTOMER_BOOKING", label: "Customer Service Journey" }];
    }
    if (role === "WORKER") {
      return [{ key: "WORKER_LIFECYCLE", label: "Worker Job Lifecycle" }];
    }
    return [
      { key: "CUSTOMER_BOOKING", label: "Customer Journey" },
      { key: "WORKER_LIFECYCLE", label: "Worker Lifecycle" },
      { key: "COMPLAINT_CONCILIATION", label: "Grievance Conciliation" },
    ];
  }, [role]);

  // Set default selected step
  React.useEffect(() => {
    if (journeyData?.steps?.length > 0) {
      if (currentStageCode) {
        const found = journeyData.steps.find((s) => s.stageCode === currentStageCode);
        setSelectedStep(found || journeyData.steps[0]);
      } else {
        setSelectedStep(journeyData.steps[0]);
      }
    }
  }, [journeyData, currentStageCode]);

  return (
    <Card className={`border shadow-sm overflow-hidden ${className || ""}`}>
      <CardHeader className="border-b bg-muted/20 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-base font-bold text-foreground">
                {journeyData.journeyTitle}
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {journeyData.description}
            </p>
          </div>

          {availableJourneys.length > 1 && (
            <div className="flex flex-wrap gap-1.5 self-start sm:self-center">
              {availableJourneys.map((j) => (
                <Button
                  key={j.key}
                  variant={activeJourneyKey === j.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveJourneyKey(j.key)}
                  className="text-xs h-8"
                >
                  {j.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Responsive Process Steps Grid — Desktop First Wrapping */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Click any process stage to inspect prerequisites, responsibilities, and deliverables:</span>
            <span className="font-semibold text-emerald-800 dark:text-emerald-400">
              {journeyData.steps.length} Stages
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-2.5">
            {journeyData.steps.map((step) => {
              const isSelected = selectedStep?.stepNumber === step.stepNumber;
              const isCurrent = currentStageCode && step.stageCode === currentStageCode;

              return (
                <button
                  key={step.stepNumber}
                  type="button"
                  onClick={() => setSelectedStep(step)}
                  className={`flex flex-col items-start p-2.5 rounded-xl border transition-all text-left w-full cursor-pointer relative ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/50 shadow-xs ring-1 ring-emerald-600"
                      : isCurrent
                      ? "border-amber-500 bg-amber-50/40 dark:bg-amber-950/20"
                      : "border-border bg-card hover:bg-muted/40 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        isSelected
                          ? "bg-emerald-600 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step.stepNumber}
                    </span>
                    {isCurrent ? (
                      <Badge variant="warning" className="text-[9px] py-0 px-1">
                        Current
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/70 font-mono">
                        #{step.stepNumber}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-foreground line-clamp-2 leading-tight w-full">
                    {step.title.replace(/^\d+\.\s*/, "")}
                  </span>
                  <div className="mt-2 pt-1 border-t border-border/40 w-full flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground font-medium truncate">
                      {step.whoActs}
                    </span>
                    {isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Step Detailed Dossier */}
        {selectedStep && (
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                  {selectedStep.stepNumber}
                </span>
                <h4 className="text-sm font-bold text-foreground">
                  {selectedStep.title}
                </h4>
              </div>
              <Badge variant="outline" className="text-xs border-emerald-600/40 text-emerald-700 w-fit">
                Role: {selectedStep.whoActs}
              </Badge>
            </div>

            <p className="text-xs sm:text-sm text-foreground leading-relaxed">
              {selectedStep.summary}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-2.5 rounded-lg bg-card border">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Required Inputs
                </span>
                <p className="text-foreground font-medium flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-emerald-600" />
                  {selectedStep.requiredInput}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-card border">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Output / Artifact
                </span>
                <p className="text-foreground font-medium flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-emerald-600" />
                  {selectedStep.outputArtifact}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
