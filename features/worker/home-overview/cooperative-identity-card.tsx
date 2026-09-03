"use client";

import * as React from "react";
import { ShieldCheck, Building2, MapPin, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { WorkerIdentity } from "../types";

export interface CooperativeIdentityCardProps {
  identity: WorkerIdentity;
}

export function CooperativeIdentityCard({ identity }: CooperativeIdentityCardProps) {
  return (
    <Card className="overflow-hidden border-emerald-800/30 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white shadow-md">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Greeting & Identity */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Good Morning, {identity.name.split(" ")[0]} 👋
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="font-medium text-emerald-200 text-sm sm:text-base">
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
            </div>
          </div>

          {/* Federation & Location Credential Box */}
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start sm:items-center md:items-end lg:items-center gap-3 bg-emerald-900/40 border border-emerald-700/30 rounded-lg px-3.5 py-2.5 backdrop-blur-sm">
            <div className="space-y-1 text-xs">
              <div className="flex items-center text-emerald-200/90 font-medium">
                <Landmark className="h-3.5 w-3.5 mr-1.5 text-emerald-300 shrink-0" />
                <span className="truncate max-w-[240px] sm:max-w-[280px]">
                  {identity.federationName}
                </span>
              </div>
              <div className="flex items-center text-emerald-300/80">
                <MapPin className="h-3.5 w-3.5 mr-1.5 text-emerald-400 shrink-0" />
                <span>{identity.location}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
