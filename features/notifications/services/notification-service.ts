export interface NotificationPayload {
  profileId: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  metadata?: Record<string, any>;
}

export interface AppNotification {
  id: string;
  profileId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

export interface INotificationService {
  sendNotification(payload: NotificationPayload): Promise<AppNotification>;
  getUserNotifications(profileId: string): Promise<AppNotification[]>;
  markAsRead(notificationId: string): Promise<boolean>;
}

export class NotificationService implements INotificationService {
  private notificationsMap: Map<string, AppNotification[]> = new Map();

  async sendNotification(payload: NotificationPayload): Promise<AppNotification> {
    const notif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      profileId: payload.profileId,
      title: payload.title,
      message: payload.message,
      type: payload.type || "info",
      isRead: false,
      metadata: payload.metadata || null,
      createdAt: new Date().toISOString(),
    };

    const userNotifs = this.notificationsMap.get(payload.profileId) || [];
    userNotifs.unshift(notif);
    this.notificationsMap.set(payload.profileId, userNotifs);

    return notif;
  }

  async getUserNotifications(profileId: string): Promise<AppNotification[]> {
    return this.notificationsMap.get(profileId) || [];
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    for (const [, notifs] of this.notificationsMap.entries()) {
      const target = notifs.find((n) => n.id === notificationId);
      if (target) {
        target.isRead = true;
        return true;
      }
    }
    return false;
  }
}

export const notificationService = new NotificationService();
