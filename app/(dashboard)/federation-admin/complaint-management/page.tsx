import * as React from "react";
import { ComplaintManagementView } from "@/features/federation-admin/complaint-management";

export const metadata = {
  title: "Complaint Management & Grievance Conciliation - KaushalyaSetu",
  description:
    "Arbitrate customer grievances, inspect service dispute statements, and manage official dispute settlements for federation workers.",
};

export default function ComplaintManagementPage() {
  return <ComplaintManagementView />;
}
