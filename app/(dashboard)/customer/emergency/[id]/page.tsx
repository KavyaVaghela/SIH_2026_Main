import { EmergencyTrackingView } from "@/features/customer/emergency/emergency-tracking-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerEmergencyTrackingPage({ params }: PageProps) {
  const { id } = await params;
  return <EmergencyTrackingView incidentId={id} />;
}
