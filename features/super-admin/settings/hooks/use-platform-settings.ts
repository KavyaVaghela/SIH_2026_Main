"use client";

import * as React from "react";
import { settingsService } from "../services/settings-service";
import { INITIAL_PLATFORM_SETTINGS } from "../data/mock-settings";
import type {
  PlatformSettings,
  NotificationPreferences,
  PendingConfirmation,
} from "../types";

export function usePlatformSettings() {
  const [settings, setSettings] = React.useState<PlatformSettings>(INITIAL_PLATFORM_SETTINGS);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Safety confirmation modal state for broad impact changes
  const [pendingConfirmation, setPendingConfirmation] =
    React.useState<PendingConfirmation | null>(null);

  const fetchSettings = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch {
      setErrorMessage("Failed to load platform settings.");
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

  const handleToggleRegistrations = (checked: boolean) => {
    if (!checked) {
      // Disabling registrations has high platform impact: trigger safety modal
      setPendingConfirmation({
        type: "DISABLE_REGISTRATIONS",
        title: "Disable New Cooperative Registrations?",
        description:
          "Halting registration will prevent prospective artisan cooperatives and federation administrators from submitting onboarding applications.",
        consequenceText:
          "Active cooperatives will not be affected, but no new federations can register until re-enabled.",
      });
      return;
    }

    // Enabling directly
    executeToggleRegistrations(true);
  };

  const handleToggleEmergency = (checked: boolean) => {
    if (!checked) {
      // Disabling emergency bookings has high customer impact: trigger safety modal
      setPendingConfirmation({
        type: "DISABLE_EMERGENCY",
        title: "Pause Emergency Service Bookings?",
        description:
          "Urgent rapid-dispatch (<60 mins) booking requests from customers will be disabled across all trade categories.",
        consequenceText:
          "Existing in-progress emergency bookings will continue, but new emergency gig requests will display a platform pause notice.",
      });
      return;
    }

    // Enabling directly
    executeToggleEmergency(true);
  };

  const executeToggleRegistrations = async (enabled: boolean) => {
    setIsSaving(true);
    try {
      const updated = await settingsService.updatePlatformControl(
        "societyRegistrationEnabled",
        enabled
      );
      setSettings(updated);
      showSuccessFeedback(
        enabled
          ? "New cooperative society registrations have been enabled."
          : "New cooperative society registrations are now paused."
      );
    } catch {
      setErrorMessage("Failed to update society registration status.");
    } finally {
      setIsSaving(false);
      setPendingConfirmation(null);
    }
  };

  const executeToggleEmergency = async (enabled: boolean) => {
    setIsSaving(true);
    try {
      const updated = await settingsService.updatePlatformControl(
        "emergencyBookingEnabled",
        enabled
      );
      setSettings(updated);
      showSuccessFeedback(
        enabled
          ? "Emergency service bookings have been activated platform-wide."
          : "Emergency service bookings are now paused."
      );
    } catch {
      setErrorMessage("Failed to update emergency booking status.");
    } finally {
      setIsSaving(false);
      setPendingConfirmation(null);
    }
  };

  const confirmPendingAction = () => {
    if (!pendingConfirmation) return;
    if (pendingConfirmation.type === "DISABLE_REGISTRATIONS") {
      executeToggleRegistrations(false);
    } else if (pendingConfirmation.type === "DISABLE_EMERGENCY") {
      executeToggleEmergency(false);
    }
  };

  const cancelPendingAction = () => {
    setPendingConfirmation(null);
  };

  const handleToggleService = async (serviceId: string, isActive: boolean) => {
    setIsSaving(true);
    try {
      const updated = await settingsService.toggleService(serviceId, isActive);
      setSettings(updated);
      showSuccessFeedback(
        isActive ? "Trade service enabled successfully." : "Trade service paused from customer catalog."
      );
    } catch {
      setErrorMessage("Failed to toggle service availability.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleNotification = async (key: keyof NotificationPreferences, value: boolean) => {
    setIsSaving(true);
    try {
      const updated = await settingsService.updateNotificationPreference(key, value);
      setSettings(updated);
      showSuccessFeedback("Notification alert preferences updated.");
    } catch {
      setErrorMessage("Failed to save notification preference.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    settings,
    isLoading,
    isSaving,
    successMessage,
    errorMessage,
    pendingConfirmation,
    handleToggleRegistrations,
    handleToggleEmergency,
    confirmPendingAction,
    cancelPendingAction,
    handleToggleService,
    handleToggleNotification,
  };
}
