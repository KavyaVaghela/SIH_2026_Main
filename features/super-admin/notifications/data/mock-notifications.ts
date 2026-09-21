import type { SuperAdminNotification, NotificationCategory } from "../types";

export const NOTIFICATION_CATEGORY_META: Record<
  NotificationCategory,
  { label: string; defaultRoute: string }
> = {
  WORKER_SHORTAGE: {
    label: "Worker Shortage",
    defaultRoute: "/super-admin/analytics",
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
    id: "sa-notif-01",
    title: "Federation complaint received",
    description: "A federation has submitted a complaint that requires Super Admin review.",
    createdAt: "20 min ago",
    isRead: false,
    category: "HIGH_COMPLAINTS",
    severity: "HIGH",
    targetRoute: "/super-admin/complaints",
    actionLabel: "Review Complaint",
    entityId: "cmp-fed-01",
    entityType: "COMPLAINT",
  },
  {
    id: "sa-notif-02",
    title: "Escalated complaint",
    description: "A federation has escalated a complaint for Super Admin intervention.",
    createdAt: "1 hour ago",
    isRead: false,
    category: "HIGH_COMPLAINTS",
    severity: "HIGH",
    targetRoute: "/super-admin/complaints",
    actionLabel: "View Escalation",
    entityId: "cmp-esc-02",
    entityType: "COMPLAINT",
  },
  {
    id: "sa-notif-03",
    title: "Federation performance alert",
    description: "A federation currently has multiple pending complaints requiring attention.",
    createdAt: "3 hours ago",
    isRead: false,
    category: "HIGH_COMPLAINTS",
    severity: "HIGH",
    targetRoute: "/super-admin/societies",
    actionLabel: "Inspect Federation",
    entityId: "fed-perf-03",
    entityType: "SOCIETY",
  },
  {
    id: "sa-notif-04",
    title: "Federation review required",
    description: "A federation requires administrative review based on its current complaint activity.",
    createdAt: "Yesterday",
    isRead: true,
    category: "SOCIETY_AWAITING_APPROVAL",
    severity: "MEDIUM",
    targetRoute: "/super-admin/societies",
    actionLabel: "Review Federation",
    entityId: "fed-rev-04",
    entityType: "SOCIETY",
  },
  {
    id: "sa-notif-05",
    title: "Complaint resolution update",
    description: "An escalated federation complaint has been updated and is ready for review.",
    createdAt: "Yesterday",
    isRead: true,
    category: "HIGH_COMPLAINTS",
    severity: "LOW",
    targetRoute: "/super-admin/complaints",
    actionLabel: "Inspect Update",
    entityId: "cmp-upd-05",
    entityType: "COMPLAINT",
  },
];
