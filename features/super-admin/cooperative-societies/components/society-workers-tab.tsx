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
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle2, Clock } from "lucide-react";
import type { SocietyWorkerItem } from "../types";

interface SocietyWorkersTabProps {
  workers: SocietyWorkerItem[];
}

export function SocietyWorkersTab({ workers }: SocietyWorkersTabProps) {
  if (workers.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center space-y-2">
        <Users className="h-8 w-8 text-muted-foreground mx-auto" />
        <h4 className="text-sm font-bold text-foreground">No Registered Workers</h4>
        <p className="text-xs text-muted-foreground">
          This cooperative society currently has no registered workers attached.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center space-x-2">
          <Users className="h-4 w-4 text-emerald-700" />
          <span>Registered Society Workforce ({workers.length})</span>
        </h3>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Worker Name</TableHead>
            <TableHead>Profession & Skill</TableHead>
            <TableHead>Experience</TableHead>
            <TableHead>Hourly Rate</TableHead>
            <TableHead>Availability</TableHead>
            <TableHead>Verification</TableHead>
            <TableHead>Joining Date</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {workers.map((worker) => (
            <TableRow key={worker.id} className="hover:bg-muted/40">
              <TableCell>
                <div className="space-y-0.5">
                  <p className="font-bold text-sm text-foreground">{worker.fullName}</p>
                  <p className="text-[11px] text-muted-foreground">{worker.phone || worker.email}</p>
                </div>
              </TableCell>

              <TableCell className="text-xs font-semibold text-foreground">
                {worker.profession || "Craftsman"}
              </TableCell>

              <TableCell className="text-xs text-muted-foreground">
                {worker.experienceYears} Years
              </TableCell>

              <TableCell className="text-xs font-mono font-semibold text-foreground">
                ₹{worker.hourlyRate}/hr
              </TableCell>

              <TableCell>
                {worker.availabilityStatus === "AVAILABLE" ? (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                    Online / Ready
                  </Badge>
                ) : worker.availabilityStatus === "BUSY" ? (
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 text-[10px] font-bold">
                    On Job
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px]">
                    Offline
                  </Badge>
                )}
              </TableCell>

              <TableCell>
                {worker.verificationStatus === "verified" ? (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold border-emerald-200">
                    <CheckCircle2 className="h-3 w-3 mr-1 inline" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 text-[10px] font-semibold border-amber-200">
                    <Clock className="h-3 w-3 mr-1 inline" /> Pending
                  </Badge>
                )}
              </TableCell>

              <TableCell className="text-xs text-muted-foreground">
                {worker.joiningDate}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
