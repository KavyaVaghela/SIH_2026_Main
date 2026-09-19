"use client";

import React from "react";
import {
  Calendar,
  Check,
  Star,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { useAuthModal } from "./landing-auth-modal";

export function LandingHowItWorks() {
  const { openAuthModal } = useAuthModal();

  const steps = [
    {
      number: "01",
      title: "Request",
      description: "Customer chooses a service and submits the job details.",
    },
    {
      number: "02",
      title: "Compare",
      description: "Nearby eligible workers receive the request and can submit itemized estimates.",
    },
    {
      number: "03",
      title: "Confirm",
      description: "Customer compares worker information and estimates and selects a worker.",
    },
    {
      number: "04",
      title: "Verify",
      description: "Worker arrives and uses the customer's 4-digit OTP before the service starts.",
    },
    {
      number: "05",
      title: "Complete",
      description: "Worker completes the service, generates an itemized bill, and the customer reviews and pays.",
    },
  ];

  return (
    <section className="py-8 sm:py-10 md:py-12 bg-white border-b border-[#e6f0ea]" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eaf5ee] text-[#004525] text-xs font-bold border border-[#8ed5a5] mb-2">
            <span>5-Step Workflow</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
            How KaushalyaSetu Works
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#374151]">
            A clear and transparent service journey connecting households and cooperative workers.
          </p>
        </div>

        {/* 2-Column Section: Timeline Left, Product Preview Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-center">
          {/* Timeline Column (Left on Desktop, Top on Mobile) */}
          <div className="lg:col-span-6 space-y-2">
            <div className="relative pl-5 md:pl-6 border-l-2 border-[#8ed5a5] space-y-4 sm:space-y-4.5 ml-4">
              {steps.map((step, idx) => (
                <div key={idx} className="relative group">
                  {/* Green Numbered Circle */}
                  <div className="absolute -left-[31px] md:-left-[35px] top-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#135e38] text-white text-[11px] font-bold ring-4 ring-white shadow-sm transition-transform group-hover:scale-110">
                    {step.number}
                  </div>

                  {/* Step Details */}
                  <div className="pt-0">
                    <h3 className="text-sm sm:text-base font-bold text-[#111827] group-hover:text-[#135e38] transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-xs text-[#4b5563] mt-0.5 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 pl-5 md:pl-6 ml-4">
              <button
                type="button"
                onClick={() => openAuthModal("Sign in to request and compare services.")}
                id="how-it-works-start-btn"
                className="landing-btn-primary px-5 py-2.5 text-xs font-bold gap-2 inline-flex items-center shadow-sm cursor-pointer"
              >
                <span>Find a Service</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Product Preview Column: Realistic Customer Compare Workers Interface */}
          <div className="lg:col-span-6">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Product Preview Card */}
              <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#e6f0ea] shadow-lg p-4 sm:p-5 relative overflow-hidden">
                {/* Step 1: Request Header Panel */}
                <div className="rounded-xl sm:rounded-2xl bg-[#f4fbf6] border border-[#8ed5a5]/60 p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] font-bold text-[#004525] uppercase tracking-wider">
                    <span>SERVICE REQUEST</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-[#135e38] border border-[#8ed5a5] text-[10px] font-semibold">
                      <Clock className="w-3 h-3 text-[#135e38]" /> 2 Estimates Received
                    </span>
                  </div>

                  <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                    <div>
                      <h4 className="text-sm sm:text-base font-extrabold text-[#111827]">
                        Electrical Diagnostics &amp; MCB Repair
                      </h4>
                      <p className="text-xs text-[#6b7280] flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3 h-3 text-[#135e38]" /> Today • 4:00 PM
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#eaf5ee] text-[#135e38] border border-[#8ed5a5]/40">
                        Ready to Compare
                      </span>
                    </div>
                  </div>
                </div>

                {/* Available Workers Header */}
                <div className="mt-3.5 mb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#111827]">
                      AVAILABLE WORKERS
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#eaf5ee] text-[#135e38]">
                      2 eligible
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-[#135e38] font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Compare workers before you confirm
                  </span>
                </div>

                {/* Worker Comparison List */}
                <div className="space-y-2.5">
                  {/* Worker 1: Rahul Patel */}
                  <div className="rounded-xl border-2 border-[#135e38] bg-[#f4fbf6] p-3 sm:p-3.5 relative shadow-sm transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      {/* Worker Info */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-[#135e38] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          RP
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="text-xs sm:text-sm font-bold text-[#111827]">Rahul Patel</h5>
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-[#135e38] bg-white px-1.5 py-0.5 rounded-full border border-[#8ed5a5]">
                              <Check className="w-2.5 h-2.5 text-[#135e38]" /> Verified
                            </span>
                          </div>
                          <p className="text-[11px] text-[#374151] mt-0.5 font-medium">
                            Certified Electrician • 6 yrs exp
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#6b7280]">
                            <span className="flex items-center gap-0.5 font-bold text-[#111827]">
                              <Star className="w-3 h-3 fill-[#135e38] text-[#135e38]" />
                              <span>4.8</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5 text-[#135e38]" /> 2.4 km away
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Estimate Value */}
                      <div className="sm:text-right pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[#e6f0ea] flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center">
                        <span className="text-[10px] text-[#6b7280] font-medium sm:block">Estimate</span>
                        <span className="text-sm sm:text-base font-extrabold text-[#004525]">₹1,250</span>
                      </div>
                    </div>
                  </div>

                  {/* Worker 2: Amit Shah */}
                  <div className="rounded-xl border border-[#e6f0ea] bg-white p-3 sm:p-3.5 relative shadow-sm transition-all hover:border-[#8ed5a5]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      {/* Worker Info */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-[#eaf5ee] text-[#135e38] flex items-center justify-center font-bold text-xs shrink-0 border border-[#8ed5a5]/50">
                          AS
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="text-xs sm:text-sm font-bold text-[#111827]">Amit Shah</h5>
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-[#135e38] bg-[#eaf5ee] px-1.5 py-0.5 rounded-full border border-[#8ed5a5]/50">
                              <Check className="w-2.5 h-2.5 text-[#135e38]" /> Verified
                            </span>
                          </div>
                          <p className="text-[11px] text-[#374151] mt-0.5 font-medium">
                            Certified Electrician • 4 yrs exp
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#6b7280]">
                            <span className="flex items-center gap-0.5 font-bold text-[#111827]">
                              <Star className="w-3 h-3 fill-[#135e38] text-[#135e38]" />
                              <span>4.7</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5 text-[#135e38]" /> 3.1 km away
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Estimate Value */}
                      <div className="sm:text-right pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[#e6f0ea] flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center">
                        <span className="text-[10px] text-[#6b7280] font-medium sm:block">Estimate</span>
                        <span className="text-sm sm:text-base font-extrabold text-[#111827]">₹1,180</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compare Action Button */}
                <div className="mt-3.5">
                  <button
                    type="button"
                    onClick={() => openAuthModal("Sign in to compare worker estimates and select a professional.")}
                    id="preview-compare-estimates-btn"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#135e38] text-white font-bold text-xs sm:text-sm hover:bg-[#0c4427] transition-all flex items-center justify-center gap-2 shadow-sm text-center cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Compare Estimates &amp; Select Worker</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                </div>

                {/* Bottom Mockup Status Badge */}
                <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-[#374151] font-medium text-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#135e38] shrink-0" />
                  <span>Compare workers before you confirm • OTP job verification</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
