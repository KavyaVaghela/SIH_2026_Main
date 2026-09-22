"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, ChevronDown, HelpCircle } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { LandingFaqAccordion } from "./landing-faq";
import { LanguageSelector } from "@/components/navigation/language-selector";


export function LandingNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isMobileFaqOpen, setIsMobileFaqOpen] = useState(false);
  const faqDropdownRef = useRef<HTMLDivElement>(null);

  // Close desktop FAQ dropdown on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        faqDropdownRef.current &&
        !faqDropdownRef.current.contains(event.target as Node)
      ) {
        setIsFaqOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsFaqOpen(false);
      }
    }

    if (isFaqOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFaqOpen]);

  // Support #faq hash to smoothly scroll to top and open the FAQ dropdown
  useEffect(() => {
    function checkHash() {
      if (typeof window !== "undefined" && window.location.hash === "#faq") {
        setIsFaqOpen(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e6f0ea] bg-white/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <Logo href="/" showTagline taglineText="Cooperative Platform" size="md" />

          {/* Desktop Navigation Links */}
          <nav
            className="hidden lg:flex items-center space-x-6 xl:space-x-7"
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

            {/* Desktop FAQ Dropdown Trigger & Panel */}
            <div className="relative" ref={faqDropdownRef}>
              <button
                type="button"
                id="landing-nav-faq-btn"
                onClick={() => setIsFaqOpen((prev) => !prev)}
                aria-expanded={isFaqOpen}
                aria-haspopup="true"
                className={`inline-flex items-center gap-1 text-sm font-semibold py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer ${
                  isFaqOpen
                    ? "text-[#135e38] bg-[#eaf5ee]"
                    : "text-[#374151] hover:text-[#135e38]"
                }`}
              >
                <span>FAQ</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isFaqOpen ? "rotate-180 text-[#135e38]" : ""
                  }`}
                />
              </button>

              {/* FAQ Desktop Dropdown Panel */}
              {isFaqOpen && (
                <div
                  className="absolute top-full right-0 mt-2 w-[520px] max-w-[90vw] bg-white rounded-2xl border border-[#8ed5a5]/70 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
                  role="region"
                  aria-label="FAQ Dropdown"
                >
                  {/* Dropdown Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#e6f0ea] mb-2 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#eaf5ee] text-[#135e38] flex items-center justify-center">
                        <HelpCircle className="w-3.5 h-3.5 text-[#135e38]" />
                      </div>
                      <h3 className="font-bold text-sm text-[#111827]">
                        Frequently Asked Questions
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-[#135e38] bg-[#eaf5ee] px-2 py-0.5 rounded-full border border-[#8ed5a5]/40">
                      9 Topics
                    </span>
                  </div>

                  {/* Dropdown Accordion Content */}
                  <div className="max-h-[60vh] overflow-y-auto pr-1">
                    <LandingFaqAccordion compact />
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Desktop Actions: Language Selector, Sign In & Get Started (Pill) */}
          <div className="hidden sm:flex items-center space-x-3">
            <LanguageSelector />
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

          {/* Mobile Menu Toggle & Language Selector */}
          <div className="flex sm:hidden items-center space-x-1.5">
            <LanguageSelector />
          </div>
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
        <div className="lg:hidden border-t border-[#e6f0ea] bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg max-h-[85vh] overflow-y-auto">
          <nav className="flex flex-col space-y-1.5 pb-3 border-b border-[#e6f0ea]">
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

            {/* Mobile FAQ Accordion Group */}
            <div className="pt-1">
              <button
                type="button"
                id="landing-mobile-faq-toggle"
                onClick={() => setIsMobileFaqOpen(!isMobileFaqOpen)}
                aria-expanded={isMobileFaqOpen}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-semibold text-[#374151] hover:bg-[#eaf5ee] hover:text-[#135e38] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#135e38]" />
                  <span>Frequently Asked Questions</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#135e38] transition-transform duration-200 ${
                    isMobileFaqOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isMobileFaqOpen && (
                <div className="mt-1.5 p-2 bg-[#f7faf8] rounded-xl border border-[#e6f0ea] max-h-[50vh] overflow-y-auto">
                  <LandingFaqAccordion compact onSelectQuestion={() => {}} />
                </div>
              )}
            </div>
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
