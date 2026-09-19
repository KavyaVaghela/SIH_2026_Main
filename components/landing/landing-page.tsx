"use client";

import React from "react";
import "./landing.css";
import { AuthModalProvider } from "./landing-auth-modal";
import { LandingNavbar } from "./landing-navbar";
import { LandingHero } from "./landing-hero";
import { LandingTrustStrip } from "./landing-trust-strip";
import { LandingServices } from "./landing-services";
import { LandingAiPlatform } from "./landing-ai-platform";
import { LandingHowItWorks } from "./landing-how-it-works";
import { LandingEcosystem } from "./landing-ecosystem";
import { LandingWorkerSupport } from "./landing-worker-support";
import { LandingEmergency } from "./landing-emergency";
import { LandingCTA } from "./landing-cta";
import { LandingFooter } from "./landing-footer";

export function LandingPage() {
  return (
    <AuthModalProvider>
      <div className="landing-root min-h-screen bg-white">
        {/* 1. Navbar */}
        <LandingNavbar />

        {/* Main Landing Sections */}
        <main id="main-content" className="flex-grow">
          {/* 2. Hero */}
          <LandingHero />

          {/* 3. 4 Feature Cards (Trust Strip) */}
          <LandingTrustStrip />

          {/* 4. Smarter Connections Powered by AI */}
          <LandingAiPlatform />

          {/* 5. Services for Everyday Needs */}
          <LandingServices />

          {/* 6. How It Works */}
          <LandingHowItWorks />

          {/* 6. Customers / Workers / Cooperatives (Ecosystem) */}
          <LandingEcosystem />

          {/* 7. Worker Support */}
          <LandingWorkerSupport />

          {/* 8. Emergency Strip */}
          <LandingEmergency />

          {/* 9. Final CTA */}
          <LandingCTA />
        </main>

        {/* 10. Footer */}
        <LandingFooter />
      </div>
    </AuthModalProvider>
  );
}
