import * as React from "react";
import { EmergencyDetailControlView } from "@/features/federation-admin/emergency/emergency-detail-control-view";

export const metadata = {
  title: "Emergency Detail & Control - Federation Administrator",
  description: "Incident supervision, response team staffing, and field coordination.",
};

export default async function FederationEmergencyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  return <EmergencyDetailControlView incidentId={id} />;
}
