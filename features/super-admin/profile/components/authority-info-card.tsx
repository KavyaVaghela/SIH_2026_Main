"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Shield, KeyRound, CheckCircle2 } from "lucide-react";
import type { SuperAdminProfile } from "../types";

interface AuthorityInfoCardProps {
  profile: SuperAdminProfile;
}

export function AuthorityInfoCard({ profile }: AuthorityInfoCardProps) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-emerald-700" />
          <CardTitle className="text-sm font-bold text-foreground">
            Organization & Apex Governance Authority
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Platform-wide statutory jurisdiction, audit delegation, and cryptographic clearance tier.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-muted-foreground block text-[11px] font-semibold uppercase">
              Governing Organization
            </span>
            <p className="text-sm font-bold text-foreground">{profile.organization}</p>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground block text-[11px] font-semibold uppercase">
              Administrative Authority Tier
            </span>
            <div className="flex items-center space-x-2 mt-0.5">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 text-xs font-bold">
                <Shield className="h-3 w-3 mr-1 text-emerald-700 inline" />
                Tier 1 Apex Clearance
              </Badge>
              <span className="text-muted-foreground">{profile.authorityTier}</span>
            </div>
          </div>

          <div className="space-y-1 sm:col-span-2 border-t pt-3">
            <span className="text-muted-foreground block text-[11px] font-semibold uppercase">
              Statutory Jurisdiction
            </span>
            <p className="text-xs font-medium text-foreground">{profile.jurisdiction}</p>
          </div>

          <div className="space-y-1 sm:col-span-2 border-t pt-3">
            <span className="text-muted-foreground block text-[11px] font-semibold uppercase">
              Platform Role
            </span>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border">
              <div>
                <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                  {profile.role}
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Immutable role. Super Admin permissions are cryptographically locked to this security principal.
                </p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
