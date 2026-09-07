"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  HeartHandshake,
  User,
  Building2,
  Phone,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  CreditCard,
  Layers,
} from "lucide-react";
import { WelfareStatusBadge } from "./welfare-status-badge";
import type { WorkerWelfareRecord } from "../types";

interface WelfareDetailModalProps {
  record: WorkerWelfareRecord | null;
  onClose: () => void;
}

export function WelfareDetailModal({ record, onClose }: WelfareDetailModalProps) {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0">
      <div className="bg-card w-full max-w-2xl rounded-2xl border shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b flex items-center justify-between bg-muted/20">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center">
                Welfare & Social Security Inspector
              </h3>
              <p className="text-xs text-muted-foreground">{record.workerName} • {record.workerProfession}</p>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Status Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-muted/30 border gap-2">
            <div>
              <span className="text-xs text-muted-foreground block">Current Policy & Coverage Status</span>
              <p className="text-sm font-bold text-foreground mt-0.5">{record.coverageType}</p>
            </div>

            <WelfareStatusBadge status={record.coverageStatus} />
          </div>

          {/* Attention Alert if needed */}
          {record.alertReason && (
            <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/70 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Compliance Attention Notice: </span>
                <span>{record.alertReason}</span>
              </div>
            </div>
          )}

          {/* Worker Identity & Society Affiliation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Worker Card */}
            <div className="p-3.5 rounded-xl border bg-card space-y-2">
              <span className="text-[11px] font-bold uppercase text-muted-foreground block flex items-center">
                <User className="h-3.5 w-3.5 mr-1 text-emerald-700" />
                Craftsman Profile
              </span>
              <div>
                <Link
                  href={`/super-admin/workforce/${record.workerId}`}
                  className="text-sm font-bold text-foreground hover:text-emerald-700 hover:underline flex items-center"
                >
                  {record.workerName}
                  <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Link>
                <p className="text-xs text-muted-foreground">{record.workerProfession}</p>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <Phone className="h-3 w-3 mr-1" />
                  {record.workerPhone}
                </p>
              </div>
            </div>

            {/* Society Card */}
            <div className="p-3.5 rounded-xl border bg-card space-y-2">
              <span className="text-[11px] font-bold uppercase text-muted-foreground block flex items-center">
                <Building2 className="h-3.5 w-3.5 mr-1 text-emerald-700" />
                Cooperative Society
              </span>
              <div>
                <Link
                  href={`/super-admin/societies/${record.societyId}`}
                  className="text-sm font-bold text-foreground hover:text-emerald-700 hover:underline flex items-center"
                >
                  {record.societyName}
                  <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Link>
                <p className="text-xs text-muted-foreground mt-1">Registered Regional Federation</p>
              </div>
            </div>
          </div>

          {/* Policy & Coverage Technical Details */}
          <div className="p-4 rounded-xl border bg-card space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block flex items-center">
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-emerald-700" />
              Insurance Policy & Underwriter Information
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block">Policy Reference Number:</span>
                <span className="font-mono font-bold text-foreground mt-0.5 block">
                  {record.policyNumber || "Unassigned"}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block">Insurance Provider / Alliance:</span>
                <span className="font-semibold text-foreground mt-0.5 block">
                  {record.providerName || "Cooperative Welfare Consortium"}
                </span>
              </div>

              {record.coverageAmount && (
                <div>
                  <span className="text-muted-foreground block">Coverage Sum Insured:</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                    ₹{record.coverageAmount.toLocaleString()}
                  </span>
                </div>
              )}

              <div>
                <span className="text-muted-foreground block">Effective Policy Dates:</span>
                <span className="font-medium text-foreground mt-0.5 block">
                  {record.startDate || "N/A"} → {record.expiryDate || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Cooperative Social Security Escrow Contributions */}
          <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block flex items-center">
              <CreditCard className="h-3.5 w-3.5 mr-1.5 text-emerald-700" />
              Cooperative Social Security Escrow Ledger
            </span>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-card border">
                <span className="text-[11px] text-muted-foreground block">Member Job Escrow Deductions:</span>
                <span className="text-lg font-mono font-bold text-foreground mt-1 block">
                  ₹{record.fundContributions.toLocaleString()}
                </span>
                <span className="text-[10px] text-muted-foreground">Automated 2% deductions</span>
              </div>

              <div className="p-3 rounded-lg bg-card border">
                <span className="text-[11px] text-muted-foreground block">Federation Matched Subsidies:</span>
                <span className="text-lg font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-1 block">
                  ₹{record.subsidyAmount.toLocaleString()}
                </span>
                <span className="text-[10px] text-muted-foreground">Cooperative fund subsidy</span>
              </div>
            </div>
          </div>

          {/* Operational Notes */}
          {record.notes && (
            <div className="text-xs space-y-1">
              <span className="text-muted-foreground font-semibold">Administrative Record Notes:</span>
              <p className="p-2.5 rounded-lg bg-muted/30 border leading-relaxed text-foreground">
                {record.notes}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t bg-muted/20 flex items-center justify-between">
          <Link
            href={`/super-admin/workforce/${record.workerId}`}
            className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:underline flex items-center"
          >
            Open Complete Worker Profile
            <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
          </Link>

          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close Inspector
          </Button>
        </div>
      </div>
    </div>
  );
}
