export interface SuperAdminProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "SUPER_ADMIN";
  organization: string;
  authorityTier: string;
  jurisdiction: string;
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt?: string;
}

export interface ProfileUpdatePayload {
  fullName: string;
  phone: string;
}

export interface PasswordChangePayload {
  newPassword: string;
  confirmPassword: string;
}
