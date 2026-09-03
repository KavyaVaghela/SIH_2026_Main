"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileEdit,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  ShieldCheck,
  ArrowRight,
  FileText,
  AlertCircle,
} from "lucide-react";
import type { WorkerChangeRequestItem } from "../types";

interface WorkerChangeRequestDetailDialogProps {
  request: WorkerChangeRequestItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (req: WorkerChangeRequestItem) => void;
  onReject: (req: WorkerChangeRequestItem) => void;
}

export function WorkerChangeRequestDetailDialog({
  request,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: WorkerChangeRequestDetailDialogProps) {
  if (!request) return null;

  const isPending = request.status === "PENDING";

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center space-x-2">
          <FileEdit className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          <span>Review Information Change — {request.id}</span>
        </div>
      }
      description={`Submitted on ${request.submittedDate} by ${request.workerName} (${request.workerId})`}
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-4 text-xs">
        {/* Status Header Bar */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-muted/20">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-medium">
              Review Status
            </span>
            <div className="flex items-center space-x-2 mt-0.5">
              {request.status === "PENDING" && (
                <Badge variant="outline" className="border-amber-500/40 text-amber-700 bg-amber-500/10">
                  <Clock className="h-3 w-3 mr-1" /> Pending Federation Review
                </Badge>
              )}
              {request.status === "APPROVED" && (
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 bg-emerald-500/10">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Approved & Applied to Canonical Roster
                </Badge>
              )}
              {request.status === "REJECTED" && (
                <Badge variant="outline" className="border-rose-500/40 text-rose-700 bg-rose-500/10">
                  <XCircle className="h-3 w-3 mr-1" /> Rejected (Canonical Information Unchanged)
                </Badge>
              )}
            </div>
          </div>

          {request.reviewedAt && (
            <span className="text-[11px] text-muted-foreground font-mono">
              Decided on: {request.reviewedAt}
            </span>
          )}
        </div>

        {/* Rejection Notice if rejected */}
        {request.status === "REJECTED" && request.rejectionReason && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 space-y-1">
            <span className="font-semibold text-[11px]">Recorded Rejection Reason:</span>
            <p className="text-xs">{request.rejectionReason}</p>
          </div>
        )}

        {/* CONTRAST: CURRENT INFORMATION VS REQUESTED INFORMATION (SECTION 14) */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-foreground flex items-center space-x-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Target Field Comparison: {request.field}</span>
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Current Information */}
            <div className="p-3.5 rounded-lg border border-border/80 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                <span className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">
                  Current Canonical Value
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">Active</span>
              </div>
              <div className="p-2 rounded bg-card border border-border/60 min-h-[50px] flex items-center">
                <p className="font-medium text-foreground text-xs leading-relaxed">
                  {request.currentValue}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground block">
                Currently displayed in Worker Information
              </span>
            </div>

            {/* Requested Information */}
            <div className="p-3.5 rounded-lg border-2 border-emerald-600/40 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-2">
              <div className="flex items-center justify-between border-b border-emerald-600/30 pb-1.5">
                <span className="font-semibold text-emerald-800 dark:text-emerald-300 text-[11px] uppercase tracking-wider">
                  Proposed Verified Value
                </span>
                <Badge variant="outline" className="border-emerald-600/40 text-emerald-700 text-[9px] px-1.5 py-0 h-4">
                  Proposed
                </Badge>
              </div>
              <div className="p-2 rounded bg-card border border-emerald-600/30 min-h-[50px] flex items-center">
                <p className="font-semibold text-foreground text-xs leading-relaxed">
                  {request.requestedValue}
                </p>
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block">
                Becomes canonical only if approved
              </span>
            </div>
          </div>
        </div>

        {/* Justification Reason */}
        <div className="p-3.5 rounded-lg border border-border/80 bg-card space-y-1.5">
          <span className="font-semibold text-foreground text-xs">Worker Justification / Reason:</span>
          <p className="text-xs text-muted-foreground leading-relaxed bg-muted/20 p-2.5 rounded border border-border/40">
            {request.reason}
          </p>
        </div>

        {/* Supporting Evidence Document */}
        {request.supportingDocument && (
          <div className="p-3.5 rounded-lg border border-border/80 bg-card space-y-2">
            <span className="font-semibold text-foreground text-xs">Supporting Evidence Document:</span>
            <div className="p-2.5 rounded border border-border/60 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-semibold text-foreground block text-xs">
                    {request.supportingDocument.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {request.supportingDocument.category} • {request.supportingDocument.fileType} (
                    {request.supportingDocument.fileSize || "1.5 MB"})
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  alert(`Previewing supporting credential: ${request.supportingDocument?.name}`)
                }
                className="h-7 text-xs border-border text-emerald-800 dark:text-emerald-300"
              >
                <Download className="h-3 w-3 mr-1" />
                Preview Document
              </Button>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-2 border-t border-border flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>

          {isPending && (
            <div className="flex items-center space-x-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onClose();
                  onReject(request);
                }}
                className="text-xs"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Reject Change
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  onApprove(request);
                }}
                className="text-xs bg-emerald-800 hover:bg-emerald-900 text-white"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Approve Change
              </Button>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
