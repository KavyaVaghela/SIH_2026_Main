"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Star, ShieldCheck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkerStatusBadge } from "./worker-status-badge";
import { WorkerPerformanceBadge } from "./worker-performance-badge";
import type { WorkerFullDetails } from "../types";

interface WorkerDetailHeaderProps {
  worker: WorkerFullDetails;
}

export function WorkerDetailHeader({ worker }: WorkerDetailHeaderProps) {
  return (
    <div className="space-y-4 pb-2 border-b border-border/60">
      {/* Back button & Breadcrumb line */}
      <div className="flex items-center justify-between">
        <Link href="/federation-admin/worker-information">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-foreground pl-1"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back to Worker Roster
          </Button>
        </Link>

        <Badge
          variant="outline"
          className="flex items-center space-x-1 text-[11px] text-muted-foreground font-mono"
        >
          <ShieldCheck className="h-3 w-3 text-emerald-600" />
          <span>Read-Only Profile</span>
        </Badge>
      </div>

      {/* Informational Read-Only Banner */}
      <div className="rounded-md bg-blue-50/60 dark:bg-blue-950/40 p-3 border border-blue-200 dark:border-blue-800/40 text-blue-800 dark:text-blue-300 text-xs flex items-start space-x-2">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
        <p className="leading-relaxed">
          <strong className="font-semibold">Informational Roster Profile:</strong> This view is strictly read-only for administrative oversight and compliance tracking. Worker activation, deactivation, skill assignments, and credential updates are managed under <strong className="font-semibold">Workforce Management</strong>.
        </p>
      </div>

      {/* Main Identity Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-1">
        <div className="flex items-center space-x-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-white font-bold text-lg shadow-sm">
            {worker.personal.fullName.charAt(0)}
          </div>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {worker.personal.fullName}
              </h1>
              <span className="font-mono text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/40">
                {worker.id}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {worker.professional.profession} • {worker.personal.city}, {worker.personal.state}
            </p>
          </div>
        </div>

        {/* Badges & Metrics */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <WorkerStatusBadge
            accountStatus={worker.accountStatus}
            availabilityStatus={worker.availabilityStatus}
            showAvailability={true}
          />
          <div className="h-6 w-px bg-border/60 hidden sm:block" />
          <WorkerPerformanceBadge
            rating={worker.performance.averageRating}
            tier={worker.performance.performanceTier}
          />
        </div>
      </div>
    </div>
  );
}
