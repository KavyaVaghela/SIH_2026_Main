import { SuperAdminLMSView } from "@/features/super-admin/learning-management/super-admin-lms-view";

export const metadata = {
  title: "KaushalGrow - SuperAdmin Control",
  description: "Manage learning resources, skill categories, and monitor worker skills progression across cooperative societies.",
};

export default function SuperAdminLearningPage() {
  return <SuperAdminLMSView />;
}
