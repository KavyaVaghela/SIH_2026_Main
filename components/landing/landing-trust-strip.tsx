import React from "react";
import { Users, AlertTriangle, Briefcase, Shield } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function LandingTrustStrip() {
  const { t } = useTranslation();
  const trustFeatures = [
    {
      icon: Users,
      title: t("landing.trustStrip.coopTitle", "Cooperative Network"),
      description: t("landing.trustStrip.coopDesc", "Workers operate through registered cooperative societies and federations."),
    },
    {
      icon: AlertTriangle,
      title: t("landing.trustStrip.emergencyTitle", "Emergency Services"),
      description: t("landing.trustStrip.emergencyDesc", "Priority assistance for urgent household repairs connecting with on-call cooperative professionals."),
    },
    {
      icon: Briefcase,
      title: t("landing.trustStrip.largeProjectsTitle", "Large Project Service"),
      description: t("landing.trustStrip.largeProjectsDesc", "Support for bulk or large-scale service requirements through coordinated cooperative workers and workforce planning."),
    },
    {
      icon: Shield,
      title: t("landing.trustStrip.grievanceTitle", "Grievance Support"),
      description: t("landing.trustStrip.grievanceDesc", "Booking-linked complaints can be reviewed through the federation and escalated when required."),
    },
  ];

  return (
    <section className="bg-white py-5 sm:py-6 md:py-7 border-b border-[#e6f0ea]" id="trust-strip">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eaf5ee] text-[#004525] text-[10px] sm:text-[11px] font-bold border border-[#8ed5a5] mb-1.5 uppercase tracking-wider">
            <span>{t("landing.trustStrip.eyebrow", "Platform Highlights")}</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-[#111827]">
            {t("landing.trustStrip.title", "Built for Reliable & Inclusive Service Delivery")}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
          {trustFeatures.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl bg-[#f4fbf6] border border-[#e6f0ea] hover:border-[#8ed5a5] transition-all h-full"
              >
                <div className="p-2 rounded-lg bg-[#eaf5ee] text-[#135e38] shrink-0">
                  <IconComponent className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
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
