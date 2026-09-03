"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { BellRing, AlertTriangle, Users, HeartHandshake, Building2 } from "lucide-react";
import type { NotificationPreferences } from "../types";

interface NotificationPreferencesSectionProps {
  preferences: NotificationPreferences;
  onTogglePreference: (key: keyof NotificationPreferences, value: boolean) => void;
  isSaving?: boolean;
}

export function NotificationPreferencesSection({
  preferences,
  onTogglePreference,
  isSaving,
}: NotificationPreferencesSectionProps) {
  const items: Array<{
    key: keyof NotificationPreferences;
    title: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      key: "complaintAlertsEnabled",
      title: "High-Severity Dispute & Complaint Alerts",
      description: "Immediate operational push alerts when a customer or worker files a safety or service standard dispute.",
      icon: <AlertTriangle className="h-4 w-4 text-rose-600" />,
    },
    {
      key: "workerShortageAlertsEnabled",
      title: "Regional Worker Shortage & Surge Alerts",
      description: "Automated alerts when local trade demand exceeds 1.5x available craftsmen capacity in any urban sector.",
      icon: <Users className="h-4 w-4 text-amber-600" />,
    },
    {
      key: "welfareAlertsEnabled",
      title: "Cooperative Welfare & Policy Expiry Alerts",
      description: "Advance notices for group insurance policies approaching the 30-day renewal deadline or unenrolled craftsmen.",
      icon: <HeartHandshake className="h-4 w-4 text-emerald-700" />,
    },
    {
      key: "registrationAlertsEnabled",
      title: "New Society Registration & Onboarding Alerts",
      description: "Alerts when a new cooperative federation submits founding dossiers or bylaws awaiting Super Admin seal.",
      icon: <Building2 className="h-4 w-4 text-blue-600" />,
    },
  ];

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center space-x-2">
          <BellRing className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          <CardTitle className="text-base font-bold text-foreground">
            Administrative Alert Preferences
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Configure which operational signals dispatch real-time alerts into your Super Admin notification center.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 divide-y">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
          >
            <div className="space-y-1 flex-1">
              <div className="flex items-center space-x-2">
                {item.icon}
                <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                {item.description}
              </p>
            </div>

            <div className="flex items-center space-x-3 self-end sm:self-auto shrink-0 pl-6 sm:pl-0">
              <span className="text-xs font-semibold text-foreground">
                {preferences[item.key] ? "Subscribed" : "Muted"}
              </span>
              <Switch
                checked={preferences[item.key]}
                onCheckedChange={(val) => onTogglePreference(item.key, val)}
                disabled={isSaving}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
