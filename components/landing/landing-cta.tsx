"use client";

import React from "react";
import { ArrowRight, Users, CheckCircle2 } from "lucide-react";
import { useAuthModal } from "./landing-auth-modal";

export function LandingCTA() {
  const { openAuthModal } = useAuthModal();

  return (
    <section className="py-16 md:py-20 bg-[#004525] text-white relative overflow-hidden border-t border-[#135e38]" id="cta">
      {/* Background Subtle Gradient Accents */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#8ed5a5] blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#eaf5ee] blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#135e38] text-[#8ed5a5] text-xs font-bold uppercase tracking-wider border border-[#8ed5a5]/30">
            <span>STRONGER TOGETHER</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Stronger Services. Stronger Workers. <br />
            Stronger Communities.
          </h2>

          {/* Supporting Text */}
          <p className="text-base sm:text-lg text-[#eaf5ee] leading-relaxed max-w-2xl mx-auto">
            Find skilled workers for everyday household services, or join as a cooperative member to discover organized jobs, federation support, certifications, and welfare resources.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => openAuthModal("Sign in to request and compare household services.")}
              id="cta-find-service-btn"
              className="px-8 py-3.5 rounded-full bg-white text-[#004525] font-extrabold text-sm hover:bg-[#eaf5ee] transition-all shadow-md inline-flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
            >
              <span>Enter KaushalyaSetu Network</span>
              <ArrowRight className="w-4 h-4 text-[#135e38]" />
            </button>

            <button
              type="button"
              onClick={() => openAuthModal("Sign in or register to enter the KaushalyaSetu network.")}
              id="cta-join-worker-btn"
              className="px-8 py-3.5 rounded-full bg-[#135e38] text-white font-extrabold text-sm border border-[#8ed5a5]/40 hover:bg-[#0c4427] hover:border-[#8ed5a5] transition-all inline-flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
            >
              <Users className="w-4 h-4 text-[#8ed5a5]" />
              <span>Join as a Worker</span>
            </button>
          </div>

          {/* Factual Highlights */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[#8ed5a5] font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-white" /> 8 Trade Categories
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-white" /> Itemized Estimates
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-white" /> Dedicated Role Portals
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-white" /> Grievance Management
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
