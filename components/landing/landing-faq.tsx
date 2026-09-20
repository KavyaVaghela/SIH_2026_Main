"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export interface FAQItem {
  question: string;
  answer: string;
}

export const landingFaqs: FAQItem[] = [
  {
    question: "What is KaushalyaSetu?",
    answer:
      "KaushalyaSetu is a digital cooperative services platform connecting households with skilled trade workers through registered cooperative societies and federations for home maintenance, repair, and community services.",
  },
  {
    question: "How do I request a service?",
    answer:
      "Customers choose an essential trade service, provide task details and location, specify an appointment schedule, and submit their request to notify nearby eligible cooperative workers.",
  },
  {
    question: "How are workers matched with my request?",
    answer:
      "The platform evaluates verified trade skills, live availability, geographic proximity, and active federation membership to match eligible cooperative workers within your local area.",
  },
  {
    question: "Can I compare estimates from multiple workers?",
    answer:
      "Yes. Nearby eligible workers review your request and submit itemized estimates detailing labor and anticipated material costs, allowing you to compare and select the best estimate.",
  },
  {
    question: "How does OTP verification work?",
    answer:
      "When the selected worker arrives at your location, a secure 4-digit one-time passcode (OTP) displayed on your booking screen must be entered by the worker to officially start the service.",
  },
  {
    question: "How does billing and payment work?",
    answer:
      "Upon job completion, the worker generates an itemized final bill covering actual labor and materials. Customers review the breakdown and settle payment securely online with digital receipt generation.",
  },
  {
    question: "How can a worker join KaushalyaSetu?",
    answer:
      "Skilled craftspeople can register through their local cooperative society by submitting their trade credentials, identity verification, and bank details for federation approval.",
  },
  {
    question: "What role does the cooperative/federation play?",
    answer:
      "District cooperative federations verify and onboard workers, maintain member trade records, oversee service standards, support welfare initiatives, and handle dispute mediation.",
  },
  {
    question: "What happens if there is a problem with a service?",
    answer:
      "Both customers and workers can file formal, booking-linked grievances through the platform. Disputes are reviewed and mediated by federation administrators, with escalation to Super Admin if needed.",
  },
];

export function LandingFaqAccordion({
  compact = false,
  onSelectQuestion,
}: {
  compact?: boolean;
  onSelectQuestion?: () => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2.5"}>
      {landingFaqs.map((faq, index) => {
        const isOpen = openIndex === index;
        const headingId = `faq-heading-${index}`;
        const panelId = `faq-panel-${index}`;

        return (
          <div
            key={index}
            className={`rounded-xl border transition-all duration-150 overflow-hidden ${
              isOpen
                ? "border-[#135e38] bg-[#f4fbf6]/70 shadow-xs"
                : "border-[#e6f0ea] bg-white hover:border-[#8ed5a5]"
            }`}
          >
            <h3>
              <button
                type="button"
                id={headingId}
                onClick={() => {
                  setOpenIndex(isOpen ? null : index);
                  if (onSelectQuestion) onSelectQuestion();
                }}
                className={`w-full text-left flex items-center justify-between gap-3 focus:outline-none cursor-pointer ${
                  compact
                    ? "px-3.5 py-2.5"
                    : "px-4 sm:px-5 py-3 sm:py-3.5"
                }`}
                aria-expanded={isOpen}
                aria-controls={panelId}
              >
                <span
                  className={`font-bold text-[#111827] leading-snug ${
                    compact ? "text-xs sm:text-sm" : "text-sm sm:text-base"
                  }`}
                >
                  {faq.question}
                </span>
                <div
                  className={`flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    compact
                      ? "w-6 h-6 rounded-full bg-[#eaf5ee] text-[#135e38]"
                      : "w-7 h-7 rounded-full bg-[#eaf5ee] text-[#135e38]"
                  } ${isOpen ? "bg-[#135e38] text-white rotate-180" : ""}`}
                >
                  <ChevronDown className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
                </div>
              </button>
            </h3>

            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={headingId}
                className={`border-t border-[#e6f0ea] ${
                  compact
                    ? "px-3.5 pb-2.5 pt-1.5 text-xs text-[#374151] leading-relaxed"
                    : "px-4 sm:px-5 pb-3.5 sm:pb-4 pt-2 text-xs sm:text-sm text-[#374151] leading-relaxed"
                }`}
              >
                <p>{faq.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function LandingFAQ() {
  return (
    <section className="py-8 sm:py-10 md:py-12 bg-[#f7faf8] border-b border-[#e6f0ea]" id="faq">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eaf5ee] text-[#004525] text-xs font-bold border border-[#8ed5a5] mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-[#135e38]" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
            Frequently Asked Questions
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#374151]">
            Common questions regarding how the cooperative platform operates for customers and workers.
          </p>
        </div>

        {/* Accordion List */}
        <LandingFaqAccordion />
      </div>
    </section>
  );
}
