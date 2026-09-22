export interface ManagedServiceItem {
  id: string;
  title: string;
  category: string;
  basePrice: number;
  minimumVisitCharge: number;
  priceUnit?: string;
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
