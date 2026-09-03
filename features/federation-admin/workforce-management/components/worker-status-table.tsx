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
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, UserX, Power, ShieldAlert, FolderOpen } from "lucide-react";
import type { ManagedWorkerItem } from "../types";
import type { WorkerAccountStatus } from "@/supabase/types/database.types";


interface WorkerStatusTableProps {
  workers: ManagedWorkerItem[];
  isLoading?: boolean;
  onActivateClick: (worker: ManagedWorkerItem) => void;
  onDeactivateClick: (worker: ManagedWorkerItem) => void;
  isSubmittingAction?: boolean;
}

export function WorkerStatusTable({
  workers,
  isLoading,
  onActivateClick,
  onDeactivateClick,
  isSubmittingAction,
}: WorkerStatusTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (workers.length === 0) {
    return (
      <div className="text-center py-10 px-4 border border-dashed border-border/80 rounded-lg bg-card space-y-2">
        <FolderOpen className="h-6 w-6 mx-auto text-muted-foreground" />
        <h4 className="text-sm font-semibold text-foreground">No Workers Match Your Search</h4>
        <p className="text-xs text-muted-foreground">
          No federation workers found matching the entered query. Try clearing your search.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 text-[11px]">
              <TableHead className="font-semibold text-foreground">Worker ID</TableHead>
              <TableHead className="font-semibold text-foreground">Member Name</TableHead>
              <TableHead className="font-semibold text-foreground">Profession</TableHead>
              <TableHead className="font-semibold text-foreground">Operational Area</TableHead>
              <TableHead className="font-semibold text-foreground">Account Status</TableHead>
              <TableHead className="font-semibold text-foreground text-right w-[160px]">
                Status Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workers.map((worker) => {
              const isActive = worker.accountStatus === "ACTIVE";

              return (
                <TableRow
                  key={worker.id}
                  className="hover:bg-muted/20 transition-colors text-xs"
                >
                  {/* Worker ID */}
                  <TableCell className="font-mono font-medium text-muted-foreground">
                    {worker.id}
                  </TableCell>

                  {/* Name */}
                  <TableCell>
                    <div className="flex items-center space-x-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                        {worker.fullName.charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-foreground truncate">
                          {worker.fullName}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {worker.phone}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Profession */}
                  <TableCell>
                    <span className="font-medium text-foreground">{worker.profession}</span>
                    <span className="text-[10px] text-muted-foreground block">
                      {worker.experienceYears} yrs exp • ₹{worker.hourlyRate}/hr
                    </span>
                  </TableCell>

                  {/* Operational Area */}
                  <TableCell className="text-muted-foreground">
                    <span>{worker.area}</span>
                    <span className="text-[10px] text-muted-foreground/80 block">
                      {worker.city}
                    </span>
                  </TableCell>

                  {/* Account Status */}
                  <TableCell>
                    <div className="flex flex-col space-y-0.5 items-start">
                      {isActive ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-600/30 text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 text-[10px] font-semibold px-2 py-0 h-4"
                        >
                          <CheckCircle2 className="h-2.5 w-2.5 mr-1 text-emerald-600" />
                          ACTIVE
                        </Badge>
                      ) : (
                        <Badge
                          variant="destructive"
                          className="text-[10px] font-semibold px-2 py-0 h-4 bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                        >
                          <UserX className="h-2.5 w-2.5 mr-1" />
                          DEACTIVATED
                        </Badge>
                      )}

                      {/* Availability Context Pill */}
                      {isActive && (
                        <span className="text-[9px] text-muted-foreground">
                          Availability: {worker.availabilityStatus}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Action: Activate / Deactivate */}
                  <TableCell className="text-right">
                    {isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSubmittingAction}
                        onClick={() => onDeactivateClick(worker)}
                        className="h-7 text-xs border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/10 font-medium"
                      >
                        <UserX className="h-3 w-3 mr-1" />
                        Deactivate Worker
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSubmittingAction}
                        onClick={() => onActivateClick(worker)}
                        className="h-7 text-xs border-emerald-500/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/10 font-medium"
                      >
                        <Power className="h-3 w-3 mr-1" />
                        Activate Worker
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="p-3 bg-muted/20 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Displaying {workers.length} federation worker accounts</span>
        <span className="italic">
          Account Status updates do not modify operational dispatch availability
        </span>
      </div>
    </div>
  );
}
