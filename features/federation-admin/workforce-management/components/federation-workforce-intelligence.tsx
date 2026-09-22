"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Briefcase,
  ArrowLeftRight,
} from "lucide-react";

export interface FederationWorkforceIntelligenceData {
  federationId: string;
  totalWorkers: number;
  availableWorkersCount: number;
  underUtilizedWorkersCount: number;
  averageUtilizationRate: number;
  underUtilizedWorkers: Array<{
    workerId: string;
    workerName: string;
    profession: string;
    hourlyRate: number;
    workedHours14d: number;
    utilizationRatio: number;
    underUtilizedReason: string;
  }>;
  highDemandTrades: Array<{ trade: string; demandCount: number }>;
  workersByTrade: Record<string, { total: number; available: number; underUtilized: number }>;
  recommendations: Array<{
    id: string;
    title: string;
    targetLocation: string;
    service: string;
    shortageCount: number;
    sourceSociety: string;
    sourceLocation: string;
    suggestedHeadcount: number;
    rationale: string;
    estimatedSlaImprovement: string;
    trade?: string;
    city?: string;
    demandCount?: number;
    localAvailableCount?: number;
    candidateWorkers: Array<{
      id: string;
      name: string;
      profession: string;
      currentSociety: string;
      currentLocation: string;
      distanceKm: number;
      experienceYears: number;
    }>;
  }>;
  largeProjectDemandHeadcount: number;
  emergencyActiveTaskCount: number;
}

