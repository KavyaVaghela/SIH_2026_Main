"use client";

import React from "react";
import Image from "next/image";
import {
  GraduationCap,
  Briefcase,
  TrendingUp,
  HeartHandshake,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useAuthModal } from "./landing-auth-modal";

export function LandingWorkerSupport() {
  const { openAuthModal } = useAuthModal();

  const workerCards = [
    {
      title: "Skills & Certification",
      description:
        "Maintain verified trade skills, track certification validity, and receive training recommendations to qualify for more service opportunities.",
      icon: GraduationCap,
    },
    {
      title: "Job Opportunities",
      description:
        "Receive localized household service requests matching your trade skills and submit itemized estimates to customers.",
      icon: Briefcase,
    },
    {
      title: "Earnings & Transparent Settlement",
      description:
        "Track earnings from completed bookings with clear breakdown of labor charges, platform fee, and direct bank settlement.",
      icon: TrendingUp,
    },
    {
      title: "Welfare & Federation Support",
      description:
        "Access cooperative-led welfare resources, safety guidance, federation dispute mediation, and structured operational support.",
      icon: HeartHandshake,
    },
  ];

  return (
    <section className="py-8 sm:py-10 md:py-12 bg-white border-b border-[#e6f0ea]" id="welfare">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-center">
          {/* Left Column: Realistic Skilled Worker Image */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-[#e6f0ea] aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3.5] w-full max-w-md mx-auto lg:max-w-none group">
              <Image
                src="/images/worker-support.jpg"
                alt="Skilled cooperative tradesperson performing precision plumbing maintenance"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw, 500px"
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#004525]/60 via-transparent to-transparent pointer-events-none" />
              
              {/* Bottom floating info badge */}
              <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-white/95 backdrop-blur-sm border border-[#8ed5a5] shadow-md flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#135e38] text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#111827]">
                    Verified Cooperative Trade Network
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-[#374151] leading-tight">
                    Structured coordination, certifications, and verified service history for skilled craftspeople.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Eyebrow, Heading, Description, 4 Cards */}
          <div className="lg:col-span-7 space-y-3.5 sm:space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eaf5ee] text-[#004525] text-xs font-bold border border-[#8ed5a5] mb-1.5">
                <span>BUILT FOR SKILLED WORKERS</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827] leading-tight">
                More Than a Service. A Livelihood.
              </h2>

              <p className="mt-1.5 text-xs sm:text-sm text-[#374151] leading-relaxed">
                KaushalyaSetu helps skilled workers discover organized opportunities, manage incoming requests, track transparent earnings, and build a professional service history through the cooperative federation network.
              </p>
            </div>

            {/* 4 Worker Support Cards (2x2 Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {workerCards.map((card, index) => {
                const IconComp = card.icon;
                return (
                  <div
                    key={index}
                    className="p-3 sm:p-3.5 rounded-xl bg-[#f4fbf6] border border-[#e6f0ea] hover:border-[#135e38] transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-8 h-8 rounded-lg bg-[#eaf5ee] text-[#135e38] flex items-center justify-center mb-2">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-[#111827]">
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
            <div className="pt-1.5">
              <button
                type="button"
                onClick={() => openAuthModal("Sign in or register to enter the KaushalyaSetu network.")}
                id="worker-support-join-btn"
                className="landing-btn-primary px-5 py-2.5 text-xs font-bold gap-2 inline-flex items-center cursor-pointer"
              >
                <span>Join the Cooperative Network</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
