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
  Clock,
  Search,
  X,
  FolderOpen,
  User,
  Wrench,
  ShieldCheck,
} from "lucide-react";
import type {
  FederationComplaintItem,
  ComplaintStatusDisplay,
} from "../types";

interface ComplaintTableProps {
  complaints: FederationComplaintItem[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: ComplaintStatusDisplay | "ALL";
  onStatusFilterChange: (value: ComplaintStatusDisplay | "ALL") => void;
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
  onViewDetails,
  onResolve,
  isLoading,
}: ComplaintTableProps) {
  const getStatusBadge = (status: ComplaintStatusDisplay) => {
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
      case "RESOLVED":
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-medium border-emerald-600/30 text-emerald-800 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/40"
          >
            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
            Resolved & Settled
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
            placeholder="Search by Complaint ID, customer, or worker..."
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
            <option value="ALL">All Disputes</option>
            <option value="PENDING">Pending</option>
            <option value="RESOLVED">Resolved</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      {complaints.length === 0 ? (
        <div className="text-center py-10 px-4 border border-dashed border-border/80 rounded-lg bg-card space-y-2">
          <FolderOpen className="h-6 w-6 mx-auto text-muted-foreground" />
          <h4 className="text-sm font-semibold text-foreground">No Grievances Found</h4>
          <p className="text-xs text-muted-foreground">
            No customer complaints or dispute logs match your current search criteria.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 text-[11px]">
                  <TableHead className="font-semibold text-foreground w-[120px]">
                    Complaint ID
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">Customer</TableHead>
                  <TableHead className="font-semibold text-foreground">Worker Member</TableHead>
                  <TableHead className="font-semibold text-foreground">Subject & Category</TableHead>
                  <TableHead className="font-semibold text-foreground max-w-[240px]">
                    Description Summary
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">Filing Date</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-foreground text-right w-[170px]">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.map((c) => {
                  const isPending = c.status === "PENDING";

                  return (
                    <TableRow
                      key={c.id}
                      className="hover:bg-muted/20 transition-colors text-xs"
                    >
                      {/* Complaint ID */}
                      <TableCell className="font-mono font-medium text-muted-foreground">
                        {c.complaintNumber}
                      </TableCell>

                      {/* Customer */}
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 font-bold text-[10px]">
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

                      {/* Worker */}
                      <TableCell>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-foreground truncate">
                            {c.workerName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {c.workerProfession} • {c.workerId}
                          </span>
                        </div>
                      </TableCell>

                      {/* Subject */}
                      <TableCell>
                        <span className="font-medium text-foreground block truncate max-w-[160px]">
                          {c.subject}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {c.category}
                        </span>
                      </TableCell>

                      {/* Description */}
                      <TableCell className="max-w-[240px]">
                        <p className="truncate text-muted-foreground text-[11px]">
                          {c.description}
                        </p>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-muted-foreground font-mono text-[11px]">
                        {c.submittedDate}
                      </TableCell>

                      {/* Status */}
                      <TableCell>{getStatusBadge(c.status)}</TableCell>

                      {/* Action */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetails(c)}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>

                          {isPending ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onResolve(c)}
                              className="h-7 px-2 text-xs border-emerald-600/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/10 font-medium"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                              Mark as Resolved
                            </Button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic px-1">
                              Settled
                            </span>
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
            <span>Displaying {complaints.length} dispute records</span>
            <span className="italic">
              Resolved disputes preserve full conciliation remarks and audit logs
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
