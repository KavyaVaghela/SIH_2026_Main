"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { BOOKING_FLOW_STEPS, BookingFlowStep } from "../types";

export interface StepIndicatorProps {
  currentStep: BookingFlowStep;
  onStepClick?: (step: BookingFlowStep) => void;
}

export function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm">
      {/* Desktop Stepper */}
      <div className="hidden md:flex items-center justify-between">
        {BOOKING_FLOW_STEPS.map((item, index) => {
          const isCompleted = currentStep > item.step;
          const isCurrent = currentStep === item.step;

          return (
            <React.Fragment key={item.step}>
              <div
                onClick={() => isCompleted && onStepClick?.(item.step as BookingFlowStep)}
                className={`flex items-center gap-2.5 ${
                  isCompleted ? "cursor-pointer group" : "cursor-default"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isCompleted
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-emerald-700 text-white ring-4 ring-emerald-100 dark:ring-emerald-950"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : item.step}
                </div>
                <div>
                  <p
                    className={`text-xs font-bold ${
                      isCurrent
                        ? "text-emerald-700 dark:text-emerald-400"
                        : isCompleted
                        ? "text-slate-900 dark:text-slate-200 group-hover:text-emerald-600"
                        : "text-slate-400"
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {item.description}
                  </p>
                </div>
              </div>

              {index < BOOKING_FLOW_STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 ${
                    currentStep > index + 1 ? "bg-emerald-600" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile Stepper Bar */}
      <div className="md:hidden space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-emerald-700 dark:text-emerald-400">
            Step {currentStep} of 7: {BOOKING_FLOW_STEPS[currentStep - 1]?.label}
          </span>
          <span className="text-slate-400 font-medium">
            {BOOKING_FLOW_STEPS[currentStep - 1]?.description}
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
          {BOOKING_FLOW_STEPS.map((item) => (
            <div
              key={item.step}
              className={`h-full flex-1 border-r border-white dark:border-slate-900 last:border-0 ${
                currentStep >= item.step ? "bg-emerald-600" : "bg-transparent"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
