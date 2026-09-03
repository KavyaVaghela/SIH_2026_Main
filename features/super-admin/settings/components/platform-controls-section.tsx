"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Building2, Zap, ShieldCheck, AlertTriangle } from "lucide-react";

interface PlatformControlsSectionProps {
  societyRegistrationEnabled: boolean;
  emergencyBookingEnabled: boolean;
  onToggleRegistrations: (checked: boolean) => void;
  onToggleEmergency: (checked: boolean) => void;
  isSaving?: boolean;
}

export function PlatformControlsSection({
  societyRegistrationEnabled,
  emergencyBookingEnabled,
  onToggleRegistrations,
  onToggleEmergency,
  isSaving,
}: PlatformControlsSectionProps) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          <CardTitle className="text-base font-bold text-foreground">
            Platform Operations & Access Controls
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Govern core marketplace entry gates, rapid dispatch capabilities, and ecosystem registration policies.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Control 1: New Society Registrations */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card hover:border-emerald-700/30 transition-all">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-emerald-700" />
              <h4 className="text-sm font-bold text-foreground">
                New Society & Federation Registrations
              </h4>
              <Badge
                variant="outline"
                className={`text-[10px] font-bold ${
                  societyRegistrationEnabled
                    ? "bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200"
                    : "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200"
                }`}
              >
                {societyRegistrationEnabled ? "Open for Submissions" : "Registrations Paused"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Permits regional craft cooperatives, union chapters, and artisan guilds to submit digital bylaws, founding rosters, and state registration dossiers.
            </p>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-auto shrink-0">
            <span className="text-xs font-semibold text-foreground">
              {societyRegistrationEnabled ? "Active" : "Disabled"}
            </span>
            <Switch
              checked={societyRegistrationEnabled}
              onCheckedChange={onToggleRegistrations}
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Control 2: Emergency Service Bookings */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card hover:border-emerald-700/30 transition-all">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-amber-600" />
              <h4 className="text-sm font-bold text-foreground">
                Emergency Service Booking Dispatch
              </h4>
              <Badge
                variant="outline"
                className={`text-[10px] font-bold ${
                  emergencyBookingEnabled
                    ? "bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200"
                    : "bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200"
                }`}
              >
                {emergencyBookingEnabled ? "Urgent Dispatch Active" : "Emergency Paused"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Controls platform-wide acceptance of priority emergency bookings (&lt;60 minutes) for hazardous electrical faults, pipe bursts, and sanitation breakdowns.
            </p>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-auto shrink-0">
            <span className="text-xs font-semibold text-foreground">
              {emergencyBookingEnabled ? "Active" : "Paused"}
            </span>
            <Switch
              checked={emergencyBookingEnabled}
              onCheckedChange={onToggleEmergency}
              disabled={isSaving}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
