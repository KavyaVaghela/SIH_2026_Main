"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Scale,
  User,
  Wrench,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import type { FederationComplaintItem } from "../types";

interface ComplaintDetailDialogProps {
  complaint: FederationComplaintItem | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (complaint: FederationComplaintItem) => void;
}

export function ComplaintDetailDialog({
  complaint,
  isOpen,
  onClose,
  onResolve,
}: ComplaintDetailDialogProps) {
  const [internalNote, setInternalNote] = React.useState<string>("");

  React.useEffect(() => {
    if (complaint) {
      setInternalNote(complaint.internalNotes || "");
    }
  }, [complaint]);

  if (!complaint) return null;

  const isPending = complaint.status === "PENDING";

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center space-x-2">
          <Scale className="h-5 w-5 text-rose-700 dark:text-rose-400" />
          <span>Grievance Arbitration Record — {complaint.complaintNumber}</span>
        </div>
      }
      description={`Filed on ${complaint.submittedDate} • Category: ${complaint.category}`}
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-4 text-xs">
        {/* Status Header */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-muted/20">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-medium">
              Dispute Status
            </span>
            <div className="flex items-center space-x-2 mt-0.5">
              {isPending ? (
                <Badge
                  variant="outline"
                  className="border-amber-500/40 text-amber-700 bg-amber-500/10 text-xs"
                >
                  <Clock className="h-3 w-3 mr-1" /> Pending Conciliation Review
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 text-emerald-700 bg-emerald-500/10 text-xs"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Resolved & Officially Settled
                </Badge>
              )}
            </div>
          </div>

          {complaint.bookingId && (
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground uppercase font-medium">
                Linked Service Order
              </span>
              <span className="font-mono text-xs text-foreground block">
                {complaint.bookingId}
              </span>
            </div>
          )}
        </div>

        {/* Customer & Worker Parties */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Customer */}
          <div className="p-3.5 rounded-lg border border-border/80 bg-card space-y-1.5">
            <div className="flex items-center space-x-1.5 font-semibold text-foreground border-b border-border/60 pb-1.5 text-xs">
              <User className="h-3.5 w-3.5 text-blue-700" />
              <span>Complainant Customer</span>
            </div>
            <div className="space-y-0.5 pt-1">
              <p className="font-semibold text-foreground text-xs">{complaint.customerName}</p>
              <span className="font-mono text-[11px] text-muted-foreground block">
                {complaint.customerPhone}
              </span>
              <span className="text-[10px] text-muted-foreground">Registered Citizen User</span>
            </div>
          </div>

          {/* Worker */}
          <div className="p-3.5 rounded-lg border border-border/80 bg-card space-y-1.5">
            <div className="flex items-center space-x-1.5 font-semibold text-foreground border-b border-border/60 pb-1.5 text-xs">
              <Wrench className="h-3.5 w-3.5 text-emerald-700" />
              <span>Assigned Federation Craftsman</span>
            </div>
            <div className="space-y-0.5 pt-1">
              <p className="font-semibold text-foreground text-xs">{complaint.workerName}</p>
              <span className="font-mono text-[11px] text-muted-foreground block">
                {complaint.workerProfession} • {complaint.workerId}
              </span>
              <span className="text-[10px] text-emerald-700 font-medium">Verified Active Member</span>
            </div>
          </div>
        </div>

        {/* Grievance Subject & Full Description */}
        <div className="p-3.5 rounded-lg border border-border/80 bg-card space-y-2">
          <div>
            <span className="text-muted-foreground text-[10px] uppercase font-medium">
              Subject of Grievance
            </span>
            <h4 className="font-semibold text-foreground text-sm mt-0.5">
              {complaint.subject}
            </h4>
          </div>

          <div className="pt-2 border-t border-border/60">
            <span className="text-muted-foreground text-[10px] uppercase font-medium">
              Full Statement of Facts
            </span>
            <p className="text-xs text-foreground leading-relaxed bg-muted/20 p-2.5 rounded border border-border/40 mt-1">
              {complaint.description}
            </p>
          </div>
        </div>

        {/* Resolution Settlement Details if resolved */}
        {!isPending && (
          <div className="p-3.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-1.5 text-emerald-900 dark:text-emerald-300">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs flex items-center space-x-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Conciliation & Settlement Agreement</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                Settled on: {complaint.resolvedAt}
              </span>
            </div>
            <p className="text-xs leading-relaxed bg-card/60 p-2.5 rounded border border-emerald-500/20 text-foreground">
              {complaint.resolutionNotes || "Dispute was conciliated and closed."}
            </p>
            {complaint.resolvedBy && (
              <span className="text-[10px] text-muted-foreground block">
                Arbitrated by: {complaint.resolvedBy}
              </span>
            )}
          </div>
        )}

        {/* Internal Action / Note area for Federation Admin review */}
        {isPending && (
          <div className="p-3.5 rounded-lg border border-border/80 bg-muted/20 space-y-2">
            <div className="flex items-center space-x-1.5 font-semibold text-foreground text-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-700" />
              <span>Federation Conciliation Notes (Internal Review)</span>
            </div>
            <Textarea
              rows={2}
              placeholder="Record preliminary phone verification, technician briefing, or warranty conciliation steps..."
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              className="text-xs"
            />
            <span className="text-[10px] text-muted-foreground block">
              Internal notes assist the federation disciplinary committee before finalizing official settlement.
            </span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-2 border-t border-border flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>

          {isPending && (
            <Button
              size="sm"
              onClick={() => {
                onClose();
                onResolve(complaint);
              }}
              className="text-xs bg-emerald-800 hover:bg-emerald-900 text-white"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Mark Complaint as Resolved
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
