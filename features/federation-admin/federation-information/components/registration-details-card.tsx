"use client";

import * as React from "react";
import { Landmark, Scale, Building, Award, CheckCircle2, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProtectedFieldBadge } from "./protected-field-badge";
import type { FederationRegistrationAuthorityDetails } from "../types";

interface RegistrationDetailsCardProps {
  authority: FederationRegistrationAuthorityDetails;
}

export function RegistrationDetailsCard({ authority }: RegistrationDetailsCardProps) {
  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle className="text-base font-semibold text-foreground">
                  Statutory Registration & Compliance Authority
                </CardTitle>
                <ProtectedFieldBadge label="Government Authority Record" />
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                State cooperative registrar jurisdiction and regulatory classification
              </CardDescription>
            </div>
          </div>

          <Badge
            variant="outline"
            className="border-blue-600/30 text-blue-800 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/30 text-[11px] font-medium self-start sm:self-auto"
          >
            <CheckCircle2 className="h-3 w-3 mr-1 text-blue-600" />
            Grade-A Certified
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* 1. Registering Authority */}
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-muted-foreground font-medium">
              <Building className="h-3.5 w-3.5 text-blue-700" />
              <span>Registering Authority</span>
            </div>
            <p className="font-semibold text-foreground leading-snug">
              {authority.registeringAuthority}
            </p>
          </div>

          {/* 2. Statutory Society Act Reference */}
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-muted-foreground font-medium">
              <Scale className="h-3.5 w-3.5 text-blue-700" />
              <span>Statute & Legislative Reference</span>
            </div>
            <p className="font-semibold text-foreground leading-snug">
              {authority.societyActReference}
            </p>
          </div>

          {/* 3. State Registrar District Office */}
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-muted-foreground font-medium">
              <Landmark className="h-3.5 w-3.5 text-blue-700" />
              <span>District Registrar Office</span>
            </div>
            <p className="font-semibold text-foreground leading-snug">
              {authority.stateRegistrarOffice}
            </p>
          </div>

          {/* 4. Classification & Charter */}
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-muted-foreground font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-700" />
              <span>Federation Classification</span>
            </div>
            <p className="font-semibold text-foreground leading-snug">
              {authority.classification}
            </p>
          </div>

          {/* 5. Annual Statutory Audit Status */}
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-muted-foreground font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              <span>Statutory Audit Clearance</span>
            </div>
            <p className="font-semibold text-foreground leading-snug">
              {authority.financialYearAudited}
            </p>
          </div>

          {/* 6. Regulatory Compliance Index */}
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-muted-foreground font-medium">
              <Award className="h-3.5 w-3.5 text-amber-700" />
              <span>Governance Index</span>
            </div>
            <p className="font-semibold text-foreground leading-snug">
              {authority.complianceRating}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
