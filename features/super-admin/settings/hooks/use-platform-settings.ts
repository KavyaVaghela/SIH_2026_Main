"use client";

import * as React from "react";
import { settingsService } from "../services/settings-service";
import type {
  PlatformSettings,
  NotificationPreferences,
} from "../types";

const INITIAL_SETTINGS: PlatformSettings = {
  services: [],
  notificationPreferences: {
    complaintAlertsEnabled: true,
    workerShortageAlertsEnabled: true,
    welfareAlertsEnabled: true,
    registrationAlertsEnabled: true,
  },
};

export function usePlatformSettings() {
  const [settings, setSettings] = React.useState<PlatformSettings>(INITIAL_SETTINGS);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const fetchSettings = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (err: any) {
      setErrorMessage(
        err.message || "Unable to load trade services catalog from database. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const showSuccessFeedback = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleToggleService = async (serviceId: string, isActive: boolean) => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await settingsService.toggleService(serviceId, isActive);
      setSettings((prev) => ({
        ...prev,
        services: prev.services.map((s) => (s.id === serviceId ? { ...s, isActive } : s)),
      }));
      showSuccessFeedback(
        isActive
          ? "Trade service enabled successfully in master catalog."
          : "Trade service paused from customer booking catalog."
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to toggle service availability.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleNotification = (key: keyof NotificationPreferences, value: boolean) => {
    try {
      const updatedPrefs = settingsService.updateNotificationPreference(key, value);
      setSettings((prev) => ({
        ...prev,
        notificationPreferences: updatedPrefs,
      }));
      showSuccessFeedback("Notification alert preference updated.");
    } catch {
      setErrorMessage("Failed to save notification preference.");
    }
  };

  return {
    settings,
    isLoading,
    isSaving,
    successMessage,
    errorMessage,
    retryFetch: fetchSettings,
    handleToggleService,
    handleToggleNotification,
  };
}
