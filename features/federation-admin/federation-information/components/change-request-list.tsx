"use client";

import * as React from "react";
import {
  FileClock,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  FileEdit,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FederationChangeRequest, ChangeRequestStatus } from "../types";

interface ChangeRequestListProps {
  requests: FederationChangeRequest[];
  onViewDetails: (request: FederationChangeRequest) => void;
  onRequestChange: () => void;
}

export function ChangeRequestList({
  requests,
  onViewDetails,
  onRequestChange,
}: ChangeRequestListProps) {
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = requests.filter((r) => r.status === "REJECTED").length;

  const getStatusBadge = (status: ChangeRequestStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="border-amber-500/40 text-amber-800 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/30 text-[11px] font-medium flex items-center space-x-1"
          >
            <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            <span>Pending Audit</span>
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/40 text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 text-[11px] font-medium flex items-center space-x-1"
          >
            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span>Approved by Super Admin</span>
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="outline"
            className="border-rose-500/40 text-rose-800 dark:text-rose-300 bg-rose-50/50 dark:bg-rose-950/30 text-[11px] font-medium flex items-center space-x-1"
          >
            <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
            <span>Rejected</span>
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
              <FileClock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle className="text-base font-semibold text-foreground">
                  Information Change Requests
                </CardTitle>
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300">
                    {pendingCount} Pending Review
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Audit trail of submitted modification proposals dispatched to Main/Super Admin governance
              </CardDescription>
            </div>
          </div>

          {/* Status summary counts */}
          <div className="flex items-center space-x-2 text-[11px] self-start sm:self-auto">
            <span className="px-2 py-0.5 rounded bg-muted font-medium text-muted-foreground">
              Total: {requests.length}
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 font-medium">
              Pending: {pendingCount}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium">
              Approved: {approvedCount}
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-800 dark:text-rose-300 font-medium">
              Rejected: {rejectedCount}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {/* Statutory governance reminder */}
        <div className="rounded-md bg-muted/40 p-3 border border-border/60 text-xs text-muted-foreground flex items-start space-x-2 leading-relaxed">
          <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong className="font-semibold text-foreground">Approval Protocol:</strong> Federation Admins cannot approve or reject their own change requests. While a request remains <span className="font-medium text-amber-700 dark:text-amber-300">Pending</span>, the official canonical federation data remains unchanged.
          </span>
        </div>

        {requests.length === 0 ? (
          // Empty state
          <div className="text-center py-10 px-4 border border-dashed border-border/80 rounded-lg bg-muted/20 space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FolderOpen className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">
              No Change Requests Submitted
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              All official federation records match current state registration. If you need to modify contact information or jurisdictional boundaries, submit a request.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onRequestChange}
              className="text-xs text-emerald-800 dark:text-emerald-300"
            >
              <FileEdit className="h-3.5 w-3.5 mr-1.5" />
              Request First Change
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-lg border border-border/70 bg-card hover:bg-muted/15 transition-all space-y-3 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {req.id}
                    </span>
                    <span className="text-muted-foreground text-xs">•</span>
                    <span className="text-xs font-semibold text-foreground">
                      {req.fieldLabel}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-muted-foreground">
                      Submitted: {formatDate(req.submittedAt)}
                    </span>
                    {getStatusBadge(req.status)}
                  </div>
                </div>

                {/* Values comparison block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded bg-muted/30 border border-border/40 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wide">
                      Current Value at Submission
                    </span>
                    <p className="font-mono text-muted-foreground text-xs line-through break-all">
                      {req.currentValue}
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-0.5">
                    <span className="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-medium tracking-wide">
                      Requested New Value
                    </span>
                    <p className="font-mono text-foreground font-medium text-xs break-all">
                      {req.requestedValue}
                    </p>
                  </div>
                </div>

                {/* Rationale & Action Footer */}
                <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                  <div className="flex items-start space-x-1.5 text-muted-foreground max-w-xl">
                    <span className="font-medium text-foreground shrink-0">Reason:</span>
                    <span className="truncate italic">"{req.reason}"</span>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
                    {req.status === "REJECTED" && req.rejectionReason && (
                      <span
                        className="text-[10px] text-rose-700 dark:text-rose-400 max-w-xs truncate"
                        title={req.rejectionReason}
                      >
                        Reason: {req.rejectionReason}
                      </span>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(req)}
                      className="h-7 px-2.5 text-xs text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-medium"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View Audit Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
