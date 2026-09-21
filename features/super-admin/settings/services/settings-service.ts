import type { PlatformSettings, ManagedServiceItem, NotificationPreferences } from "../types";

const NOTIFICATION_STORAGE_KEY = "kaushalyasetu_super_admin_notification_prefs";

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  complaintAlertsEnabled: true,
  workerShortageAlertsEnabled: true,
  welfareAlertsEnabled: true,
  registrationAlertsEnabled: true,
};

export class SettingsService {
  private getStoredNotificationPreferences(): NotificationPreferences {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
        if (stored) {
          return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(stored) };
        }
      } catch {
        // Fallback to defaults
      }
    }
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  private saveNotificationPreferences(prefs: NotificationPreferences) {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(prefs));
      } catch {
        // Storage write failed
      }
    }
  }

  async getSettings(): Promise<PlatformSettings> {
    const notificationPreferences = this.getStoredNotificationPreferences();

    // Fetch real services directly from database via secure API route
    const res = await fetch("/api/super-admin/settings", {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Unable to load trade services catalog from database. Please try again.");
    }

    const data = await res.json();
    const services: ManagedServiceItem[] = data.services || [];

    return {
      services,
      notificationPreferences,
    };
  }

  async toggleService(serviceId: string, isActive: boolean): Promise<void> {
    const res = await fetch("/api/super-admin/settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ serviceId, isActive }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to update service availability in database.");
    }
  }

  updateNotificationPreference(
    key: keyof NotificationPreferences,
    value: boolean
  ): NotificationPreferences {
    const current = this.getStoredNotificationPreferences();
    const updated: NotificationPreferences = {
      ...current,
      [key]: value,
    };
    this.saveNotificationPreferences(updated);
    return updated;
  }
}

export const settingsService = new SettingsService();

