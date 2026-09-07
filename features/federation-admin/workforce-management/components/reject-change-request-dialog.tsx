"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { XCircle, AlertTriangle } from "lucide-react";
import type { WorkerChangeRequestItem } from "../types";

interface RejectChangeRequestDialogProps {
  request: WorkerChangeRequestItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<boolean>;
  isSubmitting: boolean;
}

export function RejectChangeRequestDialog({
  request,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}: RejectChangeRequestDialogProps) {
  const [reason, setReason] = React.useState<string>(
    "Submitted credentials or supporting evidence insufficient to authorize official information update."
  );
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setReason(
        "Submitted credentials or supporting evidence insufficient to authorize official information update."
      );
      setError(null);
    }
  }, [isOpen]);

  if (!request) return null;

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for rejecting this change request.");
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
          <span>Reject Information Change?</span>
        </div>
      }
      description="The change request will be rejected. Canonical worker information will remain strictly unmodified."
      className="max-w-md"
    >
      <div className="space-y-4 text-xs">
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Worker:</span>
            <span className="font-semibold text-foreground">{request.workerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Field:</span>
            <span className="text-foreground">{request.field}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block font-medium text-foreground">
            Rejection Reason / Statutory Remark <span className="text-destructive">*</span>
          </label>
          <Textarea
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="State why the requested modification cannot be approved..."
            className="text-xs"
          />
          {error && <p className="text-[10px] text-destructive">{error}</p>}
        </div>

        <div className="p-2.5 rounded bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-[11px] text-rose-800 dark:text-rose-300 flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
          <span>
            The canonical worker record retains its current value ({request.currentValue}). No alterations will be made to active database records.
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
            {isSubmitting ? "Rejecting..." : "Reject Change"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
