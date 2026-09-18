"use client";

import React from "react";
import {
  ShieldCheck,
  Building2,
  Wrench,
  Home,
  ArrowRight,
  ArrowDown,
  ArrowLeftRight,
  CheckCircle2,
} from "lucide-react";
import { useAuthModal } from "./landing-auth-modal";

export function LandingEcosystem() {
  const { openAuthModal } = useAuthModal();

  const ecosystemCards = [
    {
      title: "CUSTOMERS",
      tagline: "Trusted Service Journey",
      description:
        "Find services, submit requests, compare estimates, book, track, pay and review or file grievances through one clear journey.",
      icon: Home,
      ctaText: "Customer Portal",
      contextMsg: "Sign in to access the customer booking portal.",
      badgeClass: "bg-[#eaf5ee] text-[#004525] border-[#8ed5a5]",
    },
    {
      title: "WORKERS",
      tagline: "Organized Livelihood",
      description:
        "Manage profile, skills, availability, job requests, estimates, service execution, billing, earnings, certifications, welfare and grievances.",
      icon: Wrench,
      ctaText: "Worker Portal",
      contextMsg: "Sign in to access the cooperative worker portal.",
      badgeClass: "bg-[#eaf5ee] text-[#004525] border-[#8ed5a5]",
    },
    {
      title: "COOPERATIVES",
      tagline: "Local Workforce Coordination",
      description:
        "Verify and manage workers, oversee workforce availability, support welfare and training programs, and mediate grievances.",
      icon: Building2,
      ctaText: "Cooperative Console",
      contextMsg: "Sign in to access the federation administration console.",
      badgeClass: "bg-[#eaf5ee] text-[#004525] border-[#8ed5a5]",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#f4fbf6] border-b border-[#e6f0ea]" id="ecosystem">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eaf5ee] text-[#004525] text-xs font-bold border border-[#8ed5a5] mb-3">
            <span>Platform Ecosystem</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111827]">
            Built for Customers, Workers, and Cooperatives
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#374151]">
            One connected platform for service delivery, workforce coordination, and cooperative management.
          </p>
        </div>

        {/* 3 Ecosystem Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
          {ecosystemCards.map((card, index) => {
            const IconComp = card.icon;
            return (
              <div
                key={index}
                className="landing-card p-6 md:p-8 flex flex-col justify-between bg-white border-[#e6f0ea] hover:border-[#135e38]"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-[#eaf5ee] text-[#135e38]">
                      <IconComp className="h-6 w-6" />
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${card.badgeClass}`}
                    >
                      {card.tagline}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold tracking-tight text-[#111827]">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm text-[#374151] leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-[#e6f0ea]">
                  <button
                    type="button"
                    onClick={() => openAuthModal(card.contextMsg)}
                    className="landing-btn-primary w-full py-2.5 text-xs font-bold gap-2 text-center justify-center cursor-pointer"
                  >
                    <span>{card.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ecosystem Visual Flow Diagram */}
        <div className="bg-white rounded-2xl border border-[#8ed5a5]/50 p-6 md:p-10 shadow-sm">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-bold tracking-wider uppercase text-[#135e38] bg-[#eaf5ee] px-3 py-1 rounded-full border border-[#8ed5a5]/50">
              Operational Hierarchy & Flow
            </span>
            <h3 className="text-lg md:text-xl font-bold text-[#111827] mt-2">
              Connected Coordination Workflow
            </h3>
            <p className="text-xs text-[#6b7280] mt-1">
              Transparent governance cascading from national oversight down to local service exchange.
            </p>
          </div>

          {/* Visual Nodes and Flow */}
          <div className="flex flex-col items-center max-w-2xl mx-auto">
            {/* 1. Super Admin Node */}
            <div className="w-full max-w-md p-4 rounded-xl bg-[#f4fbf6] border-2 border-[#135e38] flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#135e38] text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold tracking-wider text-[#004525]">
                    SUPER ADMIN
                  </h4>
                  <p className="text-xs text-[#374151]">
                    Oversee federations, workforce, bookings, analytics, escalated grievances and platform configuration.
                  </p>
                </div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-[#135e38] shrink-0" />
            </div>

            {/* Vertical Connector Line 1 */}
            <div className="flex flex-col items-center my-1">
              <div className="w-0.5 h-6 bg-[#135e38]" />
              <ArrowDown className="w-4 h-4 text-[#135e38] -mt-1" />
            </div>

            {/* 2. Federation / Cooperative Node */}
            <div className="w-full max-w-md p-4 rounded-xl bg-[#f4fbf6] border-2 border-[#135e38] flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#135e38] text-white flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold tracking-wider text-[#004525]">
                    FEDERATION / COOPERATIVE
                  </h4>
                  <p className="text-xs text-[#374151]">
                    Verify and manage workers, oversee workforce, support welfare/training and mediate grievances.
                  </p>
                </div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-[#135e38] shrink-0" />
            </div>

            {/* Vertical Connector Line 2 */}
            <div className="flex flex-col items-center my-1">
              <div className="w-0.5 h-6 bg-[#135e38]" />
              <ArrowDown className="w-4 h-4 text-[#135e38] -mt-1" />
            </div>

            {/* 3. Workers <-> Customers Interactive Exchange Layer */}
            <div className="w-full grid grid-cols-1 md:grid-cols-11 items-center gap-3">
              {/* Workers Node */}
              <div className="md:col-span-5 p-4 rounded-xl bg-[#f4fbf6] border-2 border-[#135e38] flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-[#135e38] text-white flex items-center justify-center shrink-0">
                  <Wrench className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold tracking-wider text-[#004525]">
                    WORKERS
                  </h4>
                  <p className="text-xs text-[#374151]">
                    Manage profile, skills, availability, job requests, estimates, service execution, billing, earnings, certifications, welfare and grievances.
                  </p>
                </div>
              </div>

              {/* Bidirectional Green Connector Line */}
              <div className="md:col-span-1 flex flex-row md:flex-col items-center justify-center py-1 md:py-0">
                <div className="flex items-center justify-center p-2 rounded-full bg-[#eaf5ee] border border-[#8ed5a5] text-[#135e38]">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
              </div>

              {/* Customers Node */}
              <div className="md:col-span-5 p-4 rounded-xl bg-[#f4fbf6] border-2 border-[#135e38] flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-[#135e38] text-white flex items-center justify-center shrink-0">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold tracking-wider text-[#004525]">
                    CUSTOMERS
                  </h4>
                  <p className="text-xs text-[#374151]">
                    Find services, submit requests, compare estimates, book, track, pay and review or file grievances.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
