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
  services: ManagedServiceItem[];
  notificationPreferences: NotificationPreferences;
}
