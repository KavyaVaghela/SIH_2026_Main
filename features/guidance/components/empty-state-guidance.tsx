"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface EmptyStateGuidanceProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  guidanceTip?: string;
  action?: {
    label: string;
    href: string;
    variant?: "default" | "outline";
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  className?: string;
}

export function EmptyStateGuidance({
  icon,
  title,
  description,
  guidanceTip,
  action,
  secondaryAction,
  className,
}: EmptyStateGuidanceProps) {
  return (
    <Card className={`p-8 text-center border-dashed border-border/80 bg-muted/10 space-y-4 max-w-xl mx-auto ${className || ""}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-600 mx-auto">
        {icon || <Sparkles className="h-6 w-6" />}
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          {description}
        </p>
      </div>

      {guidanceTip && (
        <div className="inline-flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 max-w-md mx-auto text-left">
          <HelpCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{guidanceTip}</span>
        </div>
      )}

      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          {action && (
            <Link href={action.href}>
              <Button size="sm" variant={action.variant || "default"} className="text-xs">
                {action.label}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          )}

          {secondaryAction && (
            <Link href={secondaryAction.href}>
              <Button size="sm" variant="outline" className="text-xs">
                {secondaryAction.label}
              </Button>
            </Link>
          )}
        </div>
      )}
    </Card>
  );
}
