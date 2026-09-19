"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { FederationCoverageItem } from "../types";

export interface FederationDetailsModalProps {
  federation: FederationCoverageItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FederationDetailsModal({
  federation,
  isOpen,
  onClose,
}: FederationDetailsModalProps) {
  if (!federation) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="max-h-[85vh] overflow-y-auto p-1">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            {federation.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Welfare Scheme Enrollment & Coverage Breakdown
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-3 text-xs">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200">
              <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                {federation.coveredWorkers}
              </div>
              <div className="text-[11px] font-semibold text-muted-foreground">Covered Workers</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-border">
              <div className="text-xl font-bold text-foreground">
                {federation.totalWorkers}
              </div>
              <div className="text-[11px] font-semibold text-muted-foreground">Total Registered</div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200">
              <div className="text-xl font-bold text-emerald-600">
                {federation.coveragePercentage}%
              </div>
              <div className="text-[11px] font-semibold text-muted-foreground">Coverage Rate</div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between font-semibold">
              <span>Overall Federation Health Coverage Progress</span>
              <span className="text-emerald-600">{federation.coveragePercentage}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${federation.coveragePercentage}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-2">
            <span className="font-bold text-foreground block">Active Federation Programs:</span>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>PM Suraksha Bima Yojana (Accident Cover)</li>
              <li>ESIC Health Insurance & Medical Subsidy</li>
              <li>PM Shram Yogi Maandhan Pension Program</li>
              <li>Workplace Elevation Safety & PPE Compliance</li>
            </ul>
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
