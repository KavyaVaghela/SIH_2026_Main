"use client";

import React from "react";
import Link from "next/link";
import { Building2, ExternalLink } from "lucide-react";
import { useAuthModal } from "./landing-auth-modal";

export function LandingFooter() {
  const { openAuthModal } = useAuthModal();

  const navLinks = [
    { label: "Home", href: "/#home" },
    { label: "Services", href: "/#services" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Ecosystem", href: "/#ecosystem" },
    { label: "Worker Support / Welfare", href: "/#welfare" },
    { label: "FAQ", href: "/#faq" },
  ];

  const platformPortals = [
    {
      label: "Customer Portal",
      direct: false,
      contextMsg: "Sign in to access the customer booking portal.",
    },
    {
      label: "Worker Portal",
      direct: false,
      contextMsg: "Sign in to access the cooperative worker portal.",
    },
    {
      label: "Federation Console",
      direct: false,
      contextMsg: "Sign in to access the federation administration console.",
    },
    {
      label: "Find a Service",
      direct: false,
      contextMsg: "Sign in to request household services.",
    },
    {
      label: "Sign In",
      direct: true,
      href: "/login",
    },
    {
      label: "Get Started",
      direct: true,
      href: "/register",
    },
  ];

  return (
    <footer className="bg-[#00381e] text-[#eaf5ee] border-t border-[#135e38]" id="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
          {/* Column 1 & 2: Brand, Tagline & Mission */}
          <div className="lg:col-span-2 space-y-2.5">
            <Link href="/" className="flex items-center space-x-2.5 group" id="footer-logo">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#135e38] text-white border border-[#8ed5a5] shadow-sm transition-transform group-hover:scale-105">
                <Building2 className="h-5 w-5 text-[#8ed5a5]" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-white">KaushalyaSetu</span>
                <span className="text-[11px] font-medium text-[#8ed5a5]">
                  Cooperative Gig Services Platform
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm font-semibold text-white">
              Connecting skilled people, customers and cooperatives.
            </p>

            <p className="text-xs text-[#eaf5ee]/80 leading-relaxed max-w-sm">
              A digital platform connecting households with skilled trade workers through local
              cooperative societies and federations for household maintenance, repair, and community
              services.
            </p>
          </div>

          {/* Column 3: Navigation Links */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-2.5 border-b border-[#135e38] pb-1.5">
              Navigation
            </h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs text-[#eaf5ee]/90">
              {navLinks.map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    onClick={() => {
                      if (link.href === "/#faq" && typeof window !== "undefined") {
                        window.location.hash = "#faq";
                        window.dispatchEvent(new HashChangeEvent("hashchange"));
                      }
                    }}
                    className="hover:text-white hover:underline transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Platform Portals */}
          <div className="lg:col-span-2">
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-2.5 border-b border-[#135e38] pb-1.5">
              Platform Portals
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs text-[#eaf5ee]/90">
              {platformPortals.map((portal, idx) => (
                <li key={idx}>
                  {portal.direct && portal.href ? (
                    <Link
                      href={portal.href}
                      className="hover:text-white hover:underline transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>{portal.label}</span>
                      <ExternalLink className="w-3 h-3 text-[#8ed5a5]/70" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openAuthModal(portal.contextMsg)}
                      className="hover:text-white hover:underline transition-colors inline-flex items-center gap-1 cursor-pointer text-left"
                    >
                      <span>{portal.label}</span>
                      <ExternalLink className="w-3 h-3 text-[#8ed5a5]/70" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Legal Copyright Bar */}
        <div className="mt-8 pt-5 border-t border-[#135e38] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8ed5a5]">
          <p>© 2026 KaushalyaSetu. All rights reserved.</p>
          <div className="flex items-center space-x-4 text-[#eaf5ee]/70">
            <span>Cooperative Gig Services Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
