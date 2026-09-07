"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserX, AlertTriangle } from "lucide-react";
import type { ManagedWorkerItem } from "../types";

interface DeactivateWorkerDialogProps {
  worker: ManagedWorkerItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  isSubmitting: boolean;
}

export function DeactivateWorkerDialog({
  worker,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}: DeactivateWorkerDialogProps) {
  if (!worker) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center space-x-2 text-destructive">
          <UserX className="h-5 w-5" />
          <span>Deactivate Worker?</span>
        </div>
      }
      description="This will deactivate the worker's account. Worker availability is a separate status."
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
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">ACTIVE</span>
          </div>
        </div>

        <div className="p-2.5 rounded bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-[11px] text-rose-800 dark:text-rose-300 flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
          <span>
            Deactivation suspends the worker's active credential in the federation roster. Their account status transitions to <strong className="font-semibold">DEACTIVATED</strong>.
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
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="text-xs"
          >
            {isSubmitting ? "Deactivating..." : "Deactivate Worker"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
