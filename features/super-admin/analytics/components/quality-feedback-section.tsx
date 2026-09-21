"use client";

import * as React from "react";
import Link from "next/link";
import { Star, MessageSquare, Award, Building2, CheckCircle2, ThumbsUp, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { QualityAnalyticsData } from "../types";

interface QualityFeedbackSectionProps {
  data: QualityAnalyticsData | null;
  isLoading?: boolean;
}

export function QualityFeedbackSection({ data, isLoading }: QualityFeedbackSectionProps) {
  if (isLoading || !data) {
    return (
      <Card className="border bg-card shadow-xs p-6 space-y-4">
        <Skeleton className="h-6 w-64 mb-2" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </Card>
    );
  }

  const { overview, distribution, federationQuality, recentComments } = data;
  const hasReviews = overview.totalReviews > 0;

  return (
    <Card className="border bg-card shadow-xs">
      <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
            <CardTitle className="text-base font-bold text-foreground">
              Platform Quality & Customer Feedback Intelligence
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Worker service ratings, customer sentiment distribution, and federation quality governance derived from completed gig reviews
          </CardDescription>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {overview.averageWorkerRating !== null ? (
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 text-xs font-bold"
            >
              <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500 inline" />
              {overview.averageWorkerRating} / 5.0 Platform Avg
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs font-medium text-muted-foreground">
              No Reviews Recorded
            </Badge>
          )}
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 text-xs font-bold"
          >
            {overview.totalReviews} Total Reviews
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* 4 Quality KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase truncate">
                Avg Worker Rating
              </span>
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-foreground mt-0.5">
              {overview.averageWorkerRating !== null ? `${overview.averageWorkerRating}` : "—"}
              <span className="text-xs font-normal text-muted-foreground ml-1">/ 5.0</span>
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              Across {overview.totalReviews} customer reviews
            </p>
          </div>

          <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase truncate">
                5-Star Share
              </span>
              <ThumbsUp className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
              {hasReviews ? `${overview.fiveStarShare}%` : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              Top satisfaction tier
            </p>
          </div>

          <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase truncate">
                Reviewed Services
              </span>
              <CheckCircle2 className="h-4 w-4 text-sky-600" />
            </div>
            <p className="text-2xl font-bold font-mono text-sky-700 dark:text-sky-400 mt-0.5">
              {overview.reviewedCompletedServicesCount}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              Distinct completed bookings
            </p>
          </div>

          <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase truncate">
                Workers Reviewed
              </span>
              <Users className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold font-mono text-foreground mt-0.5">
              {overview.workersReviewedCount}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              Craftsmen with feedback
            </p>
          </div>
        </div>

        {/* Two-Column Grid: Left (Distribution + Federation Quality), Right (Customer Comments) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Rating Distribution Stack & Federation Quality Governance */}
          <div className="space-y-6">
            {/* Rating Distribution Breakdown */}
            <div className="p-4 rounded-xl border bg-muted/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center">
                  <Award className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                  Rating Tier Distribution
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {overview.totalReviews} Verified Submissions
                </span>
              </div>

              <div className="space-y-2">
                {distribution.map((d) => (
                  <div key={d.stars} className="flex items-center space-x-3 text-xs">
                    <span className="font-bold font-mono w-7 text-muted-foreground flex items-center shrink-0">
                      {d.stars} <Star className="h-2.5 w-2.5 ml-0.5 fill-amber-500 text-amber-500" />
                    </span>
                    <div className="flex-1 bg-muted h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${d.percentage}%` }}
                      />
                    </div>
                    <span className="font-mono text-foreground w-8 text-right font-bold shrink-0">
                      {d.count}
                    </span>
                    <span className="text-[10px] text-muted-foreground w-12 text-right shrink-0">
                      {d.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Federation Service Quality Table */}
            <div className="border rounded-xl overflow-hidden">
              <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Federation Service Quality
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Derived from worker reviews
                </span>
              </div>

              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                      <th className="p-2.5">Cooperative Society</th>
                      <th className="p-2.5 text-center">Location</th>
                      <th className="p-2.5 text-center">Craftsmen</th>
                      <th className="p-2.5 text-center">Reviews</th>
                      <th className="p-2.5 text-right">Avg Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {federationQuality.map((fed) => (
                      <tr key={fed.federationId} className="hover:bg-muted/20 transition-colors">
                        <td className="p-2.5 font-medium text-foreground max-w-[180px] truncate" title={fed.federationName}>
                          <Link
                            href={`/super-admin/societies/${fed.federationId}`}
                            className="hover:text-emerald-700 hover:underline"
                          >
                            {fed.federationName}
                          </Link>
                        </td>
                        <td className="p-2.5 text-center text-muted-foreground">
                          {fed.city}
                        </td>
                        <td className="p-2.5 text-center font-mono text-muted-foreground">
                          {fed.totalWorkers}
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-foreground">
                          {fed.reviewCount > 0 ? (
                            <span>{fed.reviewCount}</span>
                          ) : (
                            <span className="text-muted-foreground/60 font-normal">0</span>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold">
                          {fed.averageRating !== null ? (
                            <span className="text-amber-600 dark:text-amber-400 flex items-center justify-end">
                              <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                              {fed.averageRating}
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-normal">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Recent Customer Comments Feed */}
          <div className="border rounded-xl flex flex-col justify-between overflow-hidden bg-card">
            <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Recent Customer Feedback
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Verified customer remarks
              </span>
            </div>

            <div className="p-3 space-y-2.5 max-h-[460px] overflow-y-auto">
              {recentComments.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground space-y-1">
                  <p className="text-xs font-semibold text-foreground">No Customer Comments Recorded</p>
                  <p className="text-[11px]">As completed bookings receive feedback, customer remarks will appear here.</p>
                </div>
              ) : (
                recentComments.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-1.5">
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                              key={idx}
                              className={`h-3 w-3 ${
                                idx < c.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-bold font-mono text-foreground">
                          {c.rating}.0
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-foreground italic">
                      &ldquo;{c.comment}&rdquo;
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                      <span>{c.serviceTitle} · {c.workerProfession}</span>
                      <span className="font-medium text-emerald-800 dark:text-emerald-300 truncate max-w-[140px]">
                        {c.federationName}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t bg-muted/20 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Showing {recentComments.length} recent written reviews</span>
              <span className="font-semibold text-foreground">100% Genuine Client Submissions</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
