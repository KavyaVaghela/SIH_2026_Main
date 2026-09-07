export interface ManagedServiceItem {
  id: string;
  title: string;
  category: string;
  basePrice: number;
  isActive: boolean;
  description?: string;
}

export interface NotificationPreferences {
  complaintAlertsEnabled: boolean;
  workerShortageAlertsEnabled: boolean;
  welfareAlertsEnabled: boolean;
  registrationAlertsEnabled: boolean;
}

export interface PlatformSettings {
  societyRegistrationEnabled: boolean;
  emergencyBookingEnabled: boolean;
  services: ManagedServiceItem[];
  notificationPreferences: NotificationPreferences;
}

export interface PendingConfirmation {
  type: "DISABLE_REGISTRATIONS" | "DISABLE_EMERGENCY";
  title: string;
  description: string;
  consequenceText: string;
}
