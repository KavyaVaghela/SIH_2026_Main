import type { SuperAdminNotification, NotificationCategory } from "../types";

export const NOTIFICATION_CATEGORY_META: Record<
  NotificationCategory,
  { label: string; defaultRoute: string }
> = {
  WORKER_SHORTAGE: {
    label: "Worker Shortage",
    defaultRoute: "/super-admin/demand-intelligence",
  },
  NEW_SOCIETY_REGISTRATION: {
    label: "New Society Registration",
    defaultRoute: "/super-admin/societies",
  },
  SOCIETY_AWAITING_APPROVAL: {
    label: "Society Awaiting Approval",
    defaultRoute: "/super-admin/societies",
  },
  HIGH_COMPLAINTS: {
    label: "High Complaints Surge",
    defaultRoute: "/super-admin/complaints",
  },
  WELFARE_EXPIRY: {
    label: "Welfare Policy Expiry",
    defaultRoute: "/super-admin/welfare",
  },
  UNUSUAL_CANCELLATION: {
    label: "Unusual Cancellation Rate",
    defaultRoute: "/super-admin/bookings",
  },
};

export const MOCK_NOTIFICATIONS: SuperAdminNotification[] = [
  {
    id: "notif-001",
    title: "Critical Worker Shortage: Electrical Craftsmen (Andheri West)",
    description:
      "Unfulfilled gig requests reached 38 in Western Mumbai Suburbs. Demand ratio is 2.8x available active electricians. Inter-society allocation recommended.",
    createdAt: "10 mins ago",
    isRead: false,
    category: "WORKER_SHORTAGE",
    severity: "HIGH",
    targetRoute: "/super-admin/demand-intelligence",
    actionLabel: "Inspect Shortage Hotspot",
    entityId: "hotspot-001",
    entityType: "SHORTAGE_CLUSTER",
  },
  {
    id: "notif-002",
    title: "Health & Accidental Coverage Expiring: 3 Policies Under 15 Days",
    description:
      "Group insurance coverage for Rohan Verma and 2 other craftsmen expires on 2026-09-18. Renewal notices dispatched to Mumbai Central administration.",
    createdAt: "45 mins ago",
    isRead: false,
    category: "WELFARE_EXPIRY",
    severity: "HIGH",
    targetRoute: "/super-admin/welfare?status=EXPIRING_SOON",
    actionLabel: "Inspect Expiring Policies",
    entityId: "wlf-002",
    entityType: "WELFARE_RECORD",
  },
  {
    id: "notif-003",
    title: "Federation Approval Pending: Thane District Artisans Cooperative",
    description:
      "Legal bylaws, founding member roster (88 craftsmen), and cooperative escrow details verified by legal audit. Super Admin approval required.",
    createdAt: "2 hours ago",
    isRead: false,
    category: "SOCIETY_AWAITING_APPROVAL",
    severity: "HIGH",
    targetRoute: "/super-admin/societies/fed-003",
    actionLabel: "Review Society Dossier",
    entityId: "fed-003",
    entityType: "SOCIETY",
  },
  {
    id: "notif-004",
    title: "New Society Registration: South Mumbai Tradesmen Society",
    description:
      "A new multi-trade cooperative federation has submitted application documents and 45 founding member profiles for initial compliance verification.",
    createdAt: "5 hours ago",
    isRead: true,
    category: "NEW_SOCIETY_REGISTRATION",
    severity: "MEDIUM",
    targetRoute: "/super-admin/societies",
    actionLabel: "View Societies Registry",
    entityId: "fed-005",
    entityType: "SOCIETY",
  },
  {
    id: "notif-005",
    title: "Grievance Surge: High Volume of Service Standard Disputes",
    description:
      "4 service quality complaints submitted in the electrical maintenance category in the last 48 hours. Review dispute statements and supervisor logs.",
    createdAt: "Yesterday at 04:30 PM",
    isRead: true,
    category: "HIGH_COMPLAINTS",
    severity: "HIGH",
    targetRoute: "/super-admin/complaints?category=SERVICE_QUALITY",
    actionLabel: "Investigate Complaints",
    entityId: "cmp-001",
    entityType: "COMPLAINT",
  },
  {
    id: "notif-006",
    title: "Anomalous Cancellation Rate Spike (14.2%) Detected",
    description:
      "Morning slot cancellations exceeded the 8% platform threshold in Mumbai Central sector. Investigating worker transit and arrival delays.",
    createdAt: "Yesterday at 11:15 AM",
    isRead: true,
    category: "UNUSUAL_CANCELLATION",
    severity: "MEDIUM",
    targetRoute: "/super-admin/bookings?status=CANCELLED",
    actionLabel: "Inspect Cancelled Bookings",
    entityId: "anom-001",
    entityType: "BOOKING_METRIC",
  },
];
