import { GuidanceCenterView } from "@/features/guidance/components/guidance-center-view";

export const metadata = {
  title: "Help & Guidance | KaushalyaSetu Customer",
  description: "Comprehensive in-product guidance and support for KaushalyaSetu household customers.",
};

export default function CustomerGuidancePage() {
  return <GuidanceCenterView role="CUSTOMER" userName="Prince Patel" />;
}
