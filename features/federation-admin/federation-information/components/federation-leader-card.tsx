"use client";

import * as React from "react";
import { UserCheck, Mail, Phone, Calendar, Hash, ShieldCheck, Award } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProtectedFieldBadge } from "./protected-field-badge";
import type { FederationLeaderDetails } from "../types";

interface FederationLeaderCardProps {
  leader: FederationLeaderDetails;
}

export function FederationLeaderCard({ leader }: FederationLeaderCardProps) {
  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle className="text-base font-semibold text-foreground">
                  Current Federation Admin & Leadership
                </CardTitle>
                <ProtectedFieldBadge label="Statutory Executive Record" />
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Designated representative registered with the Cooperative Department
              </CardDescription>
            </div>
          </div>

          <Badge
            variant="outline"
            className="border-emerald-600/30 text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 text-[11px] font-medium self-start sm:self-auto"
          >
            <ShieldCheck className="h-3 w-3 mr-1 text-emerald-600" />
            Active Tenure
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        <div className="rounded-md bg-muted/40 p-3 border border-border/60 text-xs text-muted-foreground leading-relaxed flex items-start space-x-2">
          <Award className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span>
            This section is <strong className="font-semibold text-foreground">informational</strong>. Leadership changes require certified board resolutions submitted through official registrar proceedings rather than in-app self modification.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* 1. Leader Full Name & Designation */}
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
            <span className="text-muted-foreground text-[11px] font-medium">
              President / Executive Head
            </span>
            <p className="font-semibold text-foreground text-sm">
              {leader.name}
            </p>
            <span className="text-[11px] text-muted-foreground">
              {leader.designation}
            </span>
          </div>

          {/* 2. Leader ID */}
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
            <span className="text-muted-foreground text-[11px] font-medium flex items-center space-x-1">
              <Hash className="h-3 w-3" />
              <span>Leader / Admin Credential ID</span>
            </span>
            <p className="font-mono font-semibold text-foreground text-sm">
              {leader.id}
            </p>
            <span className="text-[11px] text-muted-foreground">
              State Cooperative Council Register
            </span>
          </div>

          {/* 3. Official Email */}
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
            <span className="text-muted-foreground text-[11px] font-medium flex items-center space-x-1">
              <Mail className="h-3 w-3" />
              <span>Official Executive Email</span>
            </span>
            <p className="font-mono font-medium text-foreground text-xs">
              {leader.contactEmail}
            </p>
            <span className="text-[10px] text-muted-foreground">
              Direct administrative desk
            </span>
          </div>

          {/* 4. Contact Phone & Appointment */}
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
            <span className="text-muted-foreground text-[11px] font-medium flex items-center space-x-1">
              <Phone className="h-3 w-3" />
              <span>Direct Phone & Tenure</span>
            </span>
            <p className="font-mono font-medium text-foreground text-xs">
              {leader.contactPhone}
            </p>
            <div className="flex items-center space-x-1 text-[10px] text-muted-foreground mt-0.5">
              <Calendar className="h-3 w-3" />
              <span>Tenure from: {leader.appointmentDate}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
