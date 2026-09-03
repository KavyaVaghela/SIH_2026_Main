"use client";

import * as React from "react";
import {
  Building2,
  Calendar,
  Hash,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileCheck2,
  FileEdit,
  Shield,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProtectedFieldBadge } from "./protected-field-badge";
import type { OfficialFederationDetails, ChangeRequestField } from "../types";

interface FederationOverviewCardProps {
  details: OfficialFederationDetails;
  onRequestChange: (field: ChangeRequestField) => void;
}

export function FederationOverviewCard({
  details,
  onRequestChange,
}: FederationOverviewCardProps) {
  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle className="text-base font-semibold text-foreground">
                  Federation Overview
                </CardTitle>
                <ProtectedFieldBadge label="Statutory Records Locked" />
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Official statutory identity and legal contact parameters
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <Badge
              variant="outline"
              className="border-emerald-600/30 text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 text-[11px] font-medium"
            >
              <Shield className="h-3 w-3 mr-1 text-emerald-600" />
              Status: {details.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-6">
        {/* Notice banner */}
        <div className="rounded-md bg-muted/40 p-3 border border-border/60 flex items-start space-x-2.5 text-xs text-muted-foreground">
          <Shield className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            All fields in this overview are <strong className="font-semibold text-foreground">statutorily protected</strong>. Direct edits are disabled. To amend any official record, click the corresponding <strong className="font-semibold text-foreground">Request Update</strong> button to submit a formal change request for Super Admin review.
          </p>
        </div>

        {/* Primary Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {/* 1. Federation Official Name */}
          <div className="p-3.5 rounded-lg border border-border/60 bg-card/60 hover:bg-muted/20 transition-colors flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Official Registered Name
                </span>
                <ProtectedFieldBadge variant="compact" />
              </div>
              <p className="font-semibold text-foreground mt-1 text-base">
                {details.name}
              </p>
              <span className="text-[11px] text-muted-foreground font-mono">
                Code: {details.code}
              </span>
            </div>
            <div className="pt-2 border-t border-border/40 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRequestChange("name")}
                className="h-7 text-xs text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 px-2"
              >
                <FileEdit className="h-3 w-3 mr-1" />
                Request Update
              </Button>
            </div>
          </div>

          {/* 2. Registration Number */}
          <div className="p-3.5 rounded-lg border border-border/60 bg-card/60 hover:bg-muted/20 transition-colors flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground flex items-center space-x-1">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Statutory Registration Number</span>
                </span>
                <ProtectedFieldBadge variant="compact" />
              </div>
              <p className="font-mono font-semibold text-foreground mt-1 text-base">
                {details.registrationNumber}
              </p>
              <div className="flex items-center space-x-1 text-[11px] text-muted-foreground mt-0.5">
                <Calendar className="h-3 w-3" />
                <span>Registered: {details.registrationDate}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-border/40 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRequestChange("registrationNumber")}
                className="h-7 text-xs text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 px-2"
              >
                <FileEdit className="h-3 w-3 mr-1" />
                Request Update
              </Button>
            </div>
          </div>

          {/* 3. Registered Office Address */}
          <div className="p-3.5 rounded-lg border border-border/60 bg-card/60 hover:bg-muted/20 transition-colors flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground flex items-center space-x-1">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Registered Office Address</span>
                </span>
                <ProtectedFieldBadge variant="compact" />
              </div>
              <p className="font-medium text-foreground mt-1 text-xs leading-relaxed">
                {details.address}
              </p>
              <span className="text-[11px] text-muted-foreground">
                {details.city}, {details.state}
              </span>
            </div>
            <div className="pt-2 border-t border-border/40 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRequestChange("address")}
                className="h-7 text-xs text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 px-2"
              >
                <FileEdit className="h-3 w-3 mr-1" />
                Request Update
              </Button>
            </div>
          </div>

          {/* 4. Service Area / Region */}
          <div className="p-3.5 rounded-lg border border-border/60 bg-card/60 hover:bg-muted/20 transition-colors flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground flex items-center space-x-1">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Operating Jurisdiction & Service Area</span>
                </span>
                <ProtectedFieldBadge variant="compact" />
              </div>
              <p className="font-medium text-foreground mt-1 text-xs leading-relaxed">
                {details.serviceRegion}
              </p>
              <span className="text-[11px] text-muted-foreground">
                Jurisdiction: {details.jurisdiction}
              </span>
            </div>
            <div className="pt-2 border-t border-border/40 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRequestChange("serviceRegion")}
                className="h-7 text-xs text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 px-2"
              >
                <FileEdit className="h-3 w-3 mr-1" />
                Request Update
              </Button>
            </div>
          </div>

          {/* 5. Official Email */}
          <div className="p-3.5 rounded-lg border border-border/60 bg-card/60 hover:bg-muted/20 transition-colors flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground flex items-center space-x-1">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Official Communications Email</span>
                </span>
                <ProtectedFieldBadge variant="compact" />
              </div>
              <p className="font-mono font-medium text-foreground mt-1 text-xs">
                {details.contactEmail}
              </p>
              <span className="text-[10px] text-muted-foreground">
                Verified institutional contact for statutory service notices
              </span>
            </div>
            <div className="pt-2 border-t border-border/40 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRequestChange("contactEmail")}
                className="h-7 text-xs text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 px-2"
              >
                <FileEdit className="h-3 w-3 mr-1" />
                Request Update
              </Button>
            </div>
          </div>

          {/* 6. Official Phone */}
          <div className="p-3.5 rounded-lg border border-border/60 bg-card/60 hover:bg-muted/20 transition-colors flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground flex items-center space-x-1">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Official Telephone / PBX</span>
                </span>
                <ProtectedFieldBadge variant="compact" />
              </div>
              <p className="font-mono font-medium text-foreground mt-1 text-xs">
                {details.contactPhone}
              </p>
              <span className="text-[10px] text-muted-foreground">
                Central administrative desk line for government inquiry
              </span>
            </div>
            <div className="pt-2 border-t border-border/40 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRequestChange("contactPhone")}
                className="h-7 text-xs text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 px-2"
              >
                <FileEdit className="h-3 w-3 mr-1" />
                Request Update
              </Button>
            </div>
          </div>
        </div>

        {/* Supplementary Statutory Identifiers */}
        <div className="pt-2 border-t border-border/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-2.5 rounded bg-muted/30 border border-border/40">
            <span className="text-muted-foreground block text-[11px]">System Federation ID</span>
            <span className="font-mono font-medium text-foreground text-xs">{details.id}</span>
          </div>
          <div className="p-2.5 rounded bg-muted/30 border border-border/40">
            <span className="text-muted-foreground block text-[11px]">GSTIN / Fiscal Registration</span>
            <span className="font-mono font-medium text-foreground text-xs">
              {details.gstNumber || "24AAACB9876C1Z3"}
            </span>
          </div>
          <div className="p-2.5 rounded bg-muted/30 border border-border/40">
            <span className="text-muted-foreground block text-[11px]">Establishment Year</span>
            <span className="font-medium text-foreground text-xs">{details.establishedYear}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
