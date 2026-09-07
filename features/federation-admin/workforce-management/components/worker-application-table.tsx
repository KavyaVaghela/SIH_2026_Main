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
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  X,
  FolderOpen,
  FileText,
} from "lucide-react";
import type {
  WorkerApplicationItem,
  WorkerApplicationStatus,
} from "../types";

interface WorkerApplicationTableProps {
  applications: WorkerApplicationItem[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: WorkerApplicationStatus | "ALL";
  onStatusFilterChange: (value: WorkerApplicationStatus | "ALL") => void;
  onViewDetails: (app: WorkerApplicationItem) => void;
  onAccept: (app: WorkerApplicationItem) => void;
  onReject: (app: WorkerApplicationItem) => void;
  isLoading?: boolean;
}

export function WorkerApplicationTable({
  applications,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onViewDetails,
  onAccept,
  onReject,
  isLoading,
}: WorkerApplicationTableProps) {
  const getStatusBadge = (status: WorkerApplicationStatus) => {
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
      case "ACCEPTED":
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-medium border-emerald-600/30 text-emerald-800 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/40"
          >
            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
            Accepted & Inducted
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

  return (
    <div className="space-y-3">
      {/* Search and Status Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by applicant name or App ID..."
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
            <option value="ALL">All Applications</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      {applications.length === 0 ? (
        <div className="text-center py-10 px-4 border border-dashed border-border/80 rounded-lg bg-card space-y-2">
          <FolderOpen className="h-6 w-6 mx-auto text-muted-foreground" />
          <h4 className="text-sm font-semibold text-foreground">No Applications Found</h4>
          <p className="text-xs text-muted-foreground">
            No incoming worker membership applications match the specified criteria.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 text-[11px]">
                  <TableHead className="font-semibold text-foreground">Application ID</TableHead>
                  <TableHead className="font-semibold text-foreground">Applicant Name</TableHead>
                  <TableHead className="font-semibold text-foreground">Profession</TableHead>
                  <TableHead className="font-semibold text-foreground">Skills / Qualifications</TableHead>
                  <TableHead className="font-semibold text-foreground">Credentials</TableHead>
                  <TableHead className="font-semibold text-foreground">Submitted Date</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-foreground text-right w-[190px]">
                    Review Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => {
                  const isPending = app.status === "PENDING";

                  return (
                    <TableRow
                      key={app.id}
                      className="hover:bg-muted/20 transition-colors text-xs"
                    >
                      {/* ID */}
                      <TableCell className="font-mono font-medium text-muted-foreground">
                        {app.id}
                      </TableCell>

                      {/* Name */}
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 font-bold text-[10px]">
                            {app.applicantName.charAt(0)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-foreground truncate">
                              {app.applicantName}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {app.phone}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Profession */}
                      <TableCell>
                        <span className="font-medium text-foreground">{app.profession}</span>
                        <span className="text-[10px] text-muted-foreground block">
                          {app.experienceYears} yrs exp • ₹{app.hourlyRate}/hr
                        </span>
                      </TableCell>

                      {/* Skills */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {app.skills.map((s, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-1.5 py-0.5 rounded bg-muted text-[9px] text-muted-foreground"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </TableCell>

                      {/* Documents */}
                      <TableCell>
                        <div className="flex items-center space-x-1 text-[10px] text-muted-foreground">
                          <FileText className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span>{app.documents.length} verified file(s)</span>
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-muted-foreground font-mono text-[11px]">
                        {app.submittedDate}
                      </TableCell>

                      {/* Status */}
                      <TableCell>{getStatusBadge(app.status)}</TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetails(app)}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>

                          {isPending && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onAccept(app)}
                                className="h-7 px-2 text-xs border-emerald-600/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/10 font-medium"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onReject(app)}
                                className="h-7 px-2 text-xs border-rose-600/30 text-rose-800 dark:text-rose-300 hover:bg-rose-500/10 font-medium"
                              >
                                <XCircle className="h-3 w-3 mr-1 text-rose-600" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="p-3 bg-muted/20 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Displaying {applications.length} applications</span>
            <span className="italic">
              Accepting an application inducts the applicant with verified Active status
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
