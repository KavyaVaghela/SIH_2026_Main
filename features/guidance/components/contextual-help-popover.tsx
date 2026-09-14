"use client";

import * as React from "react";
import { HelpCircle, Info, Sparkles, Check, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ContextualHelpPopoverProps {
  buttonText: string;
  modalTitle: string;
  summary?: string;
  badgeText?: string;
  sections?: {
    heading: string;
    details: string;
  }[];
  bullets?: string[];
  footerTip?: string;
  className?: string;
  variant?: "badge" | "link" | "button" | "icon";
}

export function ContextualHelpPopover({
  buttonText,
  modalTitle,
  summary,
  badgeText = "Guidance",
  sections = [],
  bullets = [],
  footerTip,
  className,
  variant = "link",
}: ContextualHelpPopoverProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {variant === "badge" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer ${className || ""}`}
        >
          <HelpCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          <span>{buttonText}</span>
        </button>
      ) : variant === "button" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className={`text-xs h-7 px-2.5 border-emerald-500/30 hover:border-emerald-500 text-emerald-800 dark:text-emerald-300 ${className || ""}`}
        >
          <HelpCircle className="h-3 w-3 mr-1 text-emerald-600" />
          {buttonText}
        </Button>
      ) : variant === "icon" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`text-muted-foreground hover:text-emerald-600 transition-colors p-1 rounded-full hover:bg-muted ${className || ""}`}
          title={buttonText}
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-medium hover:underline cursor-pointer ${className || ""}`}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>{buttonText}</span>
        </button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between pr-4">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    {modalTitle}
                  </DialogTitle>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] border-emerald-600/40 text-emerald-700">
                {badgeText}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs sm:text-sm">
            {summary && (
              <p className="text-foreground leading-relaxed font-medium bg-muted/30 p-3 rounded-lg border border-border/60">
                {summary}
              </p>
            )}

            {sections.length > 0 && (
              <div className="space-y-2.5">
                {sections.map((sec, i) => (
                  <div key={i} className="p-2.5 rounded-lg border bg-card space-y-0.5">
                    <h5 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-800 text-[10px] font-bold">
                        {i + 1}
                      </span>
                      {sec.heading}
                    </h5>
                    <p className="text-muted-foreground text-xs pl-5 leading-normal">
                      {sec.details}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {bullets.length > 0 && (
              <ul className="space-y-1.5 pl-2">
                {bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            {footerTip && (
              <div className="p-2.5 rounded-md bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/30 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>{footerTip}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button size="sm" onClick={() => setIsOpen(false)} className="text-xs">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
