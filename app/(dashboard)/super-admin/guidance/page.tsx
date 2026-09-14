import { GuidanceCenterView } from "@/features/guidance/components/guidance-center-view";

export const metadata = {
  title: "Help & Guidance | Super Administrator",
  description: "Platform governance, cross-federation oversight, and dispute adjudication.",
};

export default function SuperAdminGuidancePage() {
  return <GuidanceCenterView role="SUPER_ADMIN" userName="System Administrator" />;
}
