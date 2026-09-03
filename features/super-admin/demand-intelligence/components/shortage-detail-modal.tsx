"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  AlertTriangle,
  MapPin,
  Briefcase,
  Users,
  Building2,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Star,
  Compass,
} from "lucide-react";
import type { ShortageAlert, WorkforceAllocationRecommendation } from "../types";

interface ShortageDetailModalProps {
  alert: ShortageAlert | null;
  recommendation: WorkforceAllocationRecommendation | null;
  onClose: () => void;
}

export function ShortageDetailModal({
  alert,
  recommendation,
  onClose,
}: ShortageDetailModalProps) {
  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0">
      <div className="bg-card w-full max-w-2xl rounded-2xl border shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b flex items-center justify-between bg-muted/20">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center">
                Shortage Diagnostic: {alert.location}
              </h3>
              <p className="text-xs text-muted-foreground">{alert.serviceTitle}</p>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Key Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border bg-muted/30 text-center">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
                Current Demand
              </span>
              <p className="text-2xl font-bold font-mono text-foreground mt-0.5">
                {alert.currentDemand}
              </p>
              <span className="text-[10px] text-muted-foreground">Requests</span>
            </div>

            <div className="p-3 rounded-xl border bg-muted/30 text-center">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
                Available Workers
              </span>
              <p className="text-2xl font-bold font-mono text-sky-700 dark:text-sky-400 mt-0.5">
                {alert.availableWorkers}
              </p>
              <span className="text-[10px] text-muted-foreground">Ready</span>
            </div>

            <div className="p-3 rounded-xl border bg-muted/30 text-center">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
                Active Workers
              </span>
              <p className="text-2xl font-bold font-mono text-indigo-700 dark:text-indigo-400 mt-0.5">
                {alert.activeWorkers}
              </p>
              <span className="text-[10px] text-muted-foreground">On-Site</span>
            </div>

            <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 dark:bg-rose-950/40 text-center">
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase block">
                Net Shortage
              </span>
              <p className="text-2xl font-bold font-mono text-rose-600 mt-0.5">
                -{alert.shortageAmount}
              </p>
              <span className="text-[10px] text-rose-700/80 dark:text-rose-300/80">Worker Deficit</span>
            </div>
          </div>

          {/* Regional Context Information */}
          <div className="p-3.5 rounded-xl border bg-card text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Primary Cooperative Federation:</span>
              <span className="font-semibold text-foreground">{alert.societyName}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-muted-foreground">Cluster Location:</span>
              <span className="font-semibold text-foreground flex items-center">
                <MapPin className="h-3.5 w-3.5 mr-1 text-emerald-700" />
                {alert.location}
              </span>
            </div>
          </div>

          {/* Smart Allocation Recommendation Section */}
          {recommendation && (
            <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  {recommendation.title}
                </h4>
              </div>

              <p className="text-xs text-emerald-900/80 dark:text-emerald-300/80 leading-relaxed">
                {recommendation.rationale}
              </p>

              <div className="p-2 rounded-lg bg-emerald-100/60 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-950 dark:text-emerald-200 font-semibold flex items-center justify-between">
                <span>Suggested Headcount: {recommendation.suggestedHeadcount} Craftsmen</span>
                <span>{recommendation.estimatedSlaImprovement}</span>
              </div>
            </div>
          )}

          {/* Candidate Support Workers Available for Cross-Allocation */}
          {recommendation && recommendation.candidateWorkers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center">
                  <Users className="h-3.5 w-3.5 mr-1 text-emerald-700" />
                  Candidate Workers Available from Neighboring Societies ({recommendation.candidateWorkers.length})
                </h4>
              </div>

              <div className="space-y-2">
                {recommendation.candidateWorkers.map((worker) => (
                  <div
                    key={worker.id}
                    className="p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/super-admin/workforce/${worker.id}`}
                          className="font-bold text-foreground hover:text-emerald-700 hover:underline"
                        >
                          {worker.name}
                        </Link>
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800">
                          {worker.profession}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {worker.currentSociety} • {worker.currentLocation} ({worker.distanceKm} km away)
                      </p>
                    </div>

                    <div className="text-right shrink-0 space-y-0.5">
                      <div className="flex items-center justify-end space-x-1 font-bold text-amber-600">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        <span>{worker.rating}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{worker.experienceYears} yrs exp</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t bg-muted/20 flex justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close Inspection
          </Button>
        </div>
      </div>
    </div>
  );
}
