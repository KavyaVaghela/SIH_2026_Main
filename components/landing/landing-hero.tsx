"use client";

import React from "react";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Star,
  Clock,
  ShieldCheck,
  MapPin,
  Check,
  Sparkles,
} from "lucide-react";
import { useAuthModal } from "./landing-auth-modal";

export function LandingHero() {
  const { openAuthModal } = useAuthModal();
  const valueStripItems = [
    "Skill-Based Matching",
    "Cooperative Network",
    "OTP Verification",
    "Transparent Service Journey",
  ];

  return (
    <section
      id="home"
      className="relative overflow-hidden pt-5 pb-7 sm:pt-7 sm:pb-9 md:pt-10 md:pb-12 lg:pt-12 lg:pb-14 bg-[#f7faf8] border-b border-[#e6f0ea]"
    >
      {/* Soft Green Ambient Background Decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#eaf5ee] blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 rounded-full bg-[#f4fbf6] blur-2xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-8 items-center">
          {/* Left Column: Hero Text & Actions */}
          <div className="lg:col-span-6 space-y-3.5 sm:space-y-4 lg:space-y-5 text-left">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eaf5ee] border border-[#8ed5a5]">
              <Sparkles className="w-3.5 h-3.5 text-[#135e38]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#004525]">
                DEMOCRATICALLY OWNED COOPERATIVE NETWORK
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#111827] leading-[1.18]">
              Skilled People. <br />
              Stronger Communities. <br />
              <span className="text-[#135e38]">Connected Through KaushalyaSetu.</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-sm sm:text-base text-[#374151] leading-relaxed max-w-xl">
              Connecting households with skilled service professionals through a transparent
              cooperative platform built around community, opportunity, and trusted service.
            </p>

            {/* Hero Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-1">
              <button
                type="button"
                onClick={() => openAuthModal("Sign in or register to enter the KaushalyaSetu network.")}
                id="hero-find-service-btn"
                className="inline-flex items-center justify-center px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-bold rounded-xl bg-[#135e38] text-white hover:bg-[#0c4427] transition-all shadow-sm gap-2 cursor-pointer"
              >
                <span>Enter KaushalyaSetu Network</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => openAuthModal("Sign in or register to join the KaushalyaSetu cooperative network.")}
                id="hero-join-network-btn"
                className="inline-flex items-center justify-center px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-bold rounded-xl bg-[#eaf5ee] text-[#004525] border border-[#8ed5a5] hover:bg-[#8ed5a5] transition-all gap-2 cursor-pointer"
              >
                <span>Join the Cooperative Network</span>
              </button>
            </div>

            {/* Hero Value Strip */}
            <div className="pt-3 sm:pt-4 lg:pt-5 border-t border-[#e6f0ea]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                {valueStripItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-xs font-semibold text-[#374151]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#135e38] shrink-0" />
                    <span className="leading-tight">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual & Floating UI Cards */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Soft Green Decorative Glow Frame */}
              <div className="absolute -inset-1.5 sm:-inset-2.5 rounded-3xl bg-gradient-to-tr from-[#8ed5a5]/30 to-[#eaf5ee] blur-sm -z-10" />

              {/* Main Service Image */}
              <div className="relative rounded-2xl overflow-hidden border border-[#8ed5a5]/50 shadow-md sm:shadow-lg lg:shadow-xl bg-white aspect-[1024/646] w-full">
                <Image
                  src="/images/hero-service.jpg"
                  alt="Cooperative service technician giving a thumbs up alongside a satisfied customer in a home"
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>

              {/* Card 1: VERIFIED WORKER */}
              <div className="mt-3 lg:mt-0 w-full lg:w-auto lg:max-w-xs lg:absolute lg:-top-5 lg:-left-6 bg-white p-2.5 sm:p-3 lg:p-3.5 rounded-xl shadow-sm sm:shadow-md lg:shadow-lg border border-[#e6f0ea] hover:border-[#8ed5a5] transition-transform hover:scale-[1.01] lg:hover:scale-105 z-20">
                <div className="flex items-center justify-between gap-2 text-[10px] uppercase font-bold tracking-wider text-[#6b7280]">
                  <span className="flex items-center gap-1.5">
                    <span className="lg:hidden w-4 h-4 rounded-full bg-[#eaf5ee] text-[#135e38] inline-flex items-center justify-center text-[9px] font-extrabold shrink-0">
                      1
                    </span>
                    <span>VERIFIED WORKER</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#135e38] font-semibold text-[10px]">
                    <Check className="w-3 h-3 text-[#135e38]" /> Verified
                  </span>
                </div>
                <div className="mt-1 lg:mt-1.5 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-[#111827]">Rahul Patel</h4>
                    <p className="text-[11px] sm:text-xs text-[#6b7280]">Electrician</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs font-bold text-[#111827] justify-end">
                      <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-[#135e38] text-[#135e38]" />
                      <span>4.8</span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-[#6b7280] flex items-center gap-0.5 justify-end mt-0.5">
                      <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#135e38]" /> 2.4 km away
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: SERVICE REQUEST */}
              <div className="mt-2 lg:mt-0 w-full lg:w-auto lg:max-w-xs lg:absolute lg:top-1/2 lg:-right-6 lg:-translate-y-1/2 bg-white p-2.5 sm:p-3 lg:p-3.5 rounded-xl shadow-sm sm:shadow-md lg:shadow-lg border border-[#e6f0ea] hover:border-[#8ed5a5] transition-transform hover:scale-[1.01] lg:hover:scale-105 z-20">
                <div className="flex items-center justify-between gap-2 text-[10px] uppercase font-bold tracking-wider text-[#6b7280]">
                  <span className="flex items-center gap-1.5">
                    <span className="lg:hidden w-4 h-4 rounded-full bg-[#eaf5ee] text-[#135e38] inline-flex items-center justify-center text-[9px] font-extrabold shrink-0">
                      2
                    </span>
                    <span>SERVICE REQUEST</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#135e38] text-[10px] sm:text-[11px] font-semibold">
                    <Check className="w-3 h-3 text-[#135e38]" /> Worker matched
                  </span>
                </div>
                <div className="mt-1 lg:mt-1.5 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-[#111827]">Electrical Repair</h4>
                    <p className="text-[11px] sm:text-xs text-[#6b7280] flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#135e38]" /> Today • 4:00 PM
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: BOOKING CONFIRMED */}
              <div className="mt-2 lg:mt-0 w-full lg:w-auto lg:max-w-xs lg:absolute lg:-bottom-5 lg:left-10 bg-white p-2.5 sm:p-3 lg:p-3.5 rounded-xl shadow-sm sm:shadow-md lg:shadow-lg border border-[#e6f0ea] hover:border-[#8ed5a5] transition-transform hover:scale-[1.01] lg:hover:scale-105 z-20">
                <div className="flex items-center justify-between gap-2 text-[10px] uppercase font-bold tracking-wider text-[#6b7280]">
                  <span className="flex items-center gap-1.5">
                    <span className="lg:hidden w-4 h-4 rounded-full bg-[#eaf5ee] text-[#135e38] inline-flex items-center justify-center text-[9px] font-extrabold shrink-0">
                      3
                    </span>
                    <span>BOOKING CONFIRMED</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#135e38] text-[10px] sm:text-[11px] font-semibold">
                    <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#135e38]" /> Ready
                  </span>
                </div>
                <div className="mt-1 lg:mt-1.5 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-[#111827]">OTP Verification</h4>
                    <p className="text-[10px] sm:text-[11px] text-[#6b7280]">Secure job handoff at site</p>
                  </div>
                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-[#eaf5ee] text-[#004525] font-mono font-bold text-xs">
                    4829
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
