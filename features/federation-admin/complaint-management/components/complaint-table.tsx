"use client";

import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Eye,
  CheckCircle2,
  Clock,
  Search,
  X,
  FolderOpen,
  Receipt,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";
import type {
  FederationComplaintItem,
} from "../types";
import type { GrievancePriority, GrievanceLifecycleStatus } from "@/types/complaints/v2";

interface ComplaintTableProps {
  complaints: FederationComplaintItem[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  priorityFilter?: string;
  onPriorityFilterChange?: (value: string) => void;
  onViewDetails: (complaint: FederationComplaintItem) => void;
  onResolve: (complaint: FederationComplaintItem) => void;
  isLoading?: boolean;
}

export function ComplaintTable({
  complaints,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter = "ALL",
  onPriorityFilterChange,
  onViewDetails,
  onResolve,
  isLoading,
}: ComplaintTableProps) {
  const getStatusBadge = (status: GrievanceLifecycleStatus | string) => {
    switch (status) {
      case "OPEN":
        return (
          <Badge variant="outline" className="text-[10px] font-bold border-blue-300 text-blue-800 dark:text-blue-300 bg-blue-50/60 dark:bg-blue-950/40">
            Open
          </Badge>
        );
      case "UNDER_REVIEW":
        return (
          <Badge variant="outline" className="text-[10px] font-bold border-amber-300 text-amber-800 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/40">
            <Clock className="h-3 w-3 mr-1 text-amber-600" />
            Under Review
          </Badge>
        );
      case "ACTION_REQUIRED":
        return (
          <Badge variant="outline" className="text-[10px] font-bold border-purple-300 text-purple-800 dark:text-purple-300 bg-purple-50/60 dark:bg-purple-950/40">
            Action Required
          </Badge>
        );
      case "ESCALATED":
        return (
          <Badge variant="outline" className="text-[10px] font-bold border-red-300 text-red-800 dark:text-red-300 bg-red-50/60 dark:bg-red-950/40 animate-pulse">
            <ArrowUpRight className="h-3 w-3 mr-1 text-red-600" />
            Escalated
          </Badge>
        );
      case "RESOLVED":
        return (
          <Badge variant="outline" className="text-[10px] font-bold border-emerald-300 text-emerald-800 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/40">
            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
            Resolved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="outline" className="text-[10px] font-bold border-rose-300 text-rose-800 dark:text-rose-300 bg-rose-50/60">
            Rejected
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge variant="outline" className="text-[10px] font-bold border-slate-300 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800">
            Closed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] font-bold">
            {status}
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority: GrievancePriority) => {
    switch (priority) {
      case "CRITICAL":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-extrabold">CRITICAL</Badge>;
      case "HIGH":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 text-[10px] font-bold">HIGH</Badge>;
      case "MEDIUM":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-medium">MEDIUM</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 text-[10px]">LOW</Badge>;
    }
  };

  return (
    <div className="space-y-3">
      {/* Search and Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by Complaint ID, customer, worker, or subject..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 pr-7 h-8 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto flex-wrap">
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] text-muted-foreground font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="h-8 text-xs rounded-lg border border-border bg-background px-2 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ACTION_REQUIRED">Action Required</option>
              <option value="ESCALATED">Escalated</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          {onPriorityFilterChange && (
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => onPriorityFilterChange(e.target.value)}
                className="h-8 text-xs rounded-lg border border-border bg-background px-2 font-medium"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Complaints Table */}
      {complaints.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-border rounded-xl bg-card space-y-2">
          <FolderOpen className="h-7 w-7 mx-auto text-muted-foreground" />
          <h4 className="text-sm font-semibold text-foreground">No Grievances Found</h4>
          <p className="text-xs text-muted-foreground">
            No grievance records match your current criteria.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 text-[11px]">
                  <TableHead className="font-semibold text-foreground w-[130px]">
                    Case Ref
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">Priority</TableHead>
                  <TableHead className="font-semibold text-foreground">Complainant</TableHead>
                  <TableHead className="font-semibold text-foreground">Involved Party</TableHead>
                  <TableHead className="font-semibold text-foreground">Subject & Category</TableHead>
                  <TableHead className="font-semibold text-foreground">Smart Triage</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-foreground text-right w-[180px]">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.map((c) => {
                  const isResolved = c.lifecycleStatus === "RESOLVED" || c.status === "RESOLVED";

                  return (
                    <TableRow
                      key={c.id}
                      className="hover:bg-muted/20 transition-colors text-xs"
                    >
                      {/* Complaint ID */}
                      <TableCell className="font-mono font-bold text-foreground">
                        {c.complaintNumber}
                        {c.bookingId && (
                          <span className="block text-[10px] text-muted-foreground font-normal">
                            Linked: {c.bookingId.slice(0, 8)}...
                          </span>
                        )}
                      </TableCell>

                      {/* Priority */}
                      <TableCell>
                        {getPriorityBadge(c.priority)}
                      </TableCell>

                      {/* Complainant */}
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                            {c.customerName.charAt(0)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-foreground truncate">
                              {c.customerName}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {c.customerPhone}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Worker / Target */}
                      <TableCell>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-foreground truncate">
                            {c.workerName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {c.workerProfession}
                          </span>
                        </div>
                      </TableCell>

                      {/* Subject & Category */}
                      <TableCell className="max-w-[200px]">
                        <span className="font-bold text-foreground block truncate">
                          {c.subject}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {c.category}
                        </span>
                      </TableCell>

                      {/* Smart Triage Indicator */}
                      <TableCell className="max-w-[160px]">
                        <span className="text-[11px] text-blue-700 dark:text-blue-300 font-medium line-clamp-1">
                          {c.suggestedPriority} • {c.triageReason || "Rule-based analysis"}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {getStatusBadge(c.lifecycleStatus || c.status)}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewDetails(c)}
                            className="h-7 px-2.5 text-[11px] font-medium border-border hover:bg-muted"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Case File
                          </Button>
                          {!isResolved && (
                            <Button
                              size="sm"
                              onClick={() => onResolve(c)}
                              className="h-7 px-2.5 text-[11px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
