import { GuidanceCenterView } from "@/features/guidance/components/guidance-center-view";

export const metadata = {
  title: "Help & Guidance | Federation Administration",
  description: "Workforce governance, verification procedures, and grievance conciliation guidance.",
};

export default function FederationAdminGuidancePage() {
  return <GuidanceCenterView role="FEDERATION_ADMIN" userName="Federation Admin" />;
}
