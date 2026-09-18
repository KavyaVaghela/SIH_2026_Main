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

  const platformRoles = [
    {
      id: "cooperative",
      title: "COOPERATIVES",
      tagline: "Federation Oversight",
      description:
        "Verify and onboard workers, coordinate trade availability, facilitate certifications, and mediate booking grievances.",
      icon: Building2,
      ctaText: "Cooperative Console",
      btnId: "ecosystem-cooperative-console-btn",
      contextMsg: "Sign in to access the federation administration console.",
      badgeClass: "bg-[#eaf5ee] text-[#004525] border-[#8ed5a5]",
    },
    {
      id: "worker",
      title: "WORKERS",
      tagline: "Organized Livelihood",
      description:
        "Manage trade profile, set live availability, review requests, submit itemized estimates, execute jobs, and receive direct payments.",
      icon: Wrench,
      ctaText: "Worker Portal",
      btnId: "ecosystem-worker-portal-btn",
      contextMsg: "Sign in to access the cooperative worker portal.",
      badgeClass: "bg-[#eaf5ee] text-[#004525] border-[#8ed5a5]",
    },
    {
      id: "customer",
      title: "CUSTOMERS",
      tagline: "Trusted Service Journey",
      description:
        "Find verified services, compare worker estimates, book appointments, track arrivals with OTP, and settle payments securely.",
      icon: Home,
      ctaText: "Customer Portal",
      btnId: "ecosystem-customer-portal-btn",
      contextMsg: "Sign in to access the customer booking portal.",
      badgeClass: "bg-[#eaf5ee] text-[#004525] border-[#8ed5a5]",
    },
  ];

  return (
    <section className="py-7 sm:py-9 md:py-11 bg-[#f4fbf6] border-b border-[#e6f0ea]" id="ecosystem">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* LEFT COLUMN: PLATFORM ROLES (~40%) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              {/* Column Header */}
              <div className="mb-3.5 sm:mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eaf5ee] text-[#004525] text-xs font-bold border border-[#8ed5a5] mb-1.5">
                  <span>Platform Roles</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#111827]">
                  Cooperatives, Workers &amp; Customers
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#374151]">
                  Three interconnected roles driving verified community trade services.
                </p>
              </div>

              {/* Stacked Roles: COOPERATIVES ↓ WORKERS ↓ CUSTOMERS */}
              <div className="space-y-1">
                {platformRoles.map((role, idx) => {
                  const IconComp = role.icon;
                  return (
                    <React.Fragment key={role.id}>
                      <div className="bg-white border border-[#e6f0ea] hover:border-[#135e38] rounded-xl p-3 sm:p-3.5 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 group">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#eaf5ee] text-[#135e38] flex items-center justify-center shrink-0 border border-[#8ed5a5]/40 transition-transform group-hover:scale-105 mt-0.5 sm:mt-0">
                            <IconComp className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                              <h3 className="text-xs sm:text-sm font-bold text-[#111827] group-hover:text-[#135e38] transition-colors">
                                {role.title}
                              </h3>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${role.badgeClass}`}
                              >
                                {role.tagline}
                              </span>
                            </div>
                            <p className="text-xs text-[#374151] leading-snug">
                              {role.description}
                            </p>
                          </div>
                        </div>

                        <div className="pt-1 sm:pt-0 border-t sm:border-t-0 border-[#e6f0ea] shrink-0">
                          <button
                            type="button"
                            id={role.btnId}
                            onClick={() => openAuthModal(role.contextMsg)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-[#135e38] text-white text-[11px] sm:text-xs font-bold hover:bg-[#0c4427] transition-all whitespace-nowrap shadow-xs cursor-pointer"
                          >
                            <span>{role.ctaText}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Directional Connector between roles */}
                      {idx < platformRoles.length - 1 && (
                        <div className="flex items-center justify-center py-0.5">
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#eaf5ee] border border-[#8ed5a5] text-[#135e38]">
                            <ArrowDown className="w-3 h-3" />
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: OPERATIONAL WORKFLOW (~60%) */}
          <div className="lg:col-span-7 flex flex-col justify-between lg:border-l lg:border-[#e6f0ea] lg:pl-6 xl:pl-8">
            <div>
              {/* Column Header */}
              <div className="mb-3.5 sm:mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eaf5ee] text-[#135e38] text-xs font-bold border border-[#8ed5a5] mb-1.5">
                  <span>Operational Workflow</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#111827]">
                  Connected Coordination Workflow
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#374151]">
                  Transparent governance cascading from national oversight to local service delivery.
                </p>
              </div>

              {/* Hierarchy & Workflow Container */}
              <div className="bg-white rounded-2xl border border-[#8ed5a5]/50 p-3.5 sm:p-4 shadow-sm">
                <div className="flex flex-col items-center">
                  {/* 1. Super Admin Node */}
                  <div className="w-full p-2.5 sm:p-3 rounded-xl bg-[#f4fbf6] border border-[#135e38] flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#135e38] text-white flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-extrabold tracking-wider text-[#004525]">
                          SUPER ADMIN
                        </h4>
                        <p className="text-xs text-[#374151] leading-tight">
                          Oversees platform federations, workforce standards, system analytics, and escalated grievances.
                        </p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-[#135e38] shrink-0 ml-2" />
                  </div>

                  {/* Downward Connector */}
                  <div className="flex flex-col items-center my-1">
                    <div className="w-0.5 h-2.5 bg-[#135e38]" />
                    <ArrowDown className="w-3 h-3 text-[#135e38] -mt-0.5" />
                  </div>

                  {/* 2. Federation / Cooperative Node */}
                  <div className="w-full p-2.5 sm:p-3 rounded-xl bg-[#f4fbf6] border border-[#135e38] flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#135e38] text-white flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-extrabold tracking-wider text-[#004525]">
                          FEDERATION / COOPERATIVE
                        </h4>
                        <p className="text-xs text-[#374151] leading-tight">
                          Manages and coordinates local workers: verification, trade availability, welfare, and dispute mediation.
                        </p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-[#135e38] shrink-0 ml-2" />
                  </div>

                  {/* Downward Connector */}
                  <div className="flex flex-col items-center my-1">
                    <div className="w-0.5 h-2.5 bg-[#135e38]" />
                    <ArrowDown className="w-3 h-3 text-[#135e38] -mt-0.5" />
                  </div>

                  {/* 3. Workers <-> Customers Interactive Layer */}
                  <div className="w-full grid grid-cols-1 sm:grid-cols-11 items-center gap-2">
                    {/* Workers Node */}
                    <div className="sm:col-span-5 p-2 sm:p-2.5 rounded-xl bg-[#f4fbf6] border border-[#135e38] flex items-start gap-2 shadow-xs">
                      <div className="w-7 h-7 rounded-lg bg-[#135e38] text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Wrench className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-extrabold tracking-wider text-[#004525]">
                          WORKERS
                        </h4>
                        <p className="text-xs text-[#374151] leading-tight mt-0.5">
                          Receive requests, submit itemized quotes &amp; execute verified jobs.
                        </p>
                      </div>
                    </div>

                    {/* Bi-directional Connector */}
                    <div className="sm:col-span-1 flex items-center justify-center py-0.5 sm:py-0">
                      <div className="flex items-center justify-center p-1.5 rounded-full bg-[#eaf5ee] border border-[#8ed5a5] text-[#135e38]">
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Customers Node */}
                    <div className="sm:col-span-5 p-2 sm:p-2.5 rounded-xl bg-[#f4fbf6] border border-[#135e38] flex items-start gap-2 shadow-xs">
                      <div className="w-7 h-7 rounded-lg bg-[#135e38] text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Home className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-extrabold tracking-wider text-[#004525]">
                          CUSTOMERS
                        </h4>
                        <p className="text-xs text-[#374151] leading-tight mt-0.5">
                          Request trade services, compare quotes &amp; verify with OTP.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
