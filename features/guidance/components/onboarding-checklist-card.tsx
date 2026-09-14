"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight, Sparkles, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { guidanceService } from "../services/guidance-service";
import type { OnboardingTask } from "../types";
import type { PlatformRole } from "@/config/navigation";

export interface OnboardingChecklistCardProps {
  role: PlatformRole;
  className?: string;
  collapsible?: boolean;
}

export function OnboardingChecklistCard({
  role,
  className,
  collapsible = true,
}: OnboardingChecklistCardProps) {
  const tasks = React.useMemo(() => {
    return guidanceService.getOnboardingTasks(role);
  }, [role]);

  const storageKey = `ks_onboarding_${role.toLowerCase()}`;
  const [completedTaskIds, setCompletedTaskIds] = React.useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(false);
  const [mounted, setMounted] = React.useState(false);

  // Load from localStorage on client mount
  React.useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCompletedTaskIds(parsed);
          // If all tasks were completed, collapse by default
          if (parsed.length >= tasks.length && tasks.length > 0) {
            setIsCollapsed(true);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to read onboarding state from localStorage", err);
    }
  }, [storageKey, tasks.length]);

  const toggleTask = (taskId: string) => {
    const updated = completedTaskIds.includes(taskId)
      ? completedTaskIds.filter((id) => id !== taskId)
      : [...completedTaskIds, taskId];

    setCompletedTaskIds(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (err) {
      console.warn("Failed to persist onboarding state", err);
    }
  };

  const handleReset = () => {
    setCompletedTaskIds([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (err) {
      console.warn("Failed to reset onboarding state", err);
    }
  };

  const progressPercent = tasks.length > 0
    ? Math.round((completedTaskIds.length / tasks.length) * 100)
    : 0;

  const allDone = tasks.length > 0 && completedTaskIds.length === tasks.length;

  if (tasks.length === 0) return null;

  return (
    <Card className={`border shadow-sm overflow-hidden ${className || ""}`}>
      <CardHeader className="bg-muted/20 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                Getting Started Checklist
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Essential steps to master your {role.replace(/_/g, " ").toLowerCase()} workspace
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge
              variant={allDone ? "success" : "outline"}
              className={`text-[10px] font-semibold ${
                allDone
                  ? "bg-emerald-600 text-white"
                  : "border-emerald-600/40 text-emerald-700 dark:text-emerald-400"
              }`}
            >
              {completedTaskIds.length}/{tasks.length} Completed
            </Badge>

            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Expand Checklist" : "Collapse Checklist"}
              >
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted/60 h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className="bg-emerald-600 h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-4 space-y-2.5">
          {tasks.map((task) => {
            const isDone = completedTaskIds.includes(task.id);
            return (
              <div
                key={task.id}
                className={`flex items-start justify-between gap-3 p-2.5 rounded-lg border transition-all ${
                  isDone
                    ? "bg-muted/30 border-border/50 text-muted-foreground"
                    : "bg-card border-border hover:border-emerald-500/40"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  className="flex items-start gap-2.5 text-left cursor-pointer flex-1"
                >
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground hover:text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <h5
                      className={`text-xs font-semibold ${
                        isDone
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {task.title}
                    </h5>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                      {task.description}
                    </p>
                  </div>
                </button>

                <div className="shrink-0 flex items-center">
                  <Link href={task.actionHref}>
                    <Button
                      variant={isDone ? "ghost" : "outline"}
                      size="sm"
                      className="text-[11px] h-7 px-2.5"
                    >
                      {task.actionLabel}
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}

          {allDone && (
            <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                🎉 All tasks completed! You are fully equipped.
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-[11px] h-6 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
