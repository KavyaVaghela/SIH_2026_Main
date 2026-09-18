"use client";

import React from "react";
import { AlertTriangle, Droplets, Zap, Key } from "lucide-react";
import { useAuthModal } from "./landing-auth-modal";

export function LandingEmergency() {
  const { openAuthModal } = useAuthModal();

  const urgentTags = [
    { icon: Droplets, label: "Plumbing Leaks" },
    { icon: Zap, label: "Electrical Faults" },
    { icon: Key, label: "Urgent Lockouts" },
  ];

  return (
    <section className="py-8 md:py-10 bg-[#004525] text-white relative overflow-hidden border-y border-[#135e38]" id="emergency">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#8ed5a5] blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Left Context: Eyebrow + Description */}
          <div className="flex items-center gap-4 text-left w-full lg:w-auto">
            <div className="w-12 h-12 rounded-xl bg-[#135e38] border border-[#8ed5a5]/40 flex items-center justify-center text-[#8ed5a5] shrink-0 shadow-inner">
              <AlertTriangle className="w-6 h-6 text-[#8ed5a5]" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#135e38] text-[#8ed5a5] text-xs font-extrabold uppercase tracking-wider border border-[#8ed5a5]/30 mb-1.5">
                <span>{"WHEN A SERVICE CAN'T WAIT"}</span>
              </div>
              <p className="text-sm sm:text-base text-[#eaf5ee] font-medium leading-snug max-w-2xl">
                Request urgent household assistance and connect with the appropriate local service network.
              </p>
              
              {/* Context chips */}
              <div className="hidden sm:flex items-center gap-3 mt-2.5">
                {urgentTags.map((tag, idx) => {
                  const Icon = tag.icon;
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 text-[11px] text-[#8ed5a5] font-medium"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tag.label}</span>
                      {idx < urgentTags.length - 1 && (
                        <span className="text-white/40 ml-2">•</span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Action: Emergency Help Button */}
          <div className="shrink-0 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => openAuthModal("Sign in or register to request emergency household assistance.")}
              id="emergency-request-btn"
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#8ed5a5] hover:bg-white text-[#004525] font-extrabold text-sm transition-all duration-200 shadow-md inline-flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Request Emergency Help →</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
