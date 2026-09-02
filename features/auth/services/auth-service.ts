import { getCurrentUser, getCurrentProfile, getCurrentRole } from "@/lib/auth/auth";
import { signInWithEmail, signUpCustomer, signUpWorker, signUpFederationAdmin, signOut } from "@/lib/auth/actions";
import type { Profile, PlatformRole } from "@/types";

export interface IAuthService {
  getUser(): Promise<unknown>;
  getProfile(): Promise<Profile | null>;
  getRole(): Promise<PlatformRole | null>;
  login(email: string, pass: string): Promise<{ success: boolean; redirectUrl?: string; error?: string }>;
  registerCustomer(email: string, pass: string, name: string, phone?: string): Promise<{ success: boolean; error?: string }>;
  registerWorker(email: string, pass: string, name: string, phone: string, fedId: string): Promise<{ success: boolean; error?: string }>;
  registerFederationAdmin(email: string, pass: string, name: string, code: string): Promise<{ success: boolean; error?: string }>;
  logout(): Promise<{ success: boolean; redirectUrl?: string }>;
}

export class AuthService implements IAuthService {
  async getUser() {
    return getCurrentUser();
  }

  async getProfile(): Promise<Profile | null> {
    const profile = await getCurrentProfile();
    if (!profile) return null;
    return {
      id: profile.id,
      role: profile.role,
      fullName: profile.full_name,
      phone: profile.phone,
      email: profile.email,
      avatarUrl: profile.avatar_url,
      isActive: profile.is_active,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  }

  async getRole(): Promise<PlatformRole | null> {
    return getCurrentRole();
  }

  async login(email: string, pass: string) {
    return signInWithEmail(email, pass);
  }

  async registerCustomer(email: string, pass: string, name: string, phone?: string) {
    return signUpCustomer(email, pass, name, phone);
  }

  async registerWorker(email: string, pass: string, name: string, phone: string, fedId: string) {
    return signUpWorker(email, pass, name, phone, fedId);
  }

  async registerFederationAdmin(email: string, pass: string, name: string, code: string) {
    return signUpFederationAdmin(email, pass, name, code);
  }

  async logout() {
    return signOut();
  }
}

export const authService = new AuthService();
