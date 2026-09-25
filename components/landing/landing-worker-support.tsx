"use client";

import React from "react";
import {
  GraduationCap,
  Briefcase,
  TrendingUp,
  HeartHandshake,
  ArrowRight,
} from "lucide-react";
import { useAuthModal } from "./landing-auth-modal";
import { useTranslation } from "@/lib/i18n";

export function LandingWorkerSupport() {
  const { openAuthModal } = useAuthModal();
  const { t } = useTranslation();

  const workerCards = [
    {
      title: t("landing.workerSupport.skillsCertsTitle", "Skills & Certification"),
      description: t(
        "landing.workerSupport.skillsCertsDesc",
        "Maintain verified trade skills, track certification validity, and receive training recommendations to qualify for more service opportunities."
      ),
      icon: GraduationCap,
    },
    {
      title: t("landing.workerSupport.jobOpportunitiesTitle", "Job Opportunities"),
      description: t(
        "landing.workerSupport.jobOpportunitiesDesc",
        "Receive localized household service requests matching your trade skills and submit itemized estimates to customers."
      ),
      icon: Briefcase,
    },
    {
      title: t("landing.workerSupport.earningsTitle", "Earnings & Transparent Settlement"),
      description: t(
        "landing.workerSupport.earningsDesc",
        "Track earnings from completed bookings with clear breakdown of labor charges, platform fee, and direct bank settlement."
      ),
      icon: TrendingUp,
    },
    {
      title: t("landing.workerSupport.welfareTitle", "Welfare & Federation Support"),
      description: t(
        "landing.workerSupport.welfareDesc",
        "Access cooperative-led welfare resources, safety guidance, federation dispute mediation, and structured operational support."
      ),
      icon: HeartHandshake,
    },
  ];

  return (
    <section className="py-7 sm:py-8 md:py-10 bg-white border-b border-[#e6f0ea]" id="welfare">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-5 sm:mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eaf5ee] text-[#004525] text-[10px] sm:text-[11px] font-bold border border-[#8ed5a5] mb-1.5 uppercase tracking-wider">
            <span>{t("landing.workerSupport.eyebrow", "BUILT FOR SKILLED WORKERS")}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
            {t("landing.workerSupport.title", "More Than a Service. A Livelihood.")}
          </h2>

          <p className="mt-1.5 text-xs sm:text-sm text-[#374151] leading-relaxed">
            {t(
              "landing.workerSupport.subtitle",
              "KaushalyaSetu helps skilled workers discover organized opportunities, manage incoming requests, track transparent earnings, and build a professional service history through the cooperative federation network."
            )}
          </p>
        </div>

        {/* 4 Worker Support Cards in ONE ROW on Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
          {workerCards.map((card, index) => {
            const IconComp = card.icon;
            return (
              <div
                key={index}
                className="p-3.5 sm:p-4 rounded-xl bg-[#f4fbf6] border border-[#e6f0ea] hover:border-[#135e38] transition-all flex flex-col justify-between h-full group"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-[#eaf5ee] text-[#135e38] flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105 border border-[#8ed5a5]/30">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#111827] group-hover:text-[#135e38] transition-colors leading-snug">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#374151] leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Worker CTA */}
        <div className="mt-5 sm:mt-6 text-center">
          <button
            type="button"
            onClick={() => openAuthModal("Sign in or register to enter the KaushalyaSetu network.")}
            id="worker-support-join-btn"
            className="landing-btn-primary px-5 py-2 text-xs font-bold gap-2 inline-flex items-center cursor-pointer shadow-xs"
          >
            <span>{t("landing.workerSupport.joinNetworkCta", "Join the Cooperative Network")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
