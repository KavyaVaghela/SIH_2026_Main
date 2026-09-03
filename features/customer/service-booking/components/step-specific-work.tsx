"use client";

import * as React from "react";
import { ChevronRight, ArrowLeft, CheckCircle2, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { serviceCatalogService, ServiceCategory, ServiceItem } from "@/features/services/services/service-catalog-service";

export interface StepSpecificWorkProps {
  category: ServiceCategory | null;
  selectedService: ServiceItem | null;
  onSelectService: (service: ServiceItem) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepSpecificWork({
  category,
  selectedService,
  onSelectService,
  onNext,
  onBack,
}: StepSpecificWorkProps) {
  const [services, setServices] = React.useState<ServiceItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (category) {
      serviceCatalogService.getServicesByCategory(category.id).then((data) => {
        setServices(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [category]);

  if (!category) {
    return (
      <Card className="p-6 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-500">Please select a category in Step 1 first.</p>
        <Button size="sm" onClick={onBack} className="mt-3 text-xs">
          Go to Step 1
        </Button>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="animate-pulse space-y-4 max-w-md mx-auto">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mx-auto" />
          <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
        <p className="text-xs text-slate-400 mt-4">Loading work items for {category.name}...</p>
      </div>
    );
  }

  const isOtherSelected = selectedService?.title === "Other" || selectedService?.isOther;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Step 2: Select Specific Work
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Category: <span className="font-semibold text-emerald-700 dark:text-emerald-400">{category.name}</span>
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="text-xs border-slate-300 dark:border-slate-700 gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Change Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((srv) => {
          const isSelected = selectedService?.id === srv.id;

          return (
            <Card
              key={srv.id}
              onClick={() => onSelectService(srv)}
              className={`p-4 cursor-pointer transition-all border rounded-xl flex flex-col justify-between ${
                isSelected
                  ? "bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-600 dark:border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-sm"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    {srv.title}
                    {srv.title === "Other" && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[9px]">
                        Custom Scope
                      </Badge>
                    )}
                  </h3>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                  {srv.description || "Standard service visit and trade task."}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Initial Estimate</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    ₹{srv.basePrice}
                    <span className="text-[10px] text-slate-400 font-normal ml-0.5">
                      ({srv.priceUnit.replace("_", " ")})
                    </span>
                  </span>
                </div>

                <Badge
                  variant="outline"
                  className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 text-[10px]"
                >
                  Min Visit: ₹{srv.minimumVisitCharge}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Helper message when "Other" is selected */}
      {isOtherSelected && (
        <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-300 dark:border-amber-800 flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-amber-900 dark:text-amber-200">
              Custom Service Requested (&quot;Other&quot;)
            </h4>
            <p className="text-amber-800 dark:text-amber-300 font-medium">
              Please describe the specific work you need in the description below.
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              This is an initial estimate based on standard cooperative pricing. The final bill may change depending on the actual work required, materials used, work complexity, and any additional work approved by you.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" size="sm" onClick={onBack} className="text-xs border-slate-300">
          Back
        </Button>
        <Button
          disabled={!selectedService}
          onClick={onNext}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-6 gap-1.5"
        >
          Continue to Problem Details
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
