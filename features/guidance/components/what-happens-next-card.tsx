"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRightCircle, Clock, User, Sparkles, CheckCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { guidanceService } from "../services/guidance-service";
import type { WhatHappensNextContext, WhatHappensNextResolution } from "../types";
import { cn } from "@/lib/utils";

export interface WhatHappensNextCardProps {
  context: WhatHappensNextContext;
  className?: string;
  compact?: boolean;
}

export function WhatHappensNextCard({ context, className, compact = false }: WhatHappensNextCardProps) {
  const resolution: WhatHappensNextResolution = React.useMemo(() => {
    return guidanceService.resolveWhatHappensNext(context);
  }, [context]);

  if (compact) {
    return (
      <div
        className={cn(
          "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-sm",
          className
        )}
      >
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-xs uppercase tracking-wider">
                What Happens Next
              </span>
              <Badge variant="outline" className="text-[10px] py-0 border-emerald-600/40 text-emerald-700">
                {resolution.currentStageLabel}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {resolution.nextStepExplanation}
            </p>
          </div>
        </div>

        {resolution.actionLink && (
          <Link href={resolution.actionLink.href} className="shrink-0 self-end sm:self-center">
            <Button size="sm" variant={resolution.actionLink.variant === "primary" ? "default" : "outline"} className="text-xs h-8">
              {resolution.actionLink.label}
              <ArrowRightCircle className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("border-emerald-500/30 bg-gradient-to-br from-emerald-50/40 via-card to-card dark:from-emerald-950/20 dark:via-card dark:to-card shadow-sm", className)}>
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-bold tracking-tight text-foreground">
              What Happens Next?
            </CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">Current Stage:</span>
            <Badge variant="outline" className="text-[10px] border-emerald-600/40 text-emerald-700 dark:text-emerald-400 font-semibold">
              {resolution.currentStageLabel}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3.5">
        <div>
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <ArrowRightCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            {resolution.nextStepTitle}
          </h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {resolution.nextStepExplanation}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-border/40 text-xs">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <User className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>
              Who acts next:{" "}
              <strong className="text-foreground font-semibold">
                {resolution.whoActsNext}
              </strong>
            </span>
          </div>

          {resolution.timelineEstimate && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>
                Expected timeline:{" "}
                <strong className="text-foreground font-semibold">
                  {resolution.timelineEstimate}
                </strong>
              </span>
            </div>
          )}
        </div>

        {resolution.actionPrompt && (
          <div className="flex items-center justify-between p-2.5 rounded-md bg-background/80 border text-xs">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              <span className="font-medium text-foreground">{resolution.actionPrompt}</span>
            </div>

            {resolution.actionLink && (
              <Link href={resolution.actionLink.href}>
                <Button size="sm" variant={resolution.actionLink.variant === "primary" ? "default" : "outline"} className="text-xs h-7 px-2.5">
                  {resolution.actionLink.label}
                  <ArrowRightCircle className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
