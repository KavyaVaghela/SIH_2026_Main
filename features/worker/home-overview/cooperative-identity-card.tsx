"use client";

import * as React from "react";
import { ShieldCheck, MapPin, Landmark, Phone, Mail, Wrench, CheckCircle2, CircleDot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { WorkerIdentity } from "../types";

export interface CooperativeIdentityCardProps {
  identity: WorkerIdentity;
}

export function CooperativeIdentityCard({ identity }: CooperativeIdentityCardProps) {
  const isAvailable = identity.availabilityStatus === "AVAILABLE";
  const isActive = identity.accountStatus === "ACTIVE";

  return (
    <Card className="overflow-hidden border-emerald-800/30 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white shadow-md">
      <CardContent className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          {/* Greeting & Identity */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Good Morning, {identity.name.split(" ")[0]} 👋
              </h1>
              {identity.memberId && (
                <span className="text-xs font-mono bg-emerald-800/60 border border-emerald-600/40 px-2 py-0.5 rounded text-emerald-200">
                  {identity.memberId}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="font-medium text-emerald-200 text-sm sm:text-base">
                {identity.trade}
              </span>
              <span className="text-emerald-400/60 hidden sm:inline">•</span>
              <span className="text-emerald-300 text-xs sm:text-sm">
                {identity.cooperativeName}
              </span>
              <span className="text-emerald-400/60 hidden sm:inline">•</span>
              <Badge
                variant="outline"
                className="bg-emerald-800/60 border-emerald-500/50 text-emerald-100 text-xs font-semibold py-0.5 px-2"
              >
                <ShieldCheck className="h-3 w-3 mr-1 text-emerald-300" />
                {identity.cooperativeRole}
              </Badge>

              {identity.accountStatus && (
                <Badge
                  variant="outline"
                  className={
                    isActive
                      ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200 text-xs font-semibold py-0.5 px-2"
                      : "bg-red-500/20 border-red-400/40 text-red-200 text-xs font-semibold py-0.5 px-2"
                  }
                >
                  <CircleDot className="h-2.5 w-2.5 mr-1" />
                  Account: {identity.accountStatus}
                </Badge>
              )}

              {identity.availabilityStatus && (
                <Badge
                  variant="outline"
                  className={
                    isAvailable
                      ? "bg-teal-500/20 border-teal-400/40 text-teal-200 text-xs font-semibold py-0.5 px-2"
                      : "bg-amber-500/20 border-amber-400/40 text-amber-200 text-xs font-semibold py-0.5 px-2"
                  }
                >
                  <CircleDot className="h-2.5 w-2.5 mr-1" />
                  {identity.availabilityStatus}
                </Badge>
              )}
            </div>
          </div>

          {/* Federation & Location Credential Box */}
          <div className="flex flex-col items-start md:items-end gap-2 bg-emerald-900/40 border border-emerald-700/30 rounded-lg px-3.5 py-2.5 backdrop-blur-sm shrink-0">
            <div className="space-y-1 text-xs">
              <div className="flex items-center text-emerald-200/90 font-medium">
                <Landmark className="h-3.5 w-3.5 mr-1.5 text-emerald-300 shrink-0" />
                <span className="truncate max-w-[260px] sm:max-w-[320px]">
                  {identity.federationName}
                </span>
              </div>
              <div className="flex items-center text-emerald-300/80">
                <MapPin className="h-3.5 w-3.5 mr-1.5 text-emerald-400 shrink-0" />
                <span>{identity.address || identity.location}</span>
              </div>
              {(identity.email || identity.phone) && (
                <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-emerald-800/40 text-[11px] text-emerald-300/70">
                  {identity.email && (
                    <div className="flex items-center">
                      <Mail className="h-3 w-3 mr-1 text-emerald-400" />
                      <span>{identity.email}</span>
                    </div>
                  )}
                  {identity.phone && (
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 mr-1 text-emerald-400" />
                      <span>{identity.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Skills Banner */}
        {identity.skills && identity.skills.length > 0 && (
          <div className="pt-2 border-t border-emerald-800/40 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-emerald-300 flex items-center mr-1">
              <Wrench className="h-3 w-3 mr-1 text-emerald-400" />
              Verified Skills:
            </span>
            {identity.skills.map((s) => (
              <span
                key={s}
                className="text-[11px] bg-emerald-900/60 border border-emerald-700/40 rounded px-2 py-0.5 text-emerald-100 flex items-center"
              >
                <CheckCircle2 className="h-2.5 w-2.5 mr-1 text-emerald-400" />
                {s}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
