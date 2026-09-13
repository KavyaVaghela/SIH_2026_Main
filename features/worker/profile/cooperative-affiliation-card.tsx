"use client";

import * as React from "react";
import { Building2, Landmark, MapPin, ShieldCheck, FileText, UserCheck, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WorkerProfileDetails } from "../types";

export interface CooperativeAffiliationCardProps {
  profile: WorkerProfileDetails;
}

export function CooperativeAffiliationCard({ profile }: CooperativeAffiliationCardProps) {
  const displayMemberId = profile.memberId || profile.cooperativeId || "Pending Allocation";
  const displayRegistrationType =
    profile.registrationType === "EXISTING_WORKER"
      ? "Existing Worker Induction"
      : profile.registrationType === "NEW_WORKER"
      ? "New Worker Application"
      : "Standard Registration";

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="p-4 sm:p-5 border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <Building2 className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-bold text-foreground">
              Cooperative & Federation Affiliation
            </CardTitle>
          </div>
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold">
            Institutional Standing
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Primary Cooperative Society */}
          <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1">
            <div className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Building2 className="h-3.5 w-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
              Primary Cooperative Society
            </div>
            <p className="text-sm font-bold text-foreground">
              {profile.cooperativeName}
            </p>
            <p className="text-xs text-muted-foreground flex items-center pt-0.5">
              <FileText className="h-3 w-3 mr-1" />
              Member ID: <strong className="font-mono font-semibold text-foreground ml-1">{displayMemberId}</strong>
            </p>
          </div>

          {/* Apex Federation */}
          <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1">
            <div className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Landmark className="h-3.5 w-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
              Apex Labour Federation
            </div>
            <p className="text-sm font-bold text-foreground">
              {profile.federationName}
            </p>
            <p className="text-xs text-muted-foreground flex items-center pt-0.5">
              <ShieldCheck className="h-3 w-3 mr-1 text-emerald-600" />
              State Statutory Labour Federation
            </p>
          </div>
        </div>

        {/* Demographics & Registration Type Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-lg border bg-muted/10 space-y-0.5">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center">
              <UserCheck className="h-3 w-3 mr-1 text-emerald-600" />
              Registration Type
            </span>
            <p className="text-xs font-semibold text-foreground">{displayRegistrationType}</p>
          </div>

          <div className="p-3 rounded-lg border bg-muted/10 space-y-0.5">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center">
              <Calendar className="h-3 w-3 mr-1 text-emerald-600" />
              Date of Birth
            </span>
            <p className="text-xs font-semibold text-foreground">{profile.dateOfBirth || "On Record"}</p>
          </div>

          <div className="p-3 rounded-lg border bg-muted/10 space-y-0.5">
            <span className="text-[11px] font-medium text-muted-foreground">Gender</span>
            <p className="text-xs font-semibold text-foreground capitalize">{profile.gender || "Not specified"}</p>
          </div>
        </div>

        {/* Operating Location & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-700/20 gap-2">
          <div className="flex items-center text-xs text-foreground">
            <MapPin className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              Residential / Operating Address:{" "}
              <strong className="font-semibold">{profile.address || profile.location}</strong>
            </span>
          </div>

          <Badge variant="success" className="text-[10px] w-fit">
            Good Standing in Cooperative Roll
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
