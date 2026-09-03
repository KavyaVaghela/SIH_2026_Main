"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import type { WorkerChangeRequestItem } from "../types";

interface ApproveChangeRequestDialogProps {
  request: WorkerChangeRequestItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  isSubmitting: boolean;
}

export function ApproveChangeRequestDialog({
  request,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}: ApproveChangeRequestDialogProps) {
  if (!request) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center space-x-2 text-foreground">
          <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          <span>Approve Information Change?</span>
        </div>
      }
      description="The approved values will become the worker's current verified information."
      className="max-w-md"
    >
      <div className="space-y-4 text-xs">
        <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-2">
          <div className="flex justify-between py-1 border-b border-border/60">
            <span className="text-muted-foreground">Worker Member:</span>
            <span className="font-semibold text-foreground">{request.workerName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/60">
            <span className="text-muted-foreground">Worker ID:</span>
            <span className="font-mono text-foreground">{request.workerId}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/60">
            <span className="text-muted-foreground">Target Field:</span>
            <span className="font-medium text-foreground">{request.field}</span>
          </div>
          <div className="py-1">
            <span className="text-muted-foreground block mb-1">Proposed Modification:</span>
            <div className="flex items-center space-x-1.5 p-2 rounded bg-card border border-border/60">
              <span className="text-muted-foreground line-through">{request.currentValue}</span>
              <ArrowRight className="h-3 w-3 text-emerald-600 shrink-0" />
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                {request.requestedValue}
              </span>
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start space-x-2">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>
            Upon approval, the canonical worker record is updated in the federation database and will be reflected immediately in Worker Information.
          </span>
        </div>

        <div className="flex justify-end space-x-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="text-xs bg-emerald-800 hover:bg-emerald-900 text-white"
          >
            {isSubmitting ? "Approving..." : "Approve Change"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
