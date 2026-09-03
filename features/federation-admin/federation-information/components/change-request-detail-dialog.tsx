"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  ShieldCheck,
  AlertCircle,
  FileCheck2,
} from "lucide-react";
import type { FederationChangeRequest } from "../types";

interface ChangeRequestDetailDialogProps {
  request: FederationChangeRequest | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ChangeRequestDetailDialog({
  request,
  isOpen,
  onClose,
}: ChangeRequestDetailDialogProps) {
  if (!request) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Pending determination";
    try {
      return new Date(dateString).toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const renderStatusBanner = () => {
    switch (request.status) {
      case "PENDING":
        return (
          <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 flex items-start space-x-2.5">
            <Clock className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <div className="space-y-0.5">
              <p className="font-semibold">Audit Review in Progress</p>
              <p className="text-[11px] leading-relaxed">
                This modification request has been logged in the Super Admin governance queue. The canonical federation data will remain unchanged until ratified.
              </p>
            </div>
          </div>
        );
      case "APPROVED":
        return (
          <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/40 p-3 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 flex items-start space-x-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
            <div className="space-y-0.5">
              <p className="font-semibold">Change Approved by Super Admin Directorate</p>
              <p className="text-[11px] leading-relaxed">
                The requested amendment has cleared statutory compliance verification and is ratified in the official database records.
              </p>
            </div>
          </div>
        );
      case "REJECTED":
        return (
          <div className="rounded-md bg-rose-50 dark:bg-rose-950/40 p-3 border border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300 flex items-start space-x-2.5">
            <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="space-y-0.5">
              <p className="font-semibold">Change Request Not Ratified</p>
              <p className="text-[11px] leading-relaxed">
                The Super Admin audit determined this modification cannot be approved in its current form. Please review the statutory rationale below.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center space-x-2 text-foreground">
          <FileText className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          <span>Change Request Audit Record — {request.id}</span>
        </div>
      }
      description={`Submission audit log for statutory field "${request.fieldLabel}"`}
      className="max-w-xl"
    >
      <div className="space-y-4 text-xs">
        {/* Status banner */}
        {renderStatusBanner()}

        {/* Values comparison */}
        <div className="rounded-lg border border-border bg-card p-3.5 space-y-3">
          <div className="flex justify-between items-center py-1 border-b border-border/60">
            <span className="text-muted-foreground">Target Field / Section:</span>
            <span className="font-semibold text-foreground">{request.fieldLabel}</span>
          </div>

          <div className="space-y-1 py-1 border-b border-border/60">
            <span className="text-muted-foreground text-[11px] block">
              Official Value at Time of Request:
            </span>
            <div className="p-2 rounded bg-muted/40 font-mono text-muted-foreground line-through break-all">
              {request.currentValue}
            </div>
          </div>

          <div className="space-y-1 py-1 border-b border-border/60">
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px] block">
              Requested Modification:
            </span>
            <div className="p-2 rounded bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-500/20 font-mono text-foreground font-medium break-all">
              {request.requestedValue}
            </div>
          </div>

          <div className="space-y-1 py-1">
            <span className="text-muted-foreground text-[11px] block">Administrative Rationale:</span>
            <p className="p-2.5 rounded bg-muted/30 text-foreground italic leading-relaxed border border-border/40">
              "{request.reason}"
            </p>
          </div>

          {request.supportingDocumentNote && (
            <div className="space-y-1 pt-1 border-t border-border/60">
              <span className="text-muted-foreground text-[11px] block">Supporting Reference:</span>
              <p className="p-2 rounded bg-muted/30 text-foreground font-medium">
                {request.supportingDocumentNote}
              </p>
            </div>
          )}
        </div>

        {/* Audit & Lifecycle Trail */}
        <div className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-2">
          <h4 className="font-semibold text-foreground text-xs flex items-center space-x-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Audit & Verification Timeline</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="p-2 rounded bg-card border border-border/60">
              <span className="text-muted-foreground block text-[10px]">Submitted By</span>
              <span className="font-medium text-foreground">{request.submittedBy}</span>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {formatDate(request.submittedAt)}
              </div>
            </div>

            <div className="p-2 rounded bg-card border border-border/60">
              <span className="text-muted-foreground block text-[10px]">Super Admin Reviewer</span>
              <span className="font-medium text-foreground">
                {request.reviewedBy || "Super Admin Directorate"}
              </span>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {formatDate(request.reviewedAt)}
              </div>
            </div>
          </div>

          {/* Rejection reason (if rejected) */}
          {request.status === "REJECTED" && request.rejectionReason && (
            <div className="p-3 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300 space-y-1">
              <span className="font-semibold block text-[11px] flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" />
                <span>Super Admin Audit Determination / Rejection Grounds:</span>
              </span>
              <p className="text-xs leading-relaxed italic">
                "{request.rejectionReason}"
              </p>
            </div>
          )}

          {/* Reviewer notes (if approved or general) */}
          {request.reviewerNotes && request.status !== "REJECTED" && (
            <div className="p-2.5 rounded bg-muted/40 border border-border/60 text-muted-foreground space-y-0.5">
              <span className="font-semibold text-foreground block text-[10px]">Reviewer Verification Notes:</span>
              <p className="text-xs italic leading-relaxed">{request.reviewerNotes}</p>
            </div>
          )}
        </div>

        {/* Non-self-approval notice */}
        <div className="p-2.5 rounded border border-border/60 text-[11px] text-muted-foreground text-center">
          Federation Admins cannot approve or modify their own submissions. Determinative audit authority resides solely with the Super Admin Directorate.
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close Audit Log
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
