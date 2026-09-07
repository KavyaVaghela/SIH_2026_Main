"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import type { PendingConfirmation } from "../types";

interface SettingConfirmationDialogProps {
  confirmation: PendingConfirmation | null;
  onConfirm: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function SettingConfirmationDialog({
  confirmation,
  onConfirm,
  onCancel,
  isSaving,
}: SettingConfirmationDialogProps) {
  if (!confirmation) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0">
      <div className="bg-card w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">{confirmation.title}</h3>
              <p className="text-xs text-muted-foreground">Broad-Impact Platform Setting</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            disabled={isSaving}
            className="h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cancel</span>
          </Button>
        </div>

        <div className="space-y-2 text-xs leading-relaxed text-foreground">
          <p>{confirmation.description}</p>
          <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200">
            <span className="font-bold block mb-0.5">Impact Summary:</span>
            {confirmation.consequenceText}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSaving}
            className="text-xs"
          >
            Keep Active
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isSaving}
            className="text-xs font-semibold"
          >
            {isSaving ? "Updating Platform..." : "Confirm & Pause Setting"}
          </Button>
        </div>
      </div>
    </div>
  );
}
