"use client";

import * as React from "react";
import Link from "next/link";
import { HelpCircle, ArrowRight, UserCheck, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { guidanceService } from "../services/guidance-service";
import type { StatusExplainerItem } from "../types";
import type { PlatformRole } from "@/config/navigation";

export interface StatusExplainerModalProps {
  statusCode: string | null;
  role: PlatformRole;
  isOpen: boolean;
  onClose: () => void;
}

export function StatusExplainerModal({
  statusCode,
  role,
  isOpen,
  onClose,
}: StatusExplainerModalProps) {
  const explainer: StatusExplainerItem | null = React.useMemo(() => {
    if (!statusCode) return null;
    return guidanceService.getStatusExplanation(statusCode, role);
  }, [statusCode, role]);

  if (!explainer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Status: {explainer.displayTitle}
              </DialogTitle>
              <span className="text-[10px] font-mono uppercase text-muted-foreground">
                Code: {explainer.statusCode}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          {/* 1. Meaning */}
          <div className="p-3 rounded-lg bg-muted/40 border space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              What Does This Mean?
            </span>
            <p className="text-foreground text-xs leading-relaxed">
              {explainer.meaning}
            </p>
          </div>

          {/* 2. Who acts next */}
          <div className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              Who acts next:
            </span>
            <Badge variant="outline" className="text-xs font-semibold border-emerald-600/40 text-emerald-700">
              {explainer.whoActsNext}
            </Badge>
          </div>

          {/* 3. What happens after that */}
          <div className="p-3 rounded-lg border bg-card space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              What Happens After That?
            </span>
            <p className="text-xs text-foreground leading-relaxed">
              {explainer.whatHappensAfter}
            </p>
          </div>

          {/* 4. Possible Next Transitions */}
          {explainer.possibleNextStatuses.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Possible Next Statuses
              </span>
              <div className="flex flex-wrap gap-1.5">
                {explainer.possibleNextStatuses.map((st) => (
                  <Badge key={st} variant="secondary" className="text-[10px] font-mono">
                    {st}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 border-t pt-3">
          {explainer.recommendedAction ? (
            <Link href={explainer.recommendedAction.href} onClick={onClose}>
              <Button size="sm" className="text-xs">
                {explainer.recommendedAction.label}
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          ) : (
            <div />
          )}
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
