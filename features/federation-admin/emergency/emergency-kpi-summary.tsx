"use client";

import * as React from "react";
import { ShieldAlert, Clock, AlertTriangle, Users, Play, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FederationIncidentSummary } from "@/lib/emergency/control-center-store";

interface EmergencyKpiSummaryProps {
  incidents: FederationIncidentSummary[];
}

export function EmergencyKpiSummary({ incidents }: EmergencyKpiSummaryProps) {
  const activeEmergencies = incidents.filter(
    (i) => i.status !== "RESOLVED" && i.status !== "CLOSED" && i.status !== "CANCELLED"
  ).length;
  const awaitingResponse = incidents.filter((i) => i.status === "AWAITING_RESPONSE").length;
  const shortages = incidents.filter((i) => i.has_shortage).length;
  const forming = incidents.filter((i) => i.status === "TEAM_FORMING" || i.status === "DISPATCHING").length;
  const activeResponse = incidents.filter((i) => i.status === "ACTIVE").length;
  const criticalHigh = incidents.filter(
    (i) => (i.severity === "CRITICAL" || i.severity === "HIGH") && i.status !== "RESOLVED" && i.status !== "CLOSED" && i.status !== "CANCELLED"
  ).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {/* 1. Active Emergencies */}
      <Card className="border-border bg-card">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Active Total</p>
            <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">{activeEmergencies}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Awaiting Response */}
      <Card className={`border-border ${awaitingResponse > 0 ? "bg-amber-500/10 border-amber-500/40" : "bg-card"}`}>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Awaiting Response</p>
            <h3 className={`text-2xl font-bold tracking-tight mt-1 ${awaitingResponse > 0 ? "text-amber-500" : "text-foreground"}`}>
              {awaitingResponse}
            </h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Clock className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* 3. Staffing Shortages */}
      <Card className={`border-border ${shortages > 0 ? "bg-amber-950/20 border-amber-500/40" : "bg-card"}`}>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Staffing Shortages</p>
            <h3 className={`text-2xl font-bold tracking-tight mt-1 ${shortages > 0 ? "text-amber-500" : "text-foreground"}`}>
              {shortages}
            </h3>
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${shortages > 0 ? "bg-amber-500/10 text-amber-500 border border-amber-500/30" : "bg-muted text-muted-foreground"}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* 4. Team Forming */}
      <Card className="border-border bg-card">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Teams Forming</p>
            <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">{forming}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <Users className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* 5. Active Response */}
      <Card className="border-border bg-card">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Active Operations</p>
            <h3 className="text-2xl font-bold tracking-tight text-emerald-500 mt-1">{activeResponse}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Play className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* 6. Critical / High Priority */}
      <Card className="border-border bg-card">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Critical / High</p>
            <h3 className="text-2xl font-bold tracking-tight text-red-500 mt-1">{criticalHigh}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
