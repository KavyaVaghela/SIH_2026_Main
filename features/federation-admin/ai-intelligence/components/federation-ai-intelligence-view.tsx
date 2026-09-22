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
  BrainCircuit,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Users,
  Clock,
  Briefcase,
  CheckCircle2,
  HelpCircle,
  BarChart2,
  ShieldAlert,
} from "lucide-react";
import type {
  FederationDemandContext,
  FederationAiIntelligenceResponse,
  ForecastLevel,
} from "@/lib/ai/ai-types";

export function FederationAiIntelligenceView() {
  const [context, setContext] = React.useState<FederationDemandContext | null>(null);
  const [intelligence, setIntelligence] =
    React.useState<FederationAiIntelligenceResponse | null>(null);
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // 1. Initial Load: Fetch factual platform metrics ONLY (mode=context-only, no Groq call)
  const fetchFactualContext = React.useCallback(async () => {
    setIsInitialLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/federation-admin/ai-intelligence?mode=context-only");
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: Unable to load federation operational metrics`);
      }
      const data = await res.json();
      setContext(data.context);
    } catch (err: unknown) {
      console.error("[FederationAiView] Context fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load platform data");
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchFactualContext();
  }, [fetchFactualContext]);

  // 2. Explicit User Action: Trigger Groq AI Intelligence interpretation
  const handleGenerateIntelligence = async () => {
    setIsAiLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/federation-admin/ai-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setContext(data.context);
      setIntelligence(data.intelligence);
    } catch (err: unknown) {
      console.error("[FederationAiView] AI generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate AI intelligence");
    } finally {
      setIsAiLoading(false);
    }
  };

  const getOutlookBadgeClass = (level: ForecastLevel) => {
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

  if (isInitialLoading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="h-14 w-80 bg-muted/40 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  // Calculate total regional demand gap
  const totalDemandGap =
    context?.demand_gaps.reduce((acc, g) => acc + Math.max(0, g.demand_gap), 0) || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="h-6 w-6 text-foreground" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              AI Intelligence
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            {context?.federation_name ? `${context.federation_name} — ` : ""}
            AI-assisted interpretation of workforce and service demand.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <Badge variant="outline" className="text-xs font-medium bg-muted/40">
            AI-generated advisory
          </Badge>
          <Button
            size="sm"
            onClick={handleGenerateIntelligence}
            disabled={isAiLoading || !context}
            className="text-xs font-semibold h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isAiLoading ? "animate-spin" : ""}`} />
            {intelligence ? "Refresh Intelligence" : "Generate Intelligence"}
          </Button>
        </div>
      </div>

      {/* Error notification banner when context failed to load */}
      {error && !context && (
        <div className="p-3.5 rounded-lg border border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-800 dark:text-rose-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Platform data could not be loaded</p>
              <p className="text-rose-700 dark:text-rose-400">{error}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchFactualContext}
            className="text-xs h-7 shrink-0"
          >
            Retry Connection
          </Button>
        </div>
      )}

      {/* Error notification banner when AI generation failed (context is present) */}
      {error && context && (
        <div className="p-3 rounded-lg border border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateIntelligence}
            className="text-xs h-7"
          >
            Retry
          </Button>
        </div>
      )}

      {/* 4 Compact Operational KPI Cards (Real Platform Data) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Active Workforce */}
        <Card className="border bg-card shadow-xs p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">
              Active Workforce
            </span>
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">
            {context ? context.workforce.total_active : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {context ? `${context.workforce.available} qualified available` : "Awaiting data"}
          </p>
        </Card>

        {/* Under-Utilized Workforce */}
        <Card className="border bg-card shadow-xs p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">
              Under-Utilized Workforce
            </span>
            <Clock className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400">
            {context ? context.workforce.underutilized : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {context ? "<40% bi-weekly capacity" : "Awaiting data"}
          </p>
        </Card>

        {/* Current Demand */}
        <Card className="border bg-card shadow-xs p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">
              Current Demand
            </span>
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">
            {context ? context.demand.current_period : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {context ? `Trend: ${context.demand.trend || "STABLE"}` : "Awaiting data"}
          </p>
        </Card>

        {/* Demand Gap */}
        <Card className="border bg-card shadow-xs p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">
              Demand Gap
            </span>
            <Briefcase className="h-3.5 w-3.5 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-indigo-700 dark:text-indigo-400">
            {context ? totalDemandGap : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {context ? "Unmet service requests" : "Awaiting data"}
          </p>
        </Card>
      </div>

      {/* Main AI Intelligence Section */}
      <div className="space-y-6">
        {/* Initial Prompt State (Before User Clicks Generate) */}
        {!intelligence && !isAiLoading && (
          <Card className="border shadow-xs border-border bg-card">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center space-x-2">
                <BarChart2 className="h-4 w-4 text-foreground" />
                <CardTitle className="text-sm font-bold text-foreground">
                  AI Operations Summary
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Synthesize platform booking volume, trade demand gaps, and under-utilized workforce capacity.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 text-center space-y-3">
              <BrainCircuit className="h-8 w-8 text-muted-foreground mx-auto" />
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="text-sm font-semibold text-foreground">
                  Operational Interpretation Ready
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Click &ldquo;Generate Intelligence&rdquo; to analyze verified metrics for{" "}
                  <strong className="text-foreground">{context?.federation_name}</strong> ({context?.region}).
                  Zero synthetic numbers are generated; insights strictly interpret factual platform data.
                </p>
              </div>
              <div className="pt-2">
                <Button
                  size="sm"
                  onClick={handleGenerateIntelligence}
                  className="text-xs font-semibold"
                >
                  <BrainCircuit className="h-3.5 w-3.5 mr-1.5" />
                  Generate Intelligence
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State during AI Request */}
        {isAiLoading && (
          <Card className="border shadow-xs border-border p-6 space-y-4 animate-pulse">
            <div className="h-5 w-48 bg-muted/60 rounded" />
            <div className="h-16 w-full bg-muted/30 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-28 bg-muted/30 rounded-lg" />
              <div className="h-28 bg-muted/30 rounded-lg" />
            </div>
          </Card>
        )}

        {/* Structured AI Intelligence Output */}
        {intelligence && !isAiLoading && (
          <div className="space-y-6">
            {/* 1. AI Operations Summary & Demand Outlook */}
            <Card className="border shadow-xs bg-card">
              <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <BarChart2 className="h-4 w-4 text-foreground" />
                    <CardTitle className="text-sm font-bold text-foreground">
                      AI Operations Summary
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                    {context?.federation_name} &bull; Territory: {context?.region}
                  </CardDescription>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground font-medium">Demand Outlook:</span>
                  <Badge
                    variant="outline"
                    className={`text-xs font-mono font-bold uppercase ${getOutlookBadgeClass(
                      intelligence.outlook_level
                    )}`}
                  >
                    {intelligence.outlook_level}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-5">
                {/* 2. Demand Outlook Statement */}
                <div className="space-y-1.5 p-3 rounded-lg border bg-muted/20">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                    Demand Outlook
                  </span>
                  <p className="text-xs font-semibold text-foreground leading-relaxed">
                    &ldquo;{intelligence.outlook}&rdquo;
                  </p>
                </div>

                {/* Two-Column Grid: Key Factors & Workforce Insight */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 3. Key Factors */}
                  <div className="p-3.5 rounded-lg border bg-card space-y-2">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">
                      Key Factors
                    </span>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {intelligence.key_factors.map((factor, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-foreground font-bold">&bull;</span>
                          <span className="leading-snug">{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 4. Workforce Insight */}
                  <div className="p-3.5 rounded-lg border bg-card space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">
                        Workforce Insight
                      </span>
                      <p className="text-xs text-foreground font-medium leading-relaxed mt-1">
                        &ldquo;{intelligence.workforce_insight}&rdquo;
                      </p>
                    </div>

                    <div className="pt-2 border-t text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>Available Capacity:</span>
                      <span className="font-mono font-bold text-foreground">
                        {context?.workforce.available} / {context?.workforce.total_active} craftsmen
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Recommended Actions */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">
                    Recommended Actions
                  </span>
                  <div className="p-3 rounded-lg border bg-card space-y-1.5">
                    {intelligence.recommended_actions.map((action, idx) => (
                      <div key={idx} className="flex items-start space-x-2 text-xs text-foreground font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. Metadata Footer: Confidence & Advisory Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t text-[11px] text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <span>Confidence:</span>
                    <span className="font-mono font-bold text-foreground">
                      {intelligence.confidence}
                    </span>
                    {intelligence.is_fallback && (
                      <span className="text-amber-700 dark:text-amber-400 font-medium">
                        (Deterministic Platform Intelligence)
                      </span>
                    )}
                  </div>
                  <div className="italic text-[10px]">
                    {intelligence.disclaimer}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trade-Level Demand Gap Diagnostic Table */}
            {context && context.demand_gaps.length > 0 && (
              <Card className="border shadow-xs bg-card">
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <CardTitle className="text-sm font-bold text-foreground">
                      Trade Demand & Capacity Balance
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Deterministic breakdown of booking demand vs available qualified workers
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    Past 30 Days
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                          <th className="p-3">Trade</th>
                          <th className="p-3 text-center">Demand (Bookings)</th>
                          <th className="p-3 text-center">Available Qualified</th>
                          <th className="p-3 text-center">Demand Gap (Unmet Jobs)</th>
                          <th className="p-3 text-right">Operational Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {context.demand_gaps.map((item) => (
                          <tr key={item.trade} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3 font-semibold text-foreground">
                              {item.trade}
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-foreground">
                              {item.demand}
                            </td>
                            <td className="p-3 text-center font-mono font-medium text-foreground">
                              {item.available_qualified_workers}
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-indigo-700 dark:text-indigo-400">
                              {item.demand_gap}
                            </td>
                            <td className="p-3 text-right">
                              {item.demand_gap > 0 ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-medium bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300"
                                >
                                  Demand Gap
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-medium bg-muted/40 text-muted-foreground"
                                >
                                  Adequate
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
