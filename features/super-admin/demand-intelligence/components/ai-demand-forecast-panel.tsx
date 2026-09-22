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
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  BarChart2,
} from "lucide-react";
import type { AiAdvisoryApiResponse, ForecastLevel } from "@/lib/ai/ai-types";

interface AiDemandForecastPanelProps {
  defaultRegion?: string;
  defaultTrade?: string;
  className?: string;
}

const REGION_OPTIONS = ["Ahmedabad", "Gandhinagar", "Surat", "Vadodara", "Rajkot"];
const TRADE_OPTIONS = [
  "Plumbing",
  "Electrical",
  "Cleaning",
  "Carpentry",
  "Painting",
  "Appliance Repair",
];

export function AiDemandForecastPanel({
  defaultRegion = "Ahmedabad",
  defaultTrade = "Plumbing",
  className = "",
}: AiDemandForecastPanelProps) {
  const [selectedRegion, setSelectedRegion] = React.useState(defaultRegion);
  const [selectedTrade, setSelectedTrade] = React.useState(defaultTrade);

  const [forecastData, setForecastData] = React.useState<AiAdvisoryApiResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Explicit user-triggered forecast request (prevents rate-limit exhaustion)
  const handleFetchForecast = async (reg = selectedRegion, tr = selectedTrade) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region: reg, trade: tr }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const data: AiAdvisoryApiResponse = await res.json();
      setForecastData(data);
    } catch (err: unknown) {
      console.warn("[AiDemandForecastPanel] Fetch error:", err);
      const msg = err instanceof Error ? err.message : "Failed to load forecast";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const getForecastBadgeColor = (level: ForecastLevel) => {
    switch (level) {
      case "CRITICAL":
        return "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300";
      case "HIGH":
        return "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300";
      case "MODERATE":
        return "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300";
      case "LOW":
        return "bg-slate-50 text-slate-800 border-slate-300 dark:bg-slate-900/60 dark:text-slate-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className={`border shadow-xs border-border bg-card ${className}`}>
      <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <BarChart2 className="h-4 w-4 text-foreground" />
            <CardTitle className="text-base font-bold text-foreground">
              AI Demand Forecast
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Advisory interpretation of regional trade demand trends based on verified platform activity.
          </CardDescription>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-[10px] font-medium bg-muted/40">
            AI-generated advisory
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFetchForecast()}
            disabled={isLoading}
            className="text-xs font-semibold h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            {forecastData ? "Refresh Forecast" : "Generate Forecast"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Operations Filter / Selector Bar */}
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg border bg-muted/20 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-muted-foreground">Region:</span>
            <select
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                if (forecastData) handleFetchForecast(e.target.value, selectedTrade);
              }}
              className="px-2.5 py-1 rounded border bg-card text-foreground font-medium text-xs focus:outline-hidden"
            >
              {REGION_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-semibold text-muted-foreground">Trade:</span>
            <select
              value={selectedTrade}
              onChange={(e) => {
                setSelectedTrade(e.target.value);
                if (forecastData) handleFetchForecast(selectedRegion, e.target.value);
              }}
              className="px-2.5 py-1 rounded border bg-card text-foreground font-medium text-xs focus:outline-hidden"
            >
              {TRADE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {forecastData && (
            <div className="ml-auto text-[11px] text-muted-foreground font-mono">
              Demand Gap: {forecastData.context.shortage} jobs &bull; Available:{" "}
              {forecastData.context.available_workers}
            </div>
          )}
        </div>

        {/* State 1: Initial Prompt (No forecast generated yet) */}
        {!forecastData && !isLoading && !error && (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border/80 bg-muted/10 space-y-2">
            <TrendingUp className="h-6 w-6 text-muted-foreground mx-auto mb-1.5" />
            <h4 className="text-sm font-semibold text-foreground">
              Advisory Forecast Ready
            </h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Select a trade and region above, then click &quot;Generate Forecast&quot; to synthesize
              real booking metrics into an operational demand outlook.
            </p>
            <div className="pt-2">
              <Button
                size="sm"
                onClick={() => handleFetchForecast()}
                className="text-xs font-semibold"
              >
                Generate Forecast for {selectedRegion} — {selectedTrade}
              </Button>
            </div>
          </div>
        )}

        {/* State 2: Loading Skeleton */}
        {isLoading && (
          <div className="space-y-3 p-4 rounded-xl border bg-muted/10 animate-pulse">
            <div className="h-4 w-48 bg-muted/60 rounded" />
            <div className="h-16 w-full bg-muted/40 rounded" />
            <div className="h-12 w-full bg-muted/30 rounded" />
          </div>
        )}

        {/* State 3: Error Message */}
        {error && !isLoading && (
          <div className="p-3 rounded-lg border border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleFetchForecast()}
              className="text-xs h-7"
            >
              Retry
            </Button>
          </div>
        )}

        {/* State 4: Structured Forecast Display */}
        {forecastData && !isLoading && (
          <div className="space-y-4">
            {/* Header: Region / Trade & Forecast Level */}
            <div className="p-4 rounded-xl border bg-muted/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
                    Region / Trade
                  </span>
                  <h4 className="text-base font-bold text-foreground">
                    {forecastData.context.region} — {forecastData.context.trade}
                  </h4>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-muted-foreground">Forecast:</span>
                  <Badge
                    variant="outline"
                    className={`text-xs font-mono font-bold uppercase ${getForecastBadgeColor(
                      forecastData.forecast.forecast_level
                    )}`}
                  >
                    {forecastData.forecast.forecast_level}
                  </Badge>
                </div>
              </div>

              {/* Outlook */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                  Outlook
                </span>
                <p className="text-xs font-medium text-foreground leading-relaxed">
                  &ldquo;{forecastData.forecast.outlook}&rdquo;
                </p>
              </div>

              {/* Key Factors */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                  Key Factors
                </span>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {forecastData.forecast.factors.map((factor, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-foreground font-bold">&bull;</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Actions */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                  Recommended Action
                </span>
                <div className="p-2.5 rounded-lg border bg-card text-xs space-y-1">
                  {forecastData.forecast.recommended_actions.map((action, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-foreground font-medium">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">&bull;</span>
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metadata Footer: Confidence & Disclaimer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t text-[11px] text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <span>Confidence:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {forecastData.forecast.confidence}
                  </span>
                  {forecastData.forecast.is_fallback && (
                    <span className="text-amber-700 dark:text-amber-400 font-medium">
                      (Deterministic Fallback)
                    </span>
                  )}
                </div>
                <div className="italic text-[10px]">
                  {forecastData.forecast.disclaimer}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
