"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { SocietyListItem, SocietyStatus } from "../types";

interface SocietyStatusDialogProps {
  target: {
    society: SocietyListItem;
    targetStatus: SocietyStatus;
  } | null;
  onClose: () => void;
  onConfirm: (id: string, newStatus: SocietyStatus, rejectionReason?: string) => Promise<boolean>;
  isSubmitting: boolean;
}

export function SocietyStatusDialog({
  target,
  onClose,
  onConfirm,
  isSubmitting,
}: SocietyStatusDialogProps) {
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    setReason("");
  }, [target]);

  if (!target) return null;

  const { society, targetStatus } = target;
  const isActivating = targetStatus === "ACTIVE";
  const isRejecting = targetStatus === "REJECTED";

  const getTitle = () => {
    if (isActivating) return "Approve & Activate Society";
    if (isRejecting) return "Reject Cooperative Society Application";
    return "Suspend Cooperative Society";
  };

  const getIcon = () => {
    if (isActivating) return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
    if (isRejecting) return <XCircle className="h-5 w-5 text-rose-600" />;
    return <AlertTriangle className="h-5 w-5 text-amber-600" />;
  };

  const getButtonText = () => {
    if (isActivating) return "Confirm Activation";
    if (isRejecting) return "Confirm Rejection";
    return "Confirm Suspension";
  };

  const getButtonClass = () => {
    if (isActivating) return "bg-emerald-800 hover:bg-emerald-900 text-white";
    return "bg-rose-700 hover:bg-rose-800 text-white";
  };

  return (
    <Dialog
      isOpen={!!target}
      onClose={onClose}
      title={
        <div className="flex items-center space-x-2 text-foreground">
          {getIcon()}
          <span>{getTitle()}</span>
        </div>
      }
      description="Super Admin Administrative Confirmation"
    >
      <div className="space-y-4 pt-1">
        <div
          className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
            isActivating
              ? "bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-200"
              : "bg-rose-50/70 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-200"
          }`}
        >
          {isActivating ? (
            <p>
              Are you sure you want to approve and activate{" "}
              <strong className="font-bold">{society.name}</strong> ({society.code})? This will grant
              the society active status, allow its assigned workers to receive live booking dispatches, and
              enable its administrator to access the Federation Admin Portal.
            </p>
          ) : isRejecting ? (
            <p>
              Are you sure you want to reject the application for{" "}
              <strong className="font-bold">{society.name}</strong> ({society.code})? The society and its
              admin profile will be marked as rejected and excluded from active society operations.
            </p>
          ) : (
            <p>
              Are you sure you want to suspend{" "}
              <strong className="font-bold">{society.name}</strong> ({society.code})? Suspending a society
              temporarily pauses new dispatch allocations for its worker pool until compliance review is resolved.
            </p>
          )}
        </div>

        <div className="text-xs space-y-1 bg-muted p-3 rounded-md">
          <p className="font-semibold text-foreground">Society Details:</p>
          <p className="text-muted-foreground">Location: {society.location}</p>
          <p className="text-muted-foreground">Admin Secretary: {society.adminName} ({society.contactPhone})</p>
          <p className="text-muted-foreground">Contact Email: {society.contactEmail}</p>
          <p className="text-muted-foreground">Registered Workers: {society.totalWorkers}</p>
        </div>

        {isRejecting && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Reason for Rejection (Visible to Federation Admin upon login)
            </label>
            <Textarea
              placeholder="Enter reason for rejection (e.g., Incomplete regulatory documents, invalid registration number)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs min-h-[75px]"
            />
          </div>
        )}

        <div className="flex items-center justify-end space-x-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting} className="h-8 text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            isLoading={isSubmitting}
            onClick={() => onConfirm(society.id, targetStatus, reason)}
            className={`h-8 text-xs font-semibold ${getButtonClass()}`}
          >
            {getButtonText()}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
