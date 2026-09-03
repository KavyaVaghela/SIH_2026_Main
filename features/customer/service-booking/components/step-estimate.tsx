"use client";

import * as React from "react";
import { ChevronRight, ArrowLeft, Info, Receipt, ShieldCheck, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ServiceItem } from "@/features/services/services/service-catalog-service";
import { pricingService, PlatformEstimateResult } from "@/features/pricing/services/pricing-service";

export interface StepEstimateProps {
  service: ServiceItem | null;
  estimate: PlatformEstimateResult | null;
  onUpdateEstimate: (estimate: PlatformEstimateResult) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepEstimate({
  service,
  estimate,
  onUpdateEstimate,
  onNext,
  onBack,
}: StepEstimateProps) {
  React.useEffect(() => {
    if (service) {
      const calc = pricingService.calculatePlatformEstimate({
        serviceBasePrice: service.basePrice,
        minimumVisitCharge: service.minimumVisitCharge,
        estimatedHours: 1,
      });
      onUpdateEstimate(calc);
    }
  }, [service, onUpdateEstimate]);

  if (!service || !estimate) {
    return (
      <Card className="p-6 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-500">Please select a service in Step 2 to view platform estimate.</p>
        <Button size="sm" onClick={onBack} className="mt-3 text-xs">
          Go Back
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Step 4: Platform Price Estimate
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Calculated using transparent KaushalyaSetu cooperative trade pricing standards
        </p>
      </div>

      {/* Prominent Initial Estimate Notice Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-300 dark:border-amber-800 space-y-1.5 text-xs">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-extrabold tracking-wide uppercase">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>THIS IS AN INITIAL ESTIMATE — NOT THE FINAL BILL</span>
        </div>
        <p className="text-amber-950 dark:text-amber-100 font-medium">
          The amount shown is an initial estimate based on standard cooperative service rates and the information you provided. The final bill may be different after the worker assesses the actual work.
        </p>
        <p className="text-[11px] text-amber-800 dark:text-amber-300">
          Your final bill may vary based on actual work completed, materials/spare parts used, work complexity, and any additional work you approve.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Price Breakdown Card */}
        <Card className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {service.title}
                </CardTitle>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
                PLATFORM ESTIMATE
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span>Base Service Rate</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">₹{estimate.basePrice}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span>Minimum Visit Charge (MINIMUM_SERVICE_VISIT_CHARGE)</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">₹{estimate.minimumVisitCharge}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span>Platform Governance & Escrow Fee (5%)</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">₹{estimate.platformFee}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span>GST Tax (18%)</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">₹{estimate.taxAmount}</span>
              </div>
            </div>

            {/* Estimated Total Highlight Box */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-900 dark:text-emerald-200 font-bold block">
                  Initial Platform Estimate Range
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Subject to worker on-site assessment
                </span>
              </div>

              <span className="text-xl md:text-2xl font-extrabold text-emerald-800 dark:text-emerald-300">
                ₹{Math.round(estimate.estimatedTotal)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Informational Guidance Sidebar */}
        <Card className="bg-slate-50/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-3.5">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>KaushalyaSetu Pricing Policy</span>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p>
                <strong>Initial Estimate (PLATFORM_ESTIMATE):</strong> Calculated automatically from standardized cooperative trade tariffs before worker assignment.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p>
                <strong>Minimum Visit Charge:</strong> Guarantees worker minimum compensation for home visit and inspection.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" size="sm" onClick={onBack} className="text-xs border-slate-300">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back
        </Button>
        <Button
          onClick={onNext}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-6 gap-1.5"
        >
          Select Service Address
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
