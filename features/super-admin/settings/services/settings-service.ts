import { createClient } from "@/lib/supabase/client";
import { INITIAL_PLATFORM_SETTINGS } from "../data/mock-settings";
import type { PlatformSettings, ManagedServiceItem, NotificationPreferences } from "../types";

const SETTINGS_STORAGE_KEY = "kaushalyasetu_super_admin_settings_v1";

let inMemorySettings: PlatformSettings = { ...INITIAL_PLATFORM_SETTINGS };

export class SettingsService {
  private getStoredSettings(): PlatformSettings {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {
        // Fallback to in-memory
      }
    }
    return inMemorySettings;
  }

  private saveSettings(settings: PlatformSettings) {
    inMemorySettings = { ...settings };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      } catch {
        // Storage write failed
      }
    }
  }

  async getSettings(): Promise<PlatformSettings> {
    const current = this.getStoredSettings();

    // Attempt to enrich services list with real Supabase 'services' data
    try {
      const supabase = createClient();
      const { data } = await (supabase.from("services") as any)
        .select(`
          id,
          title,
          description,
          base_price,
          is_active,
          service_categories (name)
        `)
        .limit(20);

      if (data && data.length > 0) {
        const dbServices: ManagedServiceItem[] = data.map((s: any) => ({
          id: s.id,
          title: s.title,
          category: s.service_categories?.name || "General Trades",
          basePrice: Number(s.base_price) || 300,
          isActive: Boolean(s.is_active),
          description: s.description || undefined,
        }));

        if (dbServices.length >= 3) {
          const updated = {
            ...current,
            services: dbServices,
          };
          this.saveSettings(updated);
          return updated;
        }
      }
    } catch {
      // Fallback
    }

    return current;
  }

  async updatePlatformControl(
    key: "societyRegistrationEnabled" | "emergencyBookingEnabled",
    value: boolean
  ): Promise<PlatformSettings> {
    const current = this.getStoredSettings();
    const updated: PlatformSettings = {
      ...current,
      [key]: value,
    };
    this.saveSettings(updated);
    return updated;
  }

  async toggleService(serviceId: string, isActive: boolean): Promise<PlatformSettings> {
    const current = this.getStoredSettings();
    const updatedServices = current.services.map((srv) =>
      srv.id === serviceId ? { ...srv, isActive } : srv
    );

    const updated: PlatformSettings = {
      ...current,
      services: updatedServices,
    };
    this.saveSettings(updated);

    // Attempt to persist to real database table 'services'
    try {
      const supabase = createClient();
      await (supabase.from("services") as any)
        .update({ is_active: isActive })
        .eq("id", serviceId);
    } catch {
      // Offline fallback
    }

    return updated;
  }

  async updateNotificationPreference(
    key: keyof NotificationPreferences,
    value: boolean
  ): Promise<PlatformSettings> {
    const current = this.getStoredSettings();
    const updated: PlatformSettings = {
      ...current,
      notificationPreferences: {
        ...current.notificationPreferences,
        [key]: value,
      },
    };
    this.saveSettings(updated);
    return updated;
  }

  async resetToDefaults(): Promise<PlatformSettings> {
    const defaults = { ...INITIAL_PLATFORM_SETTINGS };
    this.saveSettings(defaults);
    return defaults;
  }
}

export const settingsService = new SettingsService();
