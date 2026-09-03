"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import type { FederationComplaintItem } from "../types";

interface ResolveComplaintDialogProps {
  complaint: FederationComplaintItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (resolutionNotes: string) => Promise<boolean>;
  isSubmitting: boolean;
}

export function ResolveComplaintDialog({
  complaint,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}: ResolveComplaintDialogProps) {
  const [resolutionNotes, setResolutionNotes] = React.useState<string>(
    "Dispute investigated and amicably resolved with the complainant. Corrective service guidelines issued to worker."
  );
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setResolutionNotes(
        "Dispute investigated and amicably resolved with the complainant. Corrective service guidelines issued to worker."
      );
      setError(null);
    }
  }, [isOpen]);

  if (!complaint) return null;

  const handleConfirm = async () => {
    if (!resolutionNotes.trim()) {
      setError("Please enter settlement resolution notes.");
      return;
    }
    await onConfirm(resolutionNotes.trim());
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center space-x-2 text-foreground">
          <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          <span>Resolve Complaint?</span>
        </div>
      }
      description="Mark this complaint as resolved after completing the required internal review."
      className="max-w-md"
    >
      <div className="space-y-4 text-xs">
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Complaint Number:</span>
            <span className="font-mono text-foreground font-semibold">
              {complaint.complaintNumber}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Complainant:</span>
            <span className="font-semibold text-foreground">{complaint.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Worker:</span>
            <span className="text-foreground">
              {complaint.workerName} ({complaint.workerId})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subject:</span>
            <span className="text-foreground truncate max-w-[200px]">{complaint.subject}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block font-medium text-foreground">
            Resolution Remarks / Settlement Summary <span className="text-destructive">*</span>
          </label>
          <Textarea
            rows={3}
            value={resolutionNotes}
            onChange={(e) => {
              setResolutionNotes(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Record the conciliation outcome, customer communication, or remedial actions taken..."
            className="text-xs"
          />
          {error && (
            <p className="text-[10px] text-destructive flex items-center space-x-1">
              <AlertCircle className="h-3 w-3" />
              <span>{error}</span>
            </p>
          )}
        </div>

        <div className="p-2.5 rounded bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start space-x-2">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>
            The complaint status will transition to <strong className="font-semibold">RESOLVED</strong>. The complaint history and settlement details will be preserved permanently.
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
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="text-xs bg-emerald-800 hover:bg-emerald-900 text-white"
          >
            {isSubmitting ? "Resolving..." : "Mark as Resolved"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
