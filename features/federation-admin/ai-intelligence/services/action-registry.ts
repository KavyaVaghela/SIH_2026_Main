import type { OperationalActionId } from "@/lib/ai/ai-types";

export interface ResolvedAction {
  id: OperationalActionId;
  label: string;
  href: string;
  description: string;
  variant?: "default" | "outline" | "secondary";
  targetNewTab?: boolean;
}

export interface ActionMeta {
  trade?: string;
  issueId?: string;
}

/**
 * Central Operational Action Registry.
 *
 * Guarantees every action button performs a safe, working navigation to
 * an authorized platform workflow without modifying database records or lifecycles.
 */
export const OPERATIONAL_ACTIONS: Record<
  OperationalActionId,
  (meta?: ActionMeta) => ResolvedAction
> = {
  REVIEW_TRADE_WORKERS: (meta) => {
    const trade = meta?.trade ? meta.trade.trim() : "";
    return {
      id: "REVIEW_TRADE_WORKERS",
      label: trade ? `Review ${trade}s` : "Review Qualified Workers",
      href: trade
        ? `/federation-admin/workforce-management?search=${encodeURIComponent(trade)}`
        : "/federation-admin/workforce-management",
      description: `Inspect active roster and contact availability for ${trade || "selected trade"}.`,
      variant: "default",
    };
  },

  REVIEW_WORKFORCE: () => ({
    id: "REVIEW_WORKFORCE",
    label: "Open Workforce Roster",
    href: "/federation-admin/workforce-management",
    description: "Inspect verified craftsmen, availability statuses, and activation states.",
    variant: "default",
  }),

  REVIEW_UNDERUTILIZED: () => ({
    id: "REVIEW_UNDERUTILIZED",
    label: "Review Under-Utilized Workers",
    href: "/federation-admin/workforce-management",
    description: "Identify craftsmen operating under 40% capacity to schedule open jobs.",
    variant: "default",
  }),

  OPEN_ALLOCATION_OPPORTUNITIES: (meta) => {
    const trade = meta?.trade ? meta.trade.trim() : "";
    return {
      id: "OPEN_ALLOCATION_OPPORTUNITIES",
      label: "View Allocation Opportunities",
      href: trade
        ? `/federation-admin/workforce-management?search=${encodeURIComponent(trade)}`
        : "/federation-admin/workforce-management",
      description: "Evaluate multi-trade deployments and cross-federation capacity sharing.",
      variant: "outline",
    };
  },

  OPEN_COMPLAINTS: () => ({
    id: "OPEN_COMPLAINTS",
    label: "Review Open Complaints",
    href: "/federation-admin/complaint-management",
    description: "Inspect unresolved grievances, hearing schedules, and conciliation files.",
    variant: "default",
  }),

  OPEN_EMERGENCY: () => ({
    id: "OPEN_EMERGENCY",
    label: "Open Emergency Control",
    href: "/federation-admin/emergency",
    description: "Manage rapid dispatch queues, active incidents, and response teams.",
    variant: "default",
  }),

  OPEN_PROJECTS: () => ({
    id: "OPEN_PROJECTS",
    label: "Review Large Projects",
    href: "/federation-admin/projects",
    description: "Inspect commercial project requirements, milestones, and workforce locks.",
    variant: "default",
  }),

  OPEN_KAUSHALGROW: () => ({
    id: "OPEN_KAUSHALGROW",
    label: "Open KaushalGrow",
    href: "/worker/grow",
    description: "Explore cooperative trade certification courses and training modules.",
    variant: "outline",
  }),

  REVIEW_CERTIFICATIONS: (meta) => {
    const trade = meta?.trade ? meta.trade.trim() : "";
    return {
      id: "REVIEW_CERTIFICATIONS",
      label: "Review Certification Gaps",
      href: trade
        ? `/federation-admin/workforce-management?search=${encodeURIComponent(trade)}`
        : "/federation-admin/workforce-management",
      description: "Inspect verified trade certifications and skill gaps on the roster.",
      variant: "outline",
    };
  },
};

/**
 * Resolves an action ID into a safe executable UI action with an href.
 */
export function resolveOperationalAction(
  actionId: OperationalActionId,
  meta?: ActionMeta
): ResolvedAction {
  const resolver = OPERATIONAL_ACTIONS[actionId];
  if (resolver) {
    return resolver(meta);
  }

  // Safe fallback to workforce management
  return {
    id: actionId,
    label: "Review Workforce",
    href: "/federation-admin/workforce-management",
    description: "Inspect federation workforce management.",
    variant: "outline",
  };
}
