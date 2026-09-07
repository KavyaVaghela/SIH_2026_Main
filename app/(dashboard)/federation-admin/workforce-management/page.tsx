import * as React from "react";
import { WorkforceManagementView } from "@/features/federation-admin/workforce-management";

export const metadata = {
  title: "Workforce Management & Worker Activation - KaushalyaSetu",
  description:
    "Register federation workers, manage worker account status, and authorize workforce activation.",
};

export default function WorkforceManagementPage() {
  return <WorkforceManagementView />;
}
