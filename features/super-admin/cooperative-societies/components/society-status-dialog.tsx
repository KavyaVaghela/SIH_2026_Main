"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import type { SocietyListItem, SocietyStatus } from "../types";

interface SocietyStatusDialogProps {
  target: {
    society: SocietyListItem;
    targetStatus: SocietyStatus;
  } | null;
  onClose: () => void;
  onConfirm: (id: string, newStatus: SocietyStatus) => Promise<boolean>;
  isSubmitting: boolean;
}

export function SocietyStatusDialog({
  target,
  onClose,
  onConfirm,
  isSubmitting,
}: SocietyStatusDialogProps) {
  if (!target) return null;

  const { society, targetStatus } = target;
  const isActivating = targetStatus === "ACTIVE";

  return (
    <Dialog
      isOpen={!!target}
      onClose={onClose}
      title={
        <div className="flex items-center space-x-2 text-foreground">
          {isActivating ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-600" />
          )}
          <span>
            {isActivating ? "Approve & Activate Society" : "Suspend Cooperative Society"}
          </span>
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
              enable market governance operations.
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
          <p className="text-muted-foreground">Registered Workers: {society.totalWorkers}</p>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting} className="h-8 text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            isLoading={isSubmitting}
            onClick={() => onConfirm(society.id, targetStatus)}
            className={`h-8 text-xs font-semibold ${
              isActivating
                ? "bg-emerald-800 hover:bg-emerald-900 text-white"
                : "bg-rose-700 hover:bg-rose-800 text-white"
            }`}
          >
            {isActivating ? "Confirm Activation" : "Confirm Suspension"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
