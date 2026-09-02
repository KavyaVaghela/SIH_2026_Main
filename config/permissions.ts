import type { PlatformRole } from "@/types/roles";

export const PERMISSIONS: Record<PlatformRole, string[]> = {
  SUPER_ADMIN: [
    "manage_cooperatives",
    "view_global_audit",
    "manage_platform_settings",
    "override_disputes",
  ],
  FEDERATION_ADMIN: [
    "manage_federation_members",
    "manage_service_catalog",
    "manage_welfare_funds",
    "resolve_complaints",
  ],
  WORKER: [
    "accept_bookings",
    "update_availability",
    "view_earnings",
    "claim_welfare",
  ],
  CUSTOMER: [
    "browse_services",
    "create_bookings",
    "pay_invoices",
    "submit_reviews",
    "raise_complaints",
  ],
};
