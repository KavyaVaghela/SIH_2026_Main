"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import type { WorkerApplicationItem } from "../types";

interface AcceptApplicationDialogProps {
  application: WorkerApplicationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  isSubmitting: boolean;
}

export function AcceptApplicationDialog({
  application,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}: AcceptApplicationDialogProps) {
  if (!application) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center space-x-2 text-foreground">
          <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          <span>Accept Worker Application?</span>
        </div>
      }
      description="This will accept the worker application and add the worker according to the existing worker registration workflow."
      className="max-w-md"
    >
      <div className="space-y-4 text-xs">
        <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-2">
          <div className="flex justify-between py-1 border-b border-border/60">
            <span className="text-muted-foreground">Applicant Name:</span>
            <span className="font-semibold text-foreground">{application.applicantName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/60">
            <span className="text-muted-foreground">Application ID:</span>
            <span className="font-mono text-foreground">{application.id}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/60">
            <span className="text-muted-foreground">Trade Specialty:</span>
            <span className="text-foreground">{application.profession}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Hourly Tariff:</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              ₹{application.hourlyRate}/hr
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start space-x-2">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>
            Upon acceptance, this applicant is inducted into the active federation roster with an assigned Worker ID and <strong className="font-semibold">ACTIVE</strong> account status.
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
            {isSubmitting ? "Accepting..." : "Accept Application"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
