"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, ChevronDown, ChevronUp, Wrench, CheckCircle, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TroubleshootingStep } from "../types";

export interface TroubleshootingAccordionProps {
  items: TroubleshootingStep[];
  className?: string;
  defaultOpenId?: string;
}

export function TroubleshootingAccordion({
  items,
  className,
  defaultOpenId,
}: TroubleshootingAccordionProps) {
  const [openId, setOpenId] = React.useState<string | null>(
    defaultOpenId || (items.length > 0 ? items[0].id : null)
  );

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  if (items.length === 0) return null;

  return (
    <div className={`space-y-3 ${className || ""}`}>
      {items.map((item) => {
        const isOpen = openId === item.id;

        return (
          <div
            key={item.id}
            className={`rounded-xl border transition-all overflow-hidden ${
              isOpen
                ? "border-emerald-500/40 bg-card shadow-xs ring-1 ring-emerald-500/20"
                : "border-border bg-card/60 hover:bg-card"
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="w-full flex items-center justify-between p-4 text-left cursor-pointer gap-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    isOpen
                      ? "bg-emerald-600 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Wrench className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {item.issueSymptoms}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-muted-foreground">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/40 text-xs sm:text-sm">
                {/* Probable Causes */}
                <div className="p-3 rounded-lg bg-muted/40 border space-y-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Probable Causes
                  </span>
                  <ul className="space-y-1">
                    {item.probableCauses.map((cause, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Resolution Steps */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
                    Recommended Recovery Steps
                  </span>
                  <div className="space-y-1.5">
                    {item.resolutionSteps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-2 rounded-md bg-card border text-xs text-foreground">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 font-bold shrink-0 text-[10px]">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recovery Action Button */}
                {item.recoveryAction && (
                  <div className="pt-2 flex justify-end">
                    <Link href={item.recoveryAction.href}>
                      <Button size="sm" className="text-xs h-8">
                        {item.recoveryAction.label}
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
