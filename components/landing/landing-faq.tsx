"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
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

  return (
    <section className="py-16 md:py-24 bg-[#f7faf8] border-b border-[#e6f0ea]" id="faq">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eaf5ee] text-[#004525] text-xs font-bold border border-[#8ed5a5] mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-[#135e38]" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111827]">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-base text-[#374151]">
            Common questions regarding how the cooperative platform operates for customers and workers.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const headingId = `faq-heading-${index}`;
            const panelId = `faq-panel-${index}`;

            return (
              <div
                key={index}
                className={`bg-white rounded-2xl transition-all duration-200 overflow-hidden border ${
                  isOpen ? "border-[#135e38] shadow-sm" : "border-[#e6f0ea]"
                }`}
              >
                <h3>
                  <button
                    type="button"
                    id={headingId}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                  >
                    <span className="font-bold text-base text-[#111827] leading-snug">
                      {faq.question}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isOpen ? "bg-[#135e38] text-white rotate-180" : "bg-[#eaf5ee] text-[#135e38]"
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>
                </h3>

                {isOpen && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={headingId}
                    className="px-6 pb-6 pt-1 border-t border-[#e6f0ea]"
                  >
                    <p className="text-sm text-[#374151] leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
