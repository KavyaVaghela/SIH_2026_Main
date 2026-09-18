"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Building2, Menu, X, ArrowRight } from "lucide-react";

export function LandingNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e6f0ea] bg-white/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <Link
            href="/"
            className="flex items-center space-x-2.5 group"
            id="landing-navbar-logo"
            aria-label="KaushalyaSetu Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#135e38] text-white shadow-sm transition-transform group-hover:scale-105">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-tight text-[#111827]">
                KaushalyaSetu
              </span>
              <span className="text-[10px] font-semibold text-[#135e38] tracking-wide">
                Cooperative Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            className="hidden lg:flex items-center space-x-7"
            aria-label="Primary Landing Navigation"
          >
            <Link
              href="/#home"
              id="landing-nav-home"
              className="text-sm font-semibold text-[#374151] hover:text-[#135e38] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/#services"
              id="landing-nav-services"
              className="text-sm font-semibold text-[#374151] hover:text-[#135e38] transition-colors"
            >
              Services
            </Link>
            <Link
              href="/#how-it-works"
              id="landing-nav-how-it-works"
              className="text-sm font-semibold text-[#374151] hover:text-[#135e38] transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/#ecosystem"
              id="landing-nav-ecosystem"
              className="text-sm font-semibold text-[#374151] hover:text-[#135e38] transition-colors"
            >
              Ecosystem
            </Link>
            <Link
              href="/#welfare"
              id="landing-nav-welfare"
              className="text-sm font-semibold text-[#374151] hover:text-[#135e38] transition-colors"
            >
              Worker Welfare
            </Link>
            <Link
              href="/#faq"
              id="landing-nav-faq"
              className="text-sm font-semibold text-[#374151] hover:text-[#135e38] transition-colors"
            >
              FAQ
            </Link>
          </nav>

          {/* Desktop Actions: Sign In & Get Started (Pill) */}
          <div className="hidden sm:flex items-center space-x-3">
            <Link
              href="/login"
              id="landing-nav-signin"
              className="px-4 py-2 text-sm font-semibold text-[#374151] hover:text-[#135e38] rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              id="landing-nav-get-started"
              className="px-5 py-2 text-sm font-semibold rounded-full bg-[#135e38] text-white hover:bg-[#0c4427] transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              id="landing-mobile-menu-toggle"
              aria-label="Toggle navigation menu"
              className="p-2 rounded-lg text-[#374151] hover:bg-[#eaf5ee] focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[#e6f0ea] bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-2 pb-3 border-b border-[#e6f0ea]">
            <Link
              href="/#home"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-semibold text-[#374151] hover:bg-[#eaf5ee] hover:text-[#135e38]"
            >
              Home
            </Link>
            <Link
              href="/#services"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-semibold text-[#374151] hover:bg-[#eaf5ee] hover:text-[#135e38]"
            >
              Services
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-semibold text-[#374151] hover:bg-[#eaf5ee] hover:text-[#135e38]"
            >
              How It Works
            </Link>
            <Link
              href="/#ecosystem"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-semibold text-[#374151] hover:bg-[#eaf5ee] hover:text-[#135e38]"
            >
              Ecosystem
            </Link>
            <Link
              href="/#welfare"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-semibold text-[#374151] hover:bg-[#eaf5ee] hover:text-[#135e38]"
            >
              Worker Welfare
            </Link>
            <Link
              href="/#faq"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-semibold text-[#374151] hover:bg-[#eaf5ee] hover:text-[#135e38]"
            >
              FAQ
            </Link>
          </nav>
          <div className="flex flex-col space-y-2 pt-2">
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-sm font-semibold rounded-lg border border-[#e6f0ea] text-[#374151] hover:bg-[#eaf5ee]"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-sm font-semibold rounded-full bg-[#135e38] text-white hover:bg-[#0c4427] flex items-center justify-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
