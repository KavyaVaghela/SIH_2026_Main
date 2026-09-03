"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { XCircle, AlertTriangle } from "lucide-react";
import type { WorkerApplicationItem } from "../types";

interface RejectApplicationDialogProps {
  application: WorkerApplicationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<boolean>;
  isSubmitting: boolean;
}

export function RejectApplicationDialog({
  application,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}: RejectApplicationDialogProps) {
  const [reason, setReason] = React.useState<string>(
    "Application does not currently meet federation verification requirements."
  );
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setReason("Application does not currently meet federation verification requirements.");
      setError(null);
    }
  }, [isOpen]);

  if (!application) return null;

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for rejecting this application.");
      return;
    }
    await onConfirm(reason.trim());
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center space-x-2 text-destructive">
          <XCircle className="h-5 w-5" />
          <span>Reject Worker Application?</span>
        </div>
      }
      description="The application will be marked as rejected. Historical application records are preserved."
      className="max-w-md"
    >
      <div className="space-y-4 text-xs">
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Applicant:</span>
            <span className="font-semibold text-foreground">{application.applicantName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Trade:</span>
            <span className="text-foreground">{application.profession}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block font-medium text-foreground">
            Rejection Reason / Verification Note <span className="text-destructive">*</span>
          </label>
          <Textarea
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Explain why the application cannot be approved at this time..."
            className="text-xs"
          />
          {error && <p className="text-[10px] text-destructive">{error}</p>}
        </div>

        <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-300 flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
          <span>
            This action will not create a worker record. The decision and reason will be archived for statutory cooperative record-keeping.
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
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="text-xs"
          >
            {isSubmitting ? "Rejecting..." : "Reject Application"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
