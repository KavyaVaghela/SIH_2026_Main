"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WorkerAssistanceItem, AssistanceStatus } from "../types";

export interface AssistanceDetailsModalProps {
  request: WorkerAssistanceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: AssistanceStatus) => void;
}

export function AssistanceDetailsModal({
  request,
  isOpen,
  onClose,
  onStatusChange,
}: AssistanceDetailsModalProps) {
  if (!request) return null;

  const handleAction = (status: AssistanceStatus) => {
    onStatusChange(request.id, status);
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="max-h-[85vh] overflow-y-auto p-1">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-lg font-bold text-foreground">
              Worker Assistance Request
            </DialogTitle>
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300"
            >
              {request.status}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Request ID: <span className="font-semibold text-foreground">{request.requestId || request.id}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 my-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 rounded-lg border border-border/60 bg-muted/40">
              <span className="text-[11px] text-muted-foreground block">Worker Name:</span>
              <span className="font-bold text-foreground text-sm">{request.workerName}</span>
            </div>
            <div className="p-2.5 rounded-lg border border-border/60 bg-muted/40">
              <span className="text-[11px] text-muted-foreground block">Federation:</span>
              <span className="font-bold text-foreground text-sm">{request.federationName}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 rounded-lg border border-border/60">
              <span className="text-[11px] text-muted-foreground block">Request Type:</span>
              <span className="font-semibold text-foreground">{request.requestType}</span>
            </div>
            <div className="p-2.5 rounded-lg border border-border/60">
              <span className="text-[11px] text-muted-foreground block">Submitted:</span>
              <span className="font-semibold text-foreground">{request.submittedAt}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border border-border/60">
            <span className="font-semibold text-foreground block mb-1">Description & Issue Details:</span>
            <p className="text-muted-foreground leading-relaxed">
              {request.description || "Craftsman requires financial and administrative welfare assistance."}
            </p>
          </div>

          {request.assignedReviewer && (
            <div className="p-2.5 rounded-lg border border-border/60">
              <span className="text-[11px] text-muted-foreground block">Assigned Reviewer:</span>
              <span className="font-semibold text-foreground">{request.assignedReviewer}</span>
            </div>
          )}

          {request.resolutionNotes && (
            <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/50">
              <span className="text-[11px] text-emerald-800 dark:text-emerald-400 font-bold block mb-0.5">
                Resolution Notes:
              </span>
              <p className="text-emerald-900 dark:text-emerald-300">{request.resolutionNotes}</p>
            </div>
          )}

          <div className="pt-2">
            <span className="font-bold text-foreground block mb-2">Update Request Status:</span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleAction("Approved")}
                className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction("Under Review")}
                className="text-xs h-8 border-blue-500 text-blue-700 hover:bg-blue-50"
              >
                Under Review
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction("Resolved")}
                className="text-xs h-8 border-purple-500 text-purple-700 hover:bg-purple-50"
              >
                Resolve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleAction("Rejected")}
                className="text-xs h-8 ml-auto"
              >
                Reject
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8">
              Close
            </Button>
          </DialogFooter>
        </div>
      </div>
    </Dialog>
  );
}