export function FederationWorkforceIntelligence() {
  const [data, setData] = React.useState<FederationWorkforceIntelligenceData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchIntelligence = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/federation-admin/workforce-intelligence");
      if (!res.ok) {
        throw new Error("Unable to fetch workforce intelligence data");
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      console.error("Failed to load federation intelligence:", err);
      setError(err instanceof Error ? err.message : "Failed to load intelligence");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchIntelligence();
  }, [fetchIntelligence]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6 text-center border-dashed">
        <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-foreground">Intelligence Unavailable</h4>
        <p className="text-xs text-muted-foreground mt-1">
          {error || "Could not retrieve workforce allocation data."}
        </p>
        <Button size="sm" onClick={fetchIntelligence} className="mt-3 text-xs">
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Workforce */}
        <Card className="border bg-card shadow-xs p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">
              Total Workforce
            </span>
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">
            {data.totalWorkers}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {data.availableWorkersCount} available
          </p>
        </Card>

        {/* Under-Utilized */}
        <Card className="border bg-card shadow-xs p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">
              Under-Utilized
            </span>
            <Clock className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400">
            {data.underUtilizedWorkersCount}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Below 40% utilization
          </p>
        </Card>

        {/* Average Utilization */}
        <Card className="border bg-card shadow-xs p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">
              Average Utilization
            </span>
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
            {data.averageUtilizationRate}%
          </p>
          <p className="text-[10px] text-muted-foreground">
            14-day allocation benchmark
          </p>
        </Card>

        {/* Project/Emergency Load */}
        <Card className="border bg-card shadow-xs p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">
              Project/Emergency Load
            </span>
            <Briefcase className="h-3.5 w-3.5 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-indigo-700 dark:text-indigo-400">
            {data.largeProjectDemandHeadcount} / {data.emergencyActiveTaskCount}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Active project & emergency tasks
          </p>
        </Card>
      </div>

      {/* Two-Column Grid: Left (High-Demand Trades), Right (Allocation Opportunities) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High-Demand Trades */}
        <Card className="border shadow-xs bg-card">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-bold text-foreground">
                High-Demand Trades
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] font-medium bg-muted/40">
              Past 30 Days
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {data.highDemandTrades.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No active demand requests recorded in this region.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                      <th className="p-3">Trade</th>
                      <th className="p-3 text-center">Requests</th>
                      <th className="p-3 text-center">Available</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {data.highDemandTrades.slice(0, 6).map((item) => {
                      const tradeStats = data.workersByTrade[item.trade] || {
                        total: 0,
                        available: 0,
                        underUtilized: 0,
                      };
                      const hasShortage = item.demandCount > tradeStats.available;

                      return (
                        <tr key={item.trade} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-medium text-foreground">
                            {item.trade}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-foreground">
                            {item.demandCount}
                          </td>
                          <td className="p-3 text-center font-mono font-medium text-foreground">
                            {tradeStats.available}
                          </td>
                          <td className="p-3 text-right">
                            {hasShortage ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-medium bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300"
                              >
                                Shortage
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-medium bg-muted/40 text-muted-foreground"
                              >
                                Balanced
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Allocation Opportunities */}
        <Card className="border shadow-xs bg-card">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-bold text-foreground">
                  Allocation Opportunities
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Demand shortages matched with available qualified workforce.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] font-medium bg-muted/40 shrink-0">
              Advisory
            </Badge>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {data.recommendations.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground space-y-1">
                <CheckCircle2 className="h-6 w-6 text-muted-foreground mx-auto" />
                <p className="font-semibold text-foreground">No Current Shortages</p>
                <p>Workforce allocation is balanced across active trades.</p>
              </div>
            ) : (
              data.recommendations.slice(0, 3).map((rec) => {
                const city =
                  rec.city ||
                  (rec.targetLocation.includes("(")
                    ? rec.targetLocation.split("(")[1].replace(")", "")
                    : rec.targetLocation);
                const trade = rec.trade || rec.service.replace(/ Services$/, "");
                const demand =
                  rec.demandCount ??
                  (rec.shortageCount + (rec.localAvailableCount ?? 0));
                const localAvailable = rec.localAvailableCount ?? 0;
                const shortage = rec.shortageCount;
                const sourceText = rec.sourceSociety
                  ? `${rec.sourceSociety} (${rec.sourceLocation})`
                  : rec.sourceLocation || "Nearby cooperative region";

                return (
                  <div key={rec.id} className="p-3.5 rounded-lg border bg-card space-y-2.5 text-xs">
                    <div className="flex items-center justify-between pb-1">
                      <span className="font-bold text-foreground">
                        {city} — {trade}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-medium bg-muted/40">
                        Advisory
                      </Badge>
                    </div>

                    <div className="space-y-1 py-2 border-y border-border/60 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Demand</span>
                        <span className="font-mono font-semibold text-foreground">{demand}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Local available</span>
                        <span className="font-mono font-medium text-foreground">{localAvailable}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Shortage</span>
                        <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                          {shortage}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-0.5 text-xs">
                      <div>
                        <span className="text-[11px] text-muted-foreground block">
                          Potential support
                        </span>
                        <span className="font-semibold text-foreground">
                          {rec.suggestedHeadcount} qualified workers
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground block">Source:</span>
                        <span className="text-muted-foreground">{sourceText}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="font-medium text-foreground">Advisory</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Under-Utilized Workforce */}
      <Card className="border shadow-xs bg-card">
        <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-sm font-bold text-foreground">
                Under-Utilized Workforce
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              {data.underUtilizedWorkersCount} workers below 40% utilization
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-medium self-start sm:self-auto bg-muted/40">
            Past 14 Days
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                  <th className="p-3">Worker</th>
                  <th className="p-3">Trade</th>
                  <th className="p-3 text-center">Worked Hours</th>
                  <th className="p-3 text-center">Utilization</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {data.underUtilizedWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                      All verified workers are currently meeting expected utilization benchmarks.
                    </td>
                  </tr>
                ) : (
                  data.underUtilizedWorkers.map((w) => (
                    <tr key={w.workerId} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-semibold text-foreground">
                        {w.workerName}
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-[10px] font-medium">
                          {w.profession}
                        </Badge>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-foreground">
                        {w.workedHours14d} hrs
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-amber-700 dark:text-amber-400">
                        {(w.utilizationRatio * 100).toFixed(0)}%
                      </td>
                      <td className="p-3 text-right">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 cursor-help"
                          title={w.underUtilizedReason || "<40% bi-weekly booking allocation"}
                        >
                          Under-Utilized
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
