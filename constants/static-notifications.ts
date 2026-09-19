import type { PlatformRole } from "@/config/navigation";

export type NotificationType = "info" | "success" | "warning" | "alert";
export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface RoleNotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: NotificationType;
  priority?: NotificationPriority;
  targetRoute?: string;
}

/**
 * Pre-seeded static platform notifications strictly segmented by dashboard role.
 * These represent realistic operational platform events and are used for UI presentation
 * and validation prior to live realtime database integration.
 */
export const STATIC_ROLE_NOTIFICATIONS: Record<PlatformRole, RoleNotificationItem[]> = {
  CUSTOMER: [
    {
      id: "cust-notif-01",
      title: "New estimate received",
      message: "A worker has submitted an estimate for your plumbing service.",
      timestamp: "15 min ago",
      isRead: false,
      type: "info",
      priority: "medium",
      targetRoute: "/customer/payments",
    },
    {
      id: "cust-notif-02",
      title: "Booking confirmed",
      message: "Your booking with the selected worker has been confirmed.",
      timestamp: "1 hour ago",
      isRead: false,
      type: "success",
      priority: "high",
      targetRoute: "/customer/bookings",
    },
    {
      id: "cust-notif-03",
      title: "Payment required",
      message: "Your final service bill is ready. Please complete payment to continue.",
      timestamp: "3 hours ago",
      isRead: false,
      type: "warning",
      priority: "high",
      targetRoute: "/customer/payments",
    },
    {
      id: "cust-notif-04",
      title: "Complaint update",
      message: "Your complaint has been reviewed by the federation. Open the complaint to view the latest update.",
      timestamp: "Yesterday",
      isRead: true,
      type: "info",
      priority: "medium",
      targetRoute: "/customer/complaints",
    },
    {
      id: "cust-notif-05",
      title: "Service completed",
      message: "Your service has been marked as completed. Please review the final bill and payment details.",
      timestamp: "2 days ago",
      isRead: true,
      type: "success",
      priority: "low",
      targetRoute: "/customer/bookings",
    },
  ],

  WORKER: [
    {
      id: "wrk-notif-01",
      title: "New service request",
      message: "A customer has requested your services for a plumbing job.",
      timestamp: "5 min ago",
      isRead: false,
      type: "info",
      priority: "high",
      targetRoute: "/worker/schedule",
    },
    {
      id: "wrk-notif-02",
      title: "Booking confirmed",
      message: "Your service request has been accepted and the booking is confirmed.",
      timestamp: "30 min ago",
      isRead: false,
      type: "success",
      priority: "medium",
      targetRoute: "/worker/schedule",
    },
    {
      id: "wrk-notif-03",
      title: "Customer complaint",
      message: "A customer has submitted a complaint regarding a completed service. Please review the complaint and provide your response.",
      timestamp: "2 hours ago",
      isRead: false,
      type: "alert",
      priority: "high",
      targetRoute: "/worker/grievances",
    },
    {
      id: "wrk-notif-04",
      title: "Complaint response required",
      message: "The federation is waiting for your response regarding a customer complaint.",
      timestamp: "Yesterday",
      isRead: true,
      type: "warning",
      priority: "high",
      targetRoute: "/worker/grievances",
    },
    {
      id: "wrk-notif-05",
      title: "Payment received",
      message: "Payment for your completed service has been recorded successfully.",
      timestamp: "2 days ago",
      isRead: true,
      type: "success",
      priority: "low",
      targetRoute: "/worker/earnings",
    },
  ],

  FEDERATION_ADMIN: [
    {
      id: "fed-notif-01",
      title: "Worker registration pending",
      message: "A new worker registration is waiting for federation review.",
      timestamp: "12 min ago",
      isRead: false,
      type: "info",
      priority: "medium",
      targetRoute: "/federation-admin/worker-information",
    },
    {
      id: "fed-notif-02",
      title: "New customer complaint",
      message: "A customer complaint regarding a worker is waiting for your review.",
      timestamp: "45 min ago",
      isRead: false,
      type: "warning",
      priority: "high",
      targetRoute: "/federation-admin/complaint-management",
    },
    {
      id: "fed-notif-03",
      title: "Worker complaint received",
      message: "A worker has submitted a complaint that requires federation review.",
      timestamp: "2 hours ago",
      isRead: false,
      type: "alert",
      priority: "high",
      targetRoute: "/federation-admin/complaint-management",
    },
    {
      id: "fed-notif-04",
      title: "Worker response received",
      message: "A worker has submitted their response to a customer complaint.",
      timestamp: "Yesterday",
      isRead: true,
      type: "info",
      priority: "medium",
      targetRoute: "/federation-admin/complaint-management",
    },
    {
      id: "fed-notif-05",
      title: "Escalated complaint",
      message: "A complaint has been escalated to the Super Admin and requires attention.",
      timestamp: "2 days ago",
      isRead: true,
      type: "warning",
      priority: "high",
      targetRoute: "/federation-admin/complaint-management",
    },
  ],

  SUPER_ADMIN: [
    {
      id: "sa-notif-01",
      title: "Federation complaint received",
      message: "A federation has submitted a complaint that requires Super Admin review.",
      timestamp: "20 min ago",
      isRead: false,
      type: "warning",
      priority: "high",
      targetRoute: "/super-admin/complaints",
    },
    {
      id: "sa-notif-02",
      title: "Escalated complaint",
      message: "A federation has escalated a complaint for Super Admin intervention.",
      timestamp: "1 hour ago",
      isRead: false,
      type: "alert",
      priority: "urgent",
      targetRoute: "/super-admin/complaints",
    },
    {
      id: "sa-notif-03",
      title: "Federation performance alert",
      message: "A federation currently has multiple pending complaints requiring attention.",
      timestamp: "3 hours ago",
      isRead: false,
      type: "warning",
      priority: "high",
      targetRoute: "/super-admin/societies",
    },
    {
      id: "sa-notif-04",
      title: "Federation review required",
      message: "A federation requires administrative review based on its current complaint activity.",
      timestamp: "Yesterday",
      isRead: true,
      type: "info",
      priority: "medium",
      targetRoute: "/super-admin/societies",
    },
    {
      id: "sa-notif-05",
      title: "Complaint resolution update",
      message: "An escalated federation complaint has been updated and is ready for review.",
      timestamp: "2 days ago",
      isRead: true,
      type: "success",
      priority: "low",
      targetRoute: "/super-admin/complaints",
    },
  ],
};

/**
 * Derives the active platform role from the current URL pathname.
 */
export function getRoleFromPathname(pathname?: string | null): PlatformRole {
  if (!pathname) return "CUSTOMER";
  if (pathname.startsWith("/super-admin")) return "SUPER_ADMIN";
  if (pathname.startsWith("/federation-admin")) return "FEDERATION_ADMIN";
  if (pathname.startsWith("/worker")) return "WORKER";
  if (pathname.startsWith("/customer")) return "CUSTOMER";
  return "CUSTOMER";
}

/**
 * Retrieves a deep copy of static notifications for a specific role to ensure
 * clean local state isolation.
 */
export function getStaticNotificationsForRole(role: PlatformRole): RoleNotificationItem[] {
  const dataset = STATIC_ROLE_NOTIFICATIONS[role] || STATIC_ROLE_NOTIFICATIONS.CUSTOMER;
  return dataset.map((item) => ({ ...item }));
}
