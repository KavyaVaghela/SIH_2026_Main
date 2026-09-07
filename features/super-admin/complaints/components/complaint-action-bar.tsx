"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Clock,
  Send,
  AlertTriangle,
  FileCheck,
  ShieldAlert,
} from "lucide-react";
import type { ComplaintStatus } from "../types";

interface ComplaintActionBarProps {
  status: ComplaintStatus;
  assignedTo: string | null;
  onStartReview: () => Promise<void>;
  onMarkResolved: (notes: string) => Promise<void>;
  onAssignToFederation: (assignee: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function ComplaintActionBar({
  status,
  assignedTo,
  onStartReview,
  onMarkResolved,
  onAssignToFederation,
  isSubmitting,
}: ComplaintActionBarProps) {
  const [isResolveModalOpen, setIsResolveModalOpen] = React.useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = React.useState(false);
  const [resolutionText, setResolutionText] = React.useState("");
  const [assigneeText, setAssigneeText] = React.useState(
    assignedTo || "Cooperative Federation Grievance Cell"
  );

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionText.trim()) return;
    await onMarkResolved(resolutionText.trim());
    setIsResolveModalOpen(false);
    setResolutionText("");
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigneeText.trim()) return;
    await onAssignToFederation(assigneeText.trim());
    setIsAssignModalOpen(false);
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <FileCheck className="h-4 w-4 text-emerald-700" />
            <span>Administrative Workflow Actions</span>
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            Lifecycle: <span className="font-semibold text-foreground">Open → In Review → Resolved</span>
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 flex flex-wrap items-center gap-3">
        {/* Action: Start Review if OPEN */}
        {status === "OPEN" && (
          <Button
            variant="outline"
            size="sm"
            onClick={onStartReview}
            disabled={isSubmitting}
            className="border-sky-300 text-sky-900 dark:text-sky-200 hover:bg-sky-50 dark:hover:bg-sky-950 font-semibold text-xs"
          >
            <Clock className="h-3.5 w-3.5 mr-1.5 text-sky-600" />
            Start Administrative Review
          </Button>
        )}

        {/* Action: Assign / Escalate */}
        {status !== "RESOLVED" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAssignModalOpen(true)}
            disabled={isSubmitting}
            className="text-xs font-semibold"
          >
            <Send className="h-3.5 w-3.5 mr-1.5 text-emerald-700" />
            {assignedTo ? "Re-assign / Escalate" : "Assign to Federation"}
          </Button>
        )}

        {/* Action: Resolve Complaint */}
        {status !== "RESOLVED" ? (
          <Button
            size="sm"
            onClick={() => setIsResolveModalOpen(true)}
            disabled={isSubmitting}
            className="bg-emerald-800 text-white hover:bg-emerald-900 font-semibold text-xs ml-auto shadow-xs"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Mark Case as Resolved
          </Button>
        ) : (
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800 ml-auto">
            <CheckCircle2 className="h-4 w-4" />
            <span>Case Formally Resolved & Closed</span>
          </div>
        )}
      </CardContent>

      {/* Confirmation Modal: Resolve Complaint */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0">
          <div className="bg-card w-full max-w-lg rounded-2xl border shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Confirm Complaint Resolution</h3>
                <p className="text-xs text-muted-foreground">
                  Provide administrative resolution notes explaining the settlement or outcome.
                </p>
              </div>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Formal Resolution Statement *
                </label>
                <textarea
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Detail the agreed settlement, customer restitution, re-servicing outcome, or disciplinary action..."
                  className="w-full h-28 text-xs p-3 rounded-lg border bg-background text-foreground resize-none focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsResolveModalOpen(false)}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !resolutionText.trim()}
                  className="bg-emerald-800 text-white hover:bg-emerald-900 text-xs font-semibold"
                >
                  Confirm & Close Ticket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign / Escalate */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0">
          <div className="bg-card w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Assign / Escalate Dispute</h3>
                <p className="text-xs text-muted-foreground">
                  Designate a cooperative federation officer or safety supervisor.
                </p>
              </div>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Assignee Authority / Body *
                </label>
                <input
                  type="text"
                  value={assigneeText}
                  onChange={(e) => setAssigneeText(e.target.value)}
                  placeholder="e.g. Mumbai Central Federation Secretary"
                  className="w-full h-9 text-xs px-3 rounded-lg border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAssignModalOpen(false)}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !assigneeText.trim()}
                  className="bg-emerald-800 text-white hover:bg-emerald-900 text-xs font-semibold"
                >
                  Save Assignment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}
