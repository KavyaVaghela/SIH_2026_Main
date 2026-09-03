"use client";

import * as React from "react";
import { Star, ShieldCheck, MapPin, Award, ChevronRight, User, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { matchingService, WorkerMatchResult } from "@/features/matching/services/matching-service";

export interface RecommendedWorkersSectionProps {
  onBookWorker?: (workerId: string) => void;
  onViewAll?: () => void;
}

export function RecommendedWorkersSection({
  onBookWorker,
  onViewAll,
}: RecommendedWorkersSectionProps) {
  const [workers, setWorkers] = React.useState<WorkerMatchResult[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    matchingService
      .findEligibleWorkers({
        customerLatitude: 23.0300, // Satellite, Ahmedabad
        customerLongitude: 72.5178,
        maxRadiusKm: 15,
      })
      .then((results) => {
        setWorkers(results.slice(0, 3)); // Display top 3 real backend recommended workers
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load recommended workers", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center shadow-sm rounded-xl">
        <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Loading recommended nearby cooperative workers...</p>
      </Card>
    );
  }

  if (workers.length === 0) {
    return (
      <Card className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 p-6 text-center shadow-sm rounded-xl">
        <User className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No Recommended Workers Available Nearby</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Currently no cooperative workers are active within your immediate radius. Try searching for specific services.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Recommended Nearby Cooperative Workers
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verified members from local worker cooperative societies
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 gap-1 p-0 font-medium"
          onClick={onViewAll}
        >
          View All
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {workers.map((match) => {
          const w = match.worker;
          const p = w.extendedProfile;

          return (
            <Card
              key={w.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between shadow-sm hover:shadow-md rounded-xl"
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {p.avatarUrl ? (
                      /* eslint-disable-next-html-element-content-type */
                      /* eslint-disable-next-html-element-attribute */
                      <img
                        src={p.avatarUrl}
                        alt={p.fullName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
                      />
                    ) : (
                      <div className="p-2.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1">
                        {p.fullName}
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                        {p.primarySkill}
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-[10px] gap-0.5 font-bold">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    {p.rating.toFixed(1)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-2 space-y-3">
                {/* Cooperative Verification Badge */}
                <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified Worker
                    </span>
                    <span className="text-slate-500 font-medium">{p.experienceYears} yrs exp</span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 truncate font-medium">
                    {p.cooperativeName}
                  </div>
                </div>

                {/* Location & Jobs Stats */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{match.tierBreakdown.distanceKm} km away</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                    <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{p.completedJobsCount} jobs</span>
                  </div>
                </div>

                {/* Price & Action Button */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Rate</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">₹{w.hourlyRate}<span className="text-[10px] text-slate-500 font-normal">/hr</span></span>
                  </div>

                  <Button
                    size="sm"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3"
                    onClick={() => onBookWorker?.(w.id)}
                  >
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
