"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Users,
  Compass,
  ArrowUpRight,
  Activity,
  Layers,
} from "lucide-react";
import { Map } from "@/components/maps/map";
import type { GeographicDemandCluster, LocationStatusCategory } from "../types";

interface GeographicDemandViewProps {
  clusters: GeographicDemandCluster[];
  onSelectLocation?: (locationName: string) => void;
  isLoading?: boolean;
}

export function GeographicDemandView({
  clusters,
  onSelectLocation,
  isLoading,
}: GeographicDemandViewProps) {
  const [viewMode, setViewMode] = React.useState<"CLUSTERS" | "MAP">("CLUSTERS");

  if (isLoading) {
    return (
      <Card className="border shadow-sm p-6">
        <div className="h-64 animate-pulse bg-muted/40 rounded-lg" />
      </Card>
    );
  }

  const getStatusBadge = (status: LocationStatusCategory) => {
    switch (status) {
      case "HIGH_DEMAND":
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 text-[10px] font-bold"
          >
            <Flame className="h-3 w-3 mr-1 text-amber-600 inline" />
            High Demand
          </Badge>
        );
      case "WORKER_SHORTAGE":
        return (
          <Badge
            variant="outline"
            className="bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 text-[10px] font-bold"
          >
            <AlertTriangle className="h-3 w-3 mr-1 text-rose-600 inline" />
            Worker Shortage
          </Badge>
        );
      case "WORKFORCE_SURPLUS":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950/70 dark:text-blue-200 text-[10px] font-bold"
          >
            <Layers className="h-3 w-3 mr-1 text-blue-600 inline" />
            Workforce Surplus
          </Badge>
        );
      case "BALANCED":
      default:
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 text-[10px] font-bold"
          >
            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600 inline" />
            Balanced
          </Badge>
        );
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Compass className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            <CardTitle className="text-base font-bold text-foreground">
              Geographic Demand & Regional Hotspots
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Territory cluster classification based on incoming bookings, deficit index, and cooperative response capacity
          </CardDescription>
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-1 bg-muted/60 p-1 rounded-lg border self-start sm:self-auto shrink-0">
          <Button
            variant={viewMode === "CLUSTERS" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("CLUSTERS")}
            className={
              viewMode === "CLUSTERS"
                ? "bg-emerald-800 text-white hover:bg-emerald-900 h-7 px-3 text-xs font-semibold shadow-xs"
                : "h-7 px-3 text-xs text-muted-foreground hover:text-foreground"
            }
          >
            Regional Hotspots ({clusters.length})
          </Button>

          <Button
            variant={viewMode === "MAP" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("MAP")}
            className={
              viewMode === "MAP"
                ? "bg-emerald-800 text-white hover:bg-emerald-900 h-7 px-3 text-xs font-semibold shadow-xs"
                : "h-7 px-3 text-xs text-muted-foreground hover:text-foreground"
            }
          >
            Interactive Map
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {viewMode === "MAP" ? (
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden border">
              <Map
                center={{ lat: 19.076, lng: 72.8777 }} // Mumbai Metropolitan Region default center
                zoom={11}
                className="w-full h-80 sm:h-96"
              />
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              Coordinates pinned to active cooperative districts in Mumbai, Thane, Navi Mumbai, and Pune.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {clusters.map((cluster) => {
              const netDeficit = cluster.availableWorkersCount - cluster.requestsCount;

              return (
                <div
                  key={cluster.id}
                  className="p-3.5 rounded-xl border bg-card hover:border-emerald-700/50 hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-foreground flex items-center">
                          <MapPin className="h-3.5 w-3.5 mr-1 text-emerald-700 shrink-0" />
                          {cluster.locationName}
                        </h4>
                        <p className="text-[11px] text-muted-foreground">{cluster.district}</p>
                      </div>

                      {getStatusBadge(cluster.status)}
                    </div>

                    <div className="p-2 rounded-lg bg-muted/30 border text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Demand Requests:</span>
                        <span className="font-bold text-foreground font-mono">{cluster.requestsCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Available Workers:</span>
                        <span className="font-bold text-sky-700 dark:text-sky-400 font-mono">
                          {cluster.availableWorkersCount}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span className="text-muted-foreground">Shortage / Surplus:</span>
                        <span
                          className={`font-mono font-bold ${
                            netDeficit < 0 ? "text-rose-600" : "text-emerald-700"
                          }`}
                        >
                          {netDeficit > 0 ? `+${netDeficit} surplus` : `${netDeficit} deficit`}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-0.5 text-xs">
                      <p className="text-[11px] text-muted-foreground">
                        Primary Need: <span className="font-semibold text-foreground">{cluster.primarySkillNeeded}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate" title={cluster.societyName}>
                        Society: {cluster.societyName}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Demand Score:</span>
                      <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400">
                        {cluster.demandScore}/100
                      </span>
                    </div>

                    {onSelectLocation && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectLocation(cluster.locationName)}
                        className="h-6 px-2 text-[11px] text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-semibold"
                      >
                        Filter Location
                        <ArrowUpRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
