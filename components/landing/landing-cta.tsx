"use client";

import React from "react";
import { ArrowRight, Users, CheckCircle2 } from "lucide-react";
import { useAuthModal } from "./landing-auth-modal";
import { useTranslation } from "@/lib/i18n";

export function LandingCTA() {
  const { openAuthModal } = useAuthModal();
  const { t } = useTranslation();

  return (
    <section className="py-8 sm:py-10 md:py-12 bg-[#004525] text-white relative overflow-hidden border-t border-[#135e38]" id="cta">
      {/* Background Subtle Gradient Accents */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#8ed5a5] blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#eaf5ee] blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="max-w-3xl mx-auto space-y-3.5 sm:space-y-4">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#135e38] text-[#8ed5a5] text-xs font-bold uppercase tracking-wider border border-[#8ed5a5]/30">
            <span>{t("landing.cta.eyebrow", "STRONGER TOGETHER")}</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            {t("landing.cta.titlePre", "Stronger Services. Stronger Workers.")} <br />
            {t("landing.cta.titlePost", "Stronger Communities.")}
          </h2>

          {/* Supporting Text */}
          <p className="text-xs sm:text-sm text-[#eaf5ee] leading-relaxed max-w-2xl mx-auto">
            {t(
              "landing.cta.subtitle",
              "Find skilled workers for everyday household services, or join as a cooperative member to discover organized jobs, federation support, certifications, and welfare resources."
            )}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-1.5">
            <button
              type="button"
              onClick={() => openAuthModal("Sign in to request and compare household services.")}
              id="cta-find-service-btn"
              className="px-6 py-2.5 rounded-full bg-white text-[#004525] font-extrabold text-xs sm:text-sm hover:bg-[#eaf5ee] transition-all shadow-md inline-flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
            >
              <span>{t("landing.cta.enterNetworkCta", "Enter KaushalyaSetu Network")}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#135e38]" />
            </button>

            <button
              type="button"
              onClick={() => openAuthModal("Sign in or register to enter the KaushalyaSetu network.")}
              id="cta-join-worker-btn"
              className="px-6 py-2.5 rounded-full bg-[#135e38] text-white font-extrabold text-xs sm:text-sm border border-[#8ed5a5]/40 hover:bg-[#0c4427] hover:border-[#8ed5a5] transition-all inline-flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-[#8ed5a5]" />
              <span>{t("landing.cta.joinWorkerCta", "Join as a Worker")}</span>
            </button>
          </div>

          {/* Factual Highlights */}
          <div className="pt-4 sm:pt-5 flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-[11px] sm:text-xs text-[#8ed5a5] font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" /> {t("landing.cta.highlightTrades", "8 Trade Categories")}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" /> {t("landing.cta.highlightEstimates", "Itemized Estimates")}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" /> {t("landing.cta.highlightPortals", "Dedicated Role Portals")}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" /> {t("landing.cta.highlightGrievances", "Grievance Management")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
