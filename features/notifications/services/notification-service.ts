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
    let dbNotif: AppNotification | null = null;

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("notifications") as any)
        .insert({
          profile_id: payload.profileId.includes("-") && !payload.profileId.startsWith("p-") ? payload.profileId : "a0000000-0000-0000-0000-000000000001",
          title: payload.title,
          message: payload.message,
          type: payload.type || "info",
          is_read: false,
          metadata: payload.metadata || null,
        })
        .select()
        .single();

      if (!error && data) {
        dbNotif = {
          id: data.id,
          profileId: data.profile_id,
          title: data.title,
          message: data.message,
          type: data.type,
          isRead: data.is_read,
          metadata: data.metadata,
          createdAt: data.created_at,
        };
      }
    } catch (err) {
      console.warn("DB sendNotification insert notice:", err);
    }

    const notif: AppNotification = dbNotif || {
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
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("notifications") as any)
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dbNotifs: AppNotification[] = data.map((n: any) => ({
          id: n.id,
          profileId: n.profile_id,
          title: n.title,
          message: n.message,
          type: n.type,
          isRead: n.is_read,
          metadata: n.metadata,
          createdAt: n.created_at,
        }));
        this.notificationsMap.set(profileId, dbNotifs);
        return dbNotifs;
      }
    } catch (err) {
      console.warn("DB getUserNotifications query notice:", err);
    }
    return this.notificationsMap.get(profileId) || [];
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("notifications") as any)
        .update({ is_read: true })
        .eq("id", notificationId);
    } catch (err) {
      console.warn("DB markAsRead update notice:", err);
    }

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
