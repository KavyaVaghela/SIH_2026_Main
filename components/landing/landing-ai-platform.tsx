"use client";

import React from "react";
import {
  Sparkles,
  ScanSearch,
  GraduationCap,
  UserCheck,
  BarChart3,
  Check,
} from "lucide-react";

export function LandingAiPlatform() {
  const aiFeatures = [
    {
      id: "ai-smartserve",
      title: "SmartServe AI",
      description:
        "Analyze customer text or uploaded service images to identify possible faults and suggest the relevant service or trade.",
      highlight: "Image & Text Based Assistance",
      icon: ScanSearch,
    },
    {
      id: "ai-kaushalgrow",
      title: "KaushalGrow",
      description:
        "Help workers identify skill gaps and discover relevant training and upskilling opportunities based on their trade and service experience.",
      highlight: "Skill Growth & Training",
      icon: GraduationCap,
    },
    {
      id: "ai-smart-matching",
      title: "Smart Worker Matching",
      description:
        "Match customer service requests with suitable verified workers using skills, availability, service requirements and cooperative coordination.",
      highlight: "Fair Service Matching",
      icon: UserCheck,
    },
    {
      id: "ai-demand-intelligence",
      title: "Demand Intelligence",
      description:
        "Use service demand patterns to support workforce planning, improve worker availability and help cooperatives prepare for local demand.",
      highlight: "Demand-Based Planning",
      icon: BarChart3,
    },
  ];

  return (
    <section
      className="py-5 sm:py-6 md:py-8 bg-white border-b border-[#e6f0ea]"
      id="ai-platform"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Compact rounded outer container with light background */}
        <div className="rounded-2xl sm:rounded-3xl bg-[#f4fbf6] border border-[#8ed5a5]/50 p-4 sm:p-5 lg:p-6 shadow-xs">
          {/* Section Heading */}
          <div className="text-center max-w-2xl mx-auto mb-4 sm:mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eaf5ee] text-[#004525] text-[10px] sm:text-[11px] font-bold border border-[#8ed5a5] mb-1.5 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[#135e38]" />
              <span>POWERED BY AI</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-[#111827]">
              Smarter Connections Powered by AI
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#4b5563] leading-relaxed">
              Intelligent matching, demand insights, skill verification and
              accessible service coordination for cooperative operations.
            </p>
          </div>

          {/* Four Feature Cards: 1 Row on Desktop, 2x2 on Tablet, 1 Col on Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 items-stretch">
            {aiFeatures.map((card) => {
              const IconComp = card.icon;
              return (
                <div
                  key={card.id}
                  className="bg-white border border-[#e6f0ea] hover:border-[#135e38] rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full group"
                >
                  <div>
                    {/* Top Icon */}
                    <div className="w-8 h-8 rounded-lg bg-[#eaf5ee] text-[#135e38] flex items-center justify-center mb-2.5 border border-[#8ed5a5]/30 group-hover:scale-105 transition-transform">
                      <IconComp className="h-4 w-4" />
                    </div>

                    {/* Card Title */}
                    <h3 className="text-xs sm:text-sm font-bold text-[#111827] group-hover:text-[#135e38] transition-colors leading-snug">
                      {card.title}
                    </h3>

                    {/* Short Description */}
                    <p className="text-[11px] sm:text-xs text-[#4b5563] mt-1 leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  {/* Bottom Divider & Highlight Row */}
                  <div className="mt-3 pt-2.5 border-t border-[#f0f7f2] flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-[#135e38]">
                    <Check className="w-3 h-3 text-[#135e38] shrink-0" />
                    <span>{card.highlight}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
