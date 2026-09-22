"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, CheckCircle2 } from "lucide-react";
import type { WorkforceAllocationRecommendation } from "../types";

interface SmartRecommendationCardProps {
  recommendations: WorkforceAllocationRecommendation[];
  onInspectRecommendation?: (rec: WorkforceAllocationRecommendation) => void;
  isLoading?: boolean;
}

export function SmartRecommendationCard({
  recommendations,
  onInspectRecommendation,
  isLoading,
}: SmartRecommendationCardProps) {
  if (isLoading) {
    return (
      <Card className="border shadow-xs p-6">
        <div className="h-44 animate-pulse bg-muted/40 rounded-lg" />
      </Card>
    );
  }

  return (
    <Card className="border shadow-xs border-border bg-card">
      <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-bold text-foreground">
              Allocation Opportunities
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Demand shortages matched with available qualified workforce.
          </CardDescription>
        </div>

        <Badge
          variant="outline"
          className="text-xs font-medium self-start sm:self-auto bg-muted/40"
        >
          Advisory
        </Badge>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {recommendations.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border/80 bg-muted/10 space-y-1">
            <CheckCircle2 className="h-6 w-6 text-muted-foreground mx-auto mb-1.5" />
            <h4 className="text-sm font-semibold text-foreground">
              No Allocation Opportunities
            </h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Demand and local workforce capacity are currently balanced across active regions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec) => {
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
                <div
                  key={rec.id}
                  className="p-4 rounded-xl border bg-card hover:border-border/80 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2 pb-1">
                      <h4 className="text-sm font-bold text-foreground leading-snug">
                        {city} — {trade}
                      </h4>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-medium bg-muted/40 shrink-0"
                      >
                        Advisory
                      </Badge>
                    </div>

                    <div className="space-y-1.5 py-2.5 border-y border-border/60 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Demand</span>
                        <span className="font-mono font-semibold text-foreground">
                          {demand}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Local available</span>
                        <span className="font-mono font-medium text-foreground">
                          {localAvailable}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Shortage</span>
                        <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                          {shortage}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs pt-1">
                      <div>
                        <span className="text-[11px] text-muted-foreground block">
                          Potential support
                        </span>
                        <span className="font-semibold text-foreground">
                          {rec.suggestedHeadcount} qualified workers
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground block">
                          Source:
                        </span>
                        <span className="text-muted-foreground">
                          {sourceText}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="font-medium text-foreground">Advisory</span>
                      </div>
                    </div>
                  </div>

                  {onInspectRecommendation && (
                    <div className="pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onInspectRecommendation(rec)}
                        className="w-full text-xs font-semibold hover:bg-muted/50"
                      >
                        Inspect Details
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
