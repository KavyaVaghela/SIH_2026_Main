import React from "react";
import { Users, FileSpreadsheet, CheckCircle2, Shield } from "lucide-react";

export function LandingTrustStrip() {
  const trustFeatures = [
    {
      icon: Users,
      title: "Cooperative Affiliation",
      description: "Workers operate through registered cooperative societies and federations.",
    },
    {
      icon: FileSpreadsheet,
      title: "Itemized Estimates",
      description: "Customers can compare worker estimates containing labor and material costs.",
    },
    {
      icon: CheckCircle2,
      title: "Structured Service Workflow",
      description: "Booking progresses through defined stages including arrival and OTP verification.",
    },
    {
      icon: Shield,
      title: "Grievance Resolution",
      description: "Booking-linked complaints can be reviewed through the federation and escalated when required.",
    },
  ];

  return (
    <section className="bg-white py-6 sm:py-7 md:py-8 border-b border-[#e6f0ea]" id="trust-strip">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {trustFeatures.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl bg-[#f4fbf6] border border-[#e6f0ea] hover:border-[#8ed5a5] transition-all"
              >
                <div className="p-2 rounded-lg bg-[#eaf5ee] text-[#135e38] shrink-0">
                  <IconComponent className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#111827]">{item.title}</h3>
                  <p className="text-xs text-[#6b7280] mt-0.5 leading-snug">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
