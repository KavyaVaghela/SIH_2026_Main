"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, MapPin, Users, Compass, ChevronRight } from "lucide-react";
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
      <Card className="border shadow-sm p-6">
        <div className="h-44 animate-pulse bg-muted/40 rounded-lg" />
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="border shadow-sm border-emerald-300/70 dark:border-emerald-800/60 bg-gradient-to-br from-card via-card to-emerald-950/5 dark:to-emerald-950/20">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          <CardTitle className="text-base font-bold text-foreground">
            Smart Workforce Cross-Allocation Recommendations
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Algorithmic reallocation proposals pairing deficit districts with neighboring surplus cooperative craftsmen
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-xl border bg-card hover:border-emerald-600/50 hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                {/* Visual Location Transfer Badge */}
                <div className="flex items-center space-x-1 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg border">
                  <span className="font-semibold text-foreground truncate max-w-[90px]">
                    {rec.sourceLocation}
                  </span>
                  <ArrowRight className="h-3 w-3 text-emerald-700 shrink-0" />
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 truncate max-w-[90px]">
                    {rec.targetLocation}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-foreground leading-snug">
                  {rec.title}
                </h4>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {rec.rationale}
                </p>

                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-200 font-semibold space-y-0.5">
                  <p>Suggested Headcount: {rec.suggestedHeadcount} Craftsmen</p>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                    {rec.estimatedSlaImprovement}
                  </p>
                </div>
              </div>

              {onInspectRecommendation && (
                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onInspectRecommendation(rec)}
                    className="w-full text-xs font-semibold border-emerald-800/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50"
                  >
                    Inspect Recommendation Details
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
