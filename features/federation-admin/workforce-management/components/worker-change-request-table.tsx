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
import { Select } from "@/components/ui/select";
import {
  FileEdit,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  X,
  FolderOpen,
  ArrowRight,
} from "lucide-react";
import type {
  WorkerChangeRequestItem,
  WorkerChangeRequestStatus,
} from "../types";

interface WorkerChangeRequestTableProps {
  requests: WorkerChangeRequestItem[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: WorkerChangeRequestStatus | "ALL";
  onStatusFilterChange: (value: WorkerChangeRequestStatus | "ALL") => void;
  onReviewRequest: (req: WorkerChangeRequestItem) => void;
  isLoading?: boolean;
}

export function WorkerChangeRequestTable({
  requests,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onReviewRequest,
  isLoading,
}: WorkerChangeRequestTableProps) {
  const getStatusBadge = (status: WorkerChangeRequestStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-medium border-amber-600/30 text-amber-800 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/40"
          >
            <Clock className="h-3 w-3 mr-1 text-amber-600" />
            Pending Review
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-medium border-emerald-600/30 text-emerald-800 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/40"
          >
            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
            Approved & Applied
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-medium border-rose-600/30 text-rose-800 dark:text-rose-300 bg-rose-50/60 dark:bg-rose-950/40"
          >
            <XCircle className="h-3 w-3 mr-1 text-rose-600" />
            Rejected
          </Badge>
        );
    }
  };

  const getSectionBadge = (section: WorkerChangeRequestItem["section"]) => {
    switch (section) {
      case "PROFESSIONAL":
        return <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-700">Trade Specialty</Badge>;
      case "RATES":
        return <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-700">Tariff Rate</Badge>;
      case "SKILLS":
        return <Badge variant="outline" className="text-[9px] border-purple-500/30 text-purple-700">Skill Competency</Badge>;
      case "PERSONAL":
        return <Badge variant="outline" className="text-[9px] border-slate-500/30 text-slate-700">Personal Contact</Badge>;
      default:
        return <Badge variant="outline" className="text-[9px]">General</Badge>;
    }
  };

  return (
    <div className="space-y-3">
      {/* Search and Status Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by worker name, ID, or field..."
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

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className="text-[11px] text-muted-foreground font-medium">Filter Status:</span>
          <Select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as any)}
            className="h-8 text-xs w-[140px]"
          >
            <option value="ALL">All Requests</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      {requests.length === 0 ? (
        <div className="text-center py-10 px-4 border border-dashed border-border/80 rounded-lg bg-card space-y-2">
          <FolderOpen className="h-6 w-6 mx-auto text-muted-foreground" />
          <h4 className="text-sm font-semibold text-foreground">No Change Requests Found</h4>
          <p className="text-xs text-muted-foreground">
            No member information modification requests match your filter selection.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 text-[11px]">
                  <TableHead className="font-semibold text-foreground">Request ID</TableHead>
                  <TableHead className="font-semibold text-foreground">Worker Member</TableHead>
                  <TableHead className="font-semibold text-foreground">Target Section</TableHead>
                  <TableHead className="font-semibold text-foreground">Proposed Change</TableHead>
                  <TableHead className="font-semibold text-foreground">Submitted Date</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-foreground text-right w-[120px]">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow
                    key={req.id}
                    className="hover:bg-muted/20 transition-colors text-xs"
                  >
                    {/* Request ID */}
                    <TableCell className="font-mono font-medium text-muted-foreground">
                      {req.id}
                    </TableCell>

                    {/* Member */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground truncate">
                          {req.workerName}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {req.workerId}
                        </span>
                      </div>
                    </TableCell>

                    {/* Section */}
                    <TableCell>
                      <div className="space-y-0.5">
                        {getSectionBadge(req.section)}
                        <span className="text-[10px] text-muted-foreground block font-medium">
                          {req.field}
                        </span>
                      </div>
                    </TableCell>

                    {/* Proposed change summary */}
                    <TableCell>
                      <div className="flex items-center space-x-1.5 text-xs max-w-[260px]">
                        <span className="text-muted-foreground line-through truncate max-w-[100px]">
                          {req.currentValue}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="font-semibold text-foreground truncate max-w-[120px]">
                          {req.requestedValue}
                        </span>
                      </div>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-muted-foreground font-mono text-[11px]">
                      {req.submittedDate}
                    </TableCell>

                    {/* Status */}
                    <TableCell>{getStatusBadge(req.status)}</TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReviewRequest(req)}
                        className="h-7 px-2.5 text-xs font-medium border-border hover:bg-muted text-emerald-800 dark:text-emerald-300"
                      >
                        <FileEdit className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="p-3 bg-muted/20 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Displaying {requests.length} profile change requests</span>
            <span className="italic">
              Canonical worker data updates only upon explicit administrative approval
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
