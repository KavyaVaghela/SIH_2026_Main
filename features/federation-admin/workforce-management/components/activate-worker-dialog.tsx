"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserCheck, ShieldCheck } from "lucide-react";
import type { ManagedWorkerItem } from "../types";

interface ActivateWorkerDialogProps {
  worker: ManagedWorkerItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  isSubmitting: boolean;
}

export function ActivateWorkerDialog({
  worker,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}: ActivateWorkerDialogProps) {
  if (!worker) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center space-x-2 text-foreground">
          <UserCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          <span>Activate Worker?</span>
        </div>
      }
      description="This will reactivate the worker's account."
      className="max-w-md"
    >
      <div className="space-y-4 text-xs">
        <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-2">
          <div className="flex justify-between py-1 border-b border-border/60">
            <span className="text-muted-foreground">Worker Name:</span>
            <span className="font-semibold text-foreground">{worker.fullName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/60">
            <span className="text-muted-foreground">Worker ID:</span>
            <span className="font-mono text-foreground">{worker.id}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/60">
            <span className="text-muted-foreground">Profession:</span>
            <span className="text-foreground">{worker.profession}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Current Status:</span>
            <span className="font-semibold text-rose-700 dark:text-rose-400">DEACTIVATED</span>
          </div>
        </div>

        <div className="p-2.5 rounded bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start space-x-2">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>
            Upon reactivation, this worker's account status transitions to <strong className="font-semibold">ACTIVE</strong>. Their operational dispatch availability remains governed separately.
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
            {isSubmitting ? "Activating..." : "Activate Worker"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
