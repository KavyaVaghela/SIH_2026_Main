export type NotificationCategory =
  | "WORKER_SHORTAGE"
  | "NEW_SOCIETY_REGISTRATION"
  | "SOCIETY_AWAITING_APPROVAL"
  | "HIGH_COMPLAINTS"
  | "WELFARE_EXPIRY"
  | "UNUSUAL_CANCELLATION";

export type NotificationSeverity = "HIGH" | "MEDIUM" | "LOW";

export interface SuperAdminNotification {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  isRead: boolean;
  category: NotificationCategory;
  severity: NotificationSeverity;
  targetRoute: string;
  actionLabel: string;
  entityId?: string;
  entityType?: string;
}

export interface NotificationFilterOptions {
  readStatus: "ALL" | "UNREAD" | "READ";
  category: "ALL" | NotificationCategory;
  searchQuery: string;
  page: number;
  pageSize: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
}
