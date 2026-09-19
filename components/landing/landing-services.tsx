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
} from "lucide-react";
import { useAuthModal } from "./landing-auth-modal";

export function LandingServices() {
  const { openAuthModal } = useAuthModal();

  const categories = [
    {
      id: "cat-electrical",
      name: "Electrical & Wiring",
      icon: Zap,
    },
    {
      id: "cat-plumbing",
      name: "Plumbing & Drainage",
      icon: Droplets,
    },
    {
      id: "cat-carpentry",
      name: "Carpentry & Woodwork",
      icon: Hammer,
    },
    {
      id: "cat-painting",
      name: "Wall Painting",
      icon: Paintbrush,
    },
    {
      id: "cat-cleaning",
      name: "Deep Cleaning",
      icon: Sparkles,
    },
    {
      id: "cat-appliance",
      name: "Appliance Servicing",
      icon: Tv,
    },
    {
      id: "cat-gardening",
      name: "Gardening & Lawn",
      icon: TreePine,
    },
    {
      id: "cat-driver",
      name: "Driver & Chauffeur",
      icon: Car,
    },
  ];

  return (
    <section className="py-6 sm:py-8 md:py-10 bg-[#f7faf8] border-b border-[#e6f0ea]" id="services">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eaf5ee] text-[#004525] text-xs font-bold border border-[#8ed5a5] mb-1.5">
            <span>Essential Trades</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
            Services for Everyday Needs
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#374151]">
            Find skilled help for essential household and community services across 8 verified trade categories.
          </p>
        </div>

        {/* 8 Category Cards in ONE Horizontal Row on Desktop/Laptop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
          {categories.map((service) => {
            const IconComp = service.icon;
            return (
              <button
                type="button"
                key={service.id}
                onClick={() => openAuthModal(`Sign in to request ${service.name.toLowerCase()} service.`)}
                id={`service-request-${service.id}`}
                className="bg-white border border-[#e6f0ea] hover:border-[#135e38] hover:shadow-md rounded-xl p-2.5 sm:p-3 transition-all flex flex-col items-center text-center group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#135e38]/20"
              >
                {/* Icon Container */}
                <div className="w-10 h-10 rounded-xl bg-[#eaf5ee] text-[#135e38] flex items-center justify-center mb-2 transition-transform group-hover:scale-110">
                  <IconComp className="h-5 w-5" />
                </div>

                {/* Category Name */}
                <span className="text-xs font-bold text-[#111827] group-hover:text-[#135e38] transition-colors leading-snug">
                  {service.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="mt-5 sm:mt-6 p-3 sm:p-3.5 rounded-xl bg-[#eaf5ee] border border-[#8ed5a5] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-[#004525]">
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
            className="landing-btn-primary px-4 py-2 text-xs font-bold whitespace-nowrap cursor-pointer shrink-0"
          >
            Request a Service
          </button>
        </div>
      </div>
    </section>
  );
}
