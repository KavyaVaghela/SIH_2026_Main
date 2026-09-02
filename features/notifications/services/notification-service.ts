import type { Notification } from "@/types";

export interface INotificationService {
  sendNotification(profileId: string, title: string, message: string, type?: string): Promise<Notification>;
  getUserNotifications(profileId: string): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<boolean>;
}

export class NotificationService implements INotificationService {
  async sendNotification(profileId: string, title: string, message: string, type = "info"): Promise<Notification> {
    return {
      id: `notif-${Date.now()}`,
      profileId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
  }

  async getUserNotifications(profileId: string): Promise<Notification[]> {
    return [
      {
        id: "notif-1",
        profileId,
        title: "Booking Assigned",
        message: "Worker Ramesh has accepted your service request.",
        type: "success",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    console.log(`Marked notification ${notificationId} read`);
    return true;
  }
}

export const notificationService = new NotificationService();
