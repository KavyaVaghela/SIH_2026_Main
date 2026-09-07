import * as React from "react";
import { FederationAdminShell } from "@/features/federation-admin/components/federation-admin-shell";

export const metadata = {
  title: "Federation Admin - KaushalyaSetu Cooperative Platform",
  description: "Administrative oversight, workforce management, dispute arbitration, and performance tracking for cooperative service federations.",
};

export default function FederationAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <FederationAdminShell
      userName="Federation Administrator"
      userRole="ABC Labour Cooperative Federation"
    >
      {children}
    </FederationAdminShell>
  );
}
