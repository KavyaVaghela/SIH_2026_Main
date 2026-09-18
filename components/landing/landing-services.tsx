"use client";

import React from "react";
import {
  Zap,
  Droplets,
  Hammer,
  Paintbrush,
  Sparkles,
  Tv,
  TreePine,
  Car,
  ArrowRight,
} from "lucide-react";
import { useAuthModal } from "./landing-auth-modal";

export function LandingServices() {
  const { openAuthModal } = useAuthModal();

  const categories = [
    {
      id: "cat-electrical",
      name: "Electrical & Wiring",
      icon: Zap,
      description: "Switchboards, wiring, circuits, fans and lights.",
    },
    {
      id: "cat-plumbing",
      name: "Plumbing & Drainage",
      icon: Droplets,
      description: "Leaks, taps, drainage and sanitary fittings.",
    },
    {
      id: "cat-carpentry",
      name: "Carpentry & Woodwork",
      icon: Hammer,
      description: "Doors, furniture, locks and wooden fixtures.",
    },
    {
      id: "cat-painting",
      name: "Wall Painting & Damp Proofing",
      icon: Paintbrush,
      description: "Painting, touch-ups and moisture protection.",
    },
    {
      id: "cat-cleaning",
      name: "Deep House Cleaning",
      icon: Sparkles,
      description: "Home, kitchen, bathroom and upholstery cleaning.",
    },
    {
      id: "cat-appliance",
      name: "Appliance Servicing",
      icon: Tv,
      description: "AC, refrigerator, washing machine and geyser servicing.",
    },
    {
      id: "cat-gardening",
      name: "Gardening & Lawn Care",
      icon: TreePine,
      description: "Lawn maintenance, pruning, plant care and garden setup.",
    },
    {
      id: "cat-driver",
      name: "Professional Chauffeur & Driver",
      icon: Car,
      description: "Verified local and outstation driving services.",
    },
  ];

  return (
    <section className="py-12 md:py-16 bg-[#f7faf8] border-b border-[#e6f0ea]" id="services">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eaf5ee] text-[#004525] text-xs font-bold border border-[#8ed5a5] mb-2.5">
            <span>Essential Trades</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#111827]">
            Services for Everyday Needs
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#374151]">
            Find skilled help for essential household and community services across 8 verified trade categories.
          </p>
        </div>

        {/* 8 Category Cards Grid (4 columns on large screens, 2 on tablet, 1 on mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((service) => {
            const IconComp = service.icon;
            return (
              <div
                key={service.id}
                className="bg-white border border-[#e6f0ea] rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#8ed5a5] transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Icon Container */}
                  <div className="w-11 h-11 rounded-xl bg-[#eaf5ee] text-[#135e38] flex items-center justify-center mb-3.5 transition-transform group-hover:scale-105">
                    <IconComp className="h-5 w-5" />
                  </div>

                  {/* Heading & Description */}
                  <h3 className="text-base font-bold text-[#111827] group-hover:text-[#135e38] transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-xs text-[#6b7280] mt-1.5 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Card Action Link */}
                <div className="mt-5 pt-3.5 border-t border-[#e6f0ea] flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#6b7280]">
                    Verified Cooperative
                  </span>
                  <button
                    type="button"
                    onClick={() => openAuthModal(`Sign in to request ${service.name.toLowerCase()} service.`)}
                    id={`service-request-${service.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#135e38] hover:text-[#0c4427] transition-colors cursor-pointer"
                  >
                    <span>Request a Service</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="mt-10 p-5 rounded-2xl bg-[#eaf5ee] border border-[#8ed5a5] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-sm text-[#004525]">
              Looking for a specific household service?
            </h4>
            <p className="text-xs text-[#374151] mt-0.5">
              Submit your request with required task details to receive itemized estimates from local cooperative workers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openAuthModal("Sign in to request household services.")}
            id="services-book-all-btn"
            className="landing-btn-primary px-5 py-2 text-xs font-bold whitespace-nowrap cursor-pointer"
          >
            Request a Service
          </button>
        </div>
      </div>
    </section>
  );
}
