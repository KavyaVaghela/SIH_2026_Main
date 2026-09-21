import { FederationProjectsView } from "@/features/federation-admin/projects/federation-projects-view";

export const metadata = {
  title: "Large Project Management - Federation Admin",
  description: "Review customer project requests, formulate labor and material estimates, dispatch proposals, and monitor artisan daily progress logs.",
};

export default function FederationProjectsPage() {
  return <FederationProjectsView />;
}
