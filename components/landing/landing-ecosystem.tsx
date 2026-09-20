"use client";

import React from "react";
import {
  Building2,
  Wrench,
  Home,
  ArrowRight,
  Check,
} from "lucide-react";
import { useAuthModal } from "./landing-auth-modal";

export function LandingEcosystem() {
  const { openAuthModal } = useAuthModal();

  const platformRoles = [
    {
      id: "cooperative",
      title: "COOPERATIVES",
      tagline: "Federation Oversight",
      description:
        "Verify workers, coordinate trade availability, and provide cooperative oversight.",
      icon: Building2,
      ctaText: "Cooperative Console",
      btnId: "ecosystem-cooperative-console-btn",
      contextMsg: "Sign in to access the federation administration console.",
      bullets: [
        "Verify and manage workers",
        "Coordinate workforce availability",
        "Support welfare, training and grievances",
        "Provide cooperative/federation oversight",
      ],
    },
    {
      id: "worker",
      title: "WORKERS",
      tagline: "Organized Livelihood",
      description:
        "Manage profiles, respond to requests, submit estimates, and track earnings.",
      icon: Wrench,
      ctaText: "Worker Portal",
      btnId: "ecosystem-worker-portal-btn",
      contextMsg: "Sign in to access the cooperative worker portal.",
      bullets: [
        "Manage profile, skills and availability",
        "Receive and manage job requests",
        "Submit estimates and execute services",
        "Manage earnings, certifications and welfare",
      ],
    },
    {
      id: "customer",
      title: "CUSTOMERS",
      tagline: "Trusted Services",
      description:
        "Find verified services, compare estimates, track bookings, and settle payments.",
      icon: Home,
      ctaText: "Customer Portal",
      btnId: "ecosystem-customer-portal-btn",
      contextMsg: "Sign in to access the customer booking portal.",
      bullets: [
        "Find verified services",
        "Submit service requests",
        "Compare estimates",
        "Book, track and pay for services",
        "Review or raise grievances when required",
      ],
    },
  ];

  return (
    <section
      className="py-8 sm:py-10 md:py-12 bg-[#f4fbf6] border-b border-[#e6f0ea]"
      id="ecosystem"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaf5ee] text-[#004525] text-xs font-bold border border-[#8ed5a5] mb-2">
            <span>Platform Roles</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
            Built for Cooperatives, Workers &amp; Customers
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#374151]">
            One connected platform for cooperative service delivery.
          </p>
        </div>

        {/* 3 Horizontal Role Cards in One Row on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-stretch">
          {platformRoles.map((role) => {
            const IconComp = role.icon;
            return (
              <div
                key={role.id}
                className="bg-white border border-[#e6f0ea] hover:border-[#135e38] rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header: Icon + Title + Category Tag */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#eaf5ee] text-[#135e38] flex items-center justify-center shrink-0 border border-[#8ed5a5]/40 transition-transform group-hover:scale-105">
                        <IconComp className="h-4 w-4" />
                      </div>
                      <h3 className="text-sm sm:text-base font-extrabold text-[#111827] tracking-wider group-hover:text-[#135e38] transition-colors truncate">
                        {role.title}
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#eaf5ee] text-[#004525] border border-[#8ed5a5] shrink-0">
                      {role.tagline}
                    </span>
                  </div>

                  {/* Short 1-2 line description */}
                  <p className="text-xs text-[#4b5563] leading-relaxed mb-3">
                    {role.description}
                  </p>

                  {/* Bullets List */}
                  <ul className="space-y-1.5 pt-2 border-t border-[#f0f7f2]">
                    {role.bullets.map((bullet, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs text-[#374151] leading-snug"
                      >
                        <Check className="w-3.5 h-3.5 text-[#135e38] shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom Action Button */}
                <div className="pt-4 mt-auto">
                  <button
                    type="button"
                    id={role.btnId}
                    onClick={() => openAuthModal(role.contextMsg)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#135e38] text-white text-xs font-bold hover:bg-[#0c4427] transition-all shadow-xs cursor-pointer"
                  >
                    <span>{role.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
