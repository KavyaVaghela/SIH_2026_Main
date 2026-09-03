"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { InsuranceCoverageCard } from "./insurance-coverage-card";
import { WelfareBenefitsCard } from "./welfare-benefits-card";
import { CertificationsListCard } from "./certifications-list-card";
import { ExpiringCertAlert } from "./expiring-cert-alert";
import { workerJobService } from "../services/worker-job-service";
import type { WorkerWelfareDetails } from "../types";

export function WelfareCertificationView() {
  const [loading, setLoading] = React.useState(true);
  const [welfareData, setWelfareData] = React.useState<WorkerWelfareDetails | null>(null);

  const loadWelfare = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await workerJobService.getWorkerWelfareDetails("w-1");
      setWelfareData(data);
    } catch (err) {
      console.error("Failed to load worker welfare details", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadWelfare();
  }, [loadWelfare]);

  if (loading || !welfareData) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Welfare &amp; Certification"
          description="Loading verified cooperative insurance and certifications..."
          breadcrumbs={[
            { label: "Worker Portal", href: "/worker" },
            { label: "Welfare & Certification" },
          ]}
        />
        <div className="p-12 text-center text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-sm font-medium">Fetching verified welfare profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Welfare &amp; Certification"
        description="Cooperative health insurance cover, welfare fund benefits, and verified trade certifications."
        breadcrumbs={[
          { label: "Worker Portal", href: "/worker" },
          { label: "Welfare & Certification" },
        ]}
      />

      {/* 1. Expiring Certification Warning Banner */}
      {welfareData.expiringWarning && (
        <ExpiringCertAlert
          certName={welfareData.expiringWarning.certName}
          daysRemaining={welfareData.expiringWarning.daysRemaining}
        />
      )}

      {/* 2. Primary Insurance & Welfare Standing */}
      <InsuranceCoverageCard
        insuranceStatus={welfareData.insuranceStatus}
        coverageAmount={welfareData.coverageAmount}
        policyNumber={welfareData.policyNumber}
        providerName={welfareData.providerName}
        welfareSchemeStatus={welfareData.welfareSchemeStatus}
        emergencyAssistanceStatus={welfareData.emergencyAssistanceStatus}
      />

      {/* 3. Statutory Welfare Benefits & Support Programs */}
      <WelfareBenefitsCard benefits={welfareData.benefits} />

      {/* 4. Verified Trade Certifications & Compliances */}
      <CertificationsListCard certifications={welfareData.certifications} />
    </div>
  );
}
