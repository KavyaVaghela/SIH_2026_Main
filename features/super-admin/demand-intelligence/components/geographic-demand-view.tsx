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
  Layers,
  Globe2,
  Building2,
  TrendingUp,
} from "lucide-react";
import { Map, MapMarker } from "@/components/maps";
import type { GeographicDemandCluster, LocationStatusCategory } from "../types";

interface GeographicDemandViewProps {
  clusters: GeographicDemandCluster[];
  onSelectLocation?: (locationName: string) => void;
  isLoading?: boolean;
}

const PAN_INDIA_CENTER = { lat: 21.7679, lng: 78.8718 };
const DEFAULT_ZOOM = 5;

export function GeographicDemandView({
  clusters,
  onSelectLocation,
  isLoading,
}: GeographicDemandViewProps) {
  const [viewMode, setViewMode] = React.useState<"MAP" | "CLUSTERS">("MAP");
  const [selectedClusterId, setSelectedClusterId] = React.useState<string | null>(null);
  const [mapCenter, setMapCenter] = React.useState<{ lat: number; lng: number }>(PAN_INDIA_CENTER);
  const [mapZoom, setMapZoom] = React.useState<number>(DEFAULT_ZOOM);

  // Compute aggregated real stats from clusters
  const totalWorkers = React.useMemo(
    () => clusters.reduce((acc, c) => acc + (c.availableWorkersCount || 0), 0),
    [clusters]
  );
  const totalRequests = React.useMemo(
    () => clusters.reduce((acc, c) => acc + (c.requestsCount || 0), 0),
    [clusters]
  );
  const uniqueStatesCount = React.useMemo(() => {
    const states = new Set(
      clusters.map((c) => {
        const parts = c.district.split(", ");
        return parts.length > 1 ? parts[1].trim() : c.district;
      })
    );
    return Math.max(states.size, 1);
  }, [clusters]);

  const handleSelectFederation = (cluster: GeographicDemandCluster) => {
    setSelectedClusterId(cluster.id);
    if (cluster.coordinates && cluster.coordinates.lat && cluster.coordinates.lng) {
      setMapCenter({ lat: cluster.coordinates.lat, lng: cluster.coordinates.lng });
      setMapZoom(11);
    }
    if (onSelectLocation) {
      onSelectLocation(cluster.locationName);
    }
  };

  const handleResetPanIndia = () => {
    setSelectedClusterId(null);
    setMapCenter(PAN_INDIA_CENTER);
    setMapZoom(DEFAULT_ZOOM);
  };

  if (isLoading) {
    return (
      <Card className="border bg-card shadow-xs p-6">
        <div className="h-96 animate-pulse bg-muted/40 rounded-xl flex items-center justify-center">
          <div className="text-center space-y-2">
            <Compass className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-xs text-muted-foreground font-medium">Loading Pan-India Federation Intelligence...</p>
          </div>
        </div>
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
    <Card className="border bg-card shadow-xs">
      <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Compass className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            <CardTitle className="text-base font-bold text-foreground">
              Geographic Intelligence & Cooperative Federation Network
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Live pan-India geographic distribution of registered federations, regional trade hotspots, and active service capacity
          </CardDescription>
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-1 bg-muted/60 p-1 rounded-lg border self-start sm:self-auto shrink-0">
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
            <Globe2 className="h-3.5 w-3.5 mr-1.5" />
            Interactive Map ({clusters.length})
          </Button>

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
            <Building2 className="h-3.5 w-3.5 mr-1.5" />
            Regional Hotspots ({clusters.length})
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border bg-muted/20 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Federations</span>
              <Building2 className="h-3.5 w-3.5 text-emerald-700" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-foreground">{clusters.length}</span>
              <span className="text-[10px] text-muted-foreground">Mapped</span>
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-muted/20 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">States Covered</span>
              <Globe2 className="h-3.5 w-3.5 text-sky-700" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-foreground">{uniqueStatesCount}</span>
              <span className="text-[10px] text-muted-foreground">Pan-India</span>
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-muted/20 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Workforce</span>
              <Users className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                {totalWorkers}
              </span>
              <span className="text-[10px] text-muted-foreground">Available</span>
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-muted/20 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Demand Volume</span>
              <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400">
                {totalRequests}
              </span>
              <span className="text-[10px] text-muted-foreground">Requests</span>
            </div>
          </div>
        </div>

        {viewMode === "MAP" ? (
          <div className="space-y-3">
            {/* Quick Federation Jump Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 text-xs">
              <Button
                variant={selectedClusterId === null ? "default" : "outline"}
                size="sm"
                onClick={handleResetPanIndia}
                className={
                  selectedClusterId === null
                    ? "bg-emerald-800 text-white hover:bg-emerald-900 h-6 px-2.5 text-[11px] shrink-0 font-medium"
                    : "h-6 px-2.5 text-[11px] shrink-0 border-muted-foreground/30 text-foreground"
                }
              >
                Pan-India View
              </Button>
              {clusters.map((cluster) => {
                const isSelected = selectedClusterId === cluster.id;
                const shortName = cluster.societyName
                  .replace(" Cooperative", "")
                  .replace(" Federation", "")
                  .replace(" Guild", "");

                return (
                  <Button
                    key={cluster.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSelectFederation(cluster)}
                    className={
                      isSelected
                        ? "bg-emerald-800 text-white hover:bg-emerald-900 h-6 px-2.5 text-[11px] shrink-0 font-medium"
                        : "h-6 px-2.5 text-[11px] shrink-0 border-muted-foreground/20 text-muted-foreground hover:text-foreground"
                    }
                  >
                    <MapPin className="h-2.5 w-2.5 mr-1 text-emerald-700 inline shrink-0" />
                    {shortName}
                  </Button>
                );
              })}
            </div>

            {/* Interactive Map Component */}
            <div className="rounded-xl overflow-hidden border shadow-xs bg-slate-950">
              <Map
                center={mapCenter}
                zoom={mapZoom}
                className="w-full h-96 sm:h-[460px]"
              >
                {clusters.map((cluster) => (
                  <MapMarker
                    key={cluster.id}
                    position={cluster.coordinates}
                    title={`${cluster.societyName} - ${cluster.district}`}
                    popupContent={`<div style="min-width: 220px; font-family: system-ui, -apple-system, sans-serif; padding: 4px;">
                      <div style="font-weight: 700; font-size: 13px; color: #064e3b; margin-bottom: 2px;">${cluster.societyName}</div>
                      <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">${cluster.district}</div>
                      <div style="display: flex; gap: 8px; background: #f8fafc; padding: 6px; border-radius: 6px; margin-bottom: 6px; border: 1px solid #e2e8f0;">
                        <div>
                          <div style="font-size: 10px; color: #64748b;">Available Workers</div>
                          <div style="font-weight: 700; font-size: 13px; color: #0284c7;">${cluster.availableWorkersCount}</div>
                        </div>
                        <div style="border-left: 1px solid #cbd5e1; padding-left: 8px;">
                          <div style="font-size: 10px; color: #64748b;">Demand Bookings</div>
                          <div style="font-weight: 700; font-size: 13px; color: #047857;">${cluster.requestsCount}</div>
                        </div>
                      </div>
                      <div style="font-size: 11px; color: #1e293b;">
                        Primary Trade: <strong>${cluster.primarySkillNeeded}</strong>
                      </div>
                    </div>`}
                    onClick={() => handleSelectFederation(cluster)}
                  />
                ))}
              </Map>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground gap-2 pt-1">
              <span>
                Showing {clusters.length} active federation locations mapped across India with live coordinates.
              </span>
              <span className="italic">
                Click any marker or chip above to inspect federation capacity and jurisdiction.
              </span>
            </div>

            {/* Selected Federation Quick Card or Top Hotspots */}
            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Top Federation Hotspots
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {clusters.slice(0, 3).map((cluster) => {
                  const netDeficit = cluster.availableWorkersCount - cluster.requestsCount;
                  return (
                    <div
                      key={cluster.id}
                      onClick={() => handleSelectFederation(cluster)}
                      className={`p-3 rounded-lg border bg-card hover:border-emerald-700/60 cursor-pointer transition-all ${
                        selectedClusterId === cluster.id ? "border-emerald-700 ring-1 ring-emerald-700/30" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className="text-xs font-bold text-foreground line-clamp-1">{cluster.societyName}</h5>
                          <p className="text-[10px] text-muted-foreground">{cluster.district}</p>
                        </div>
                        {getStatusBadge(cluster.status)}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs border-t pt-2">
                        <span className="text-muted-foreground text-[11px]">
                          Workers: <strong className="text-sky-700 dark:text-sky-400 font-mono">{cluster.availableWorkersCount}</strong>
                        </span>
                        <span className="text-muted-foreground text-[11px]">
                          Demand: <strong className="text-foreground font-mono">{cluster.requestsCount}</strong>
                        </span>
                        <span
                          className={`text-[11px] font-mono font-bold ${
                            netDeficit < 0 ? "text-rose-600" : "text-emerald-700"
                          }`}
                        >
                          {netDeficit > 0 ? `+${netDeficit}` : `${netDeficit}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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
                          {cluster.societyName}
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
                        City: {cluster.locationName}
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
