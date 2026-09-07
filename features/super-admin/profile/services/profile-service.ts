import { createClient } from "@/lib/supabase/client";
import { MOCK_SUPER_ADMIN_PROFILE } from "../data/mock-profile";
import type { SuperAdminProfile, ProfileUpdatePayload } from "../types";

let inMemoryProfile: SuperAdminProfile = { ...MOCK_SUPER_ADMIN_PROFILE };

export class ProfileService {
  async getProfile(): Promise<SuperAdminProfile> {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: dbProfile } = await (supabase.from("profiles") as any)
          .select("*")
          .eq("id", user.id)
          .single();

        if (dbProfile) {
          inMemoryProfile = {
            id: dbProfile.id,
            fullName: dbProfile.full_name || inMemoryProfile.fullName,
            email: user.email || dbProfile.email || inMemoryProfile.email,
            phone: dbProfile.phone || inMemoryProfile.phone,
            role: "SUPER_ADMIN",
            organization: inMemoryProfile.organization,
            authorityTier: inMemoryProfile.authorityTier,
            jurisdiction: inMemoryProfile.jurisdiction,
            avatarUrl: dbProfile.avatar_url || null,
            createdAt: new Date(dbProfile.created_at || user.created_at).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            lastLoginAt: user.last_sign_in_at
              ? new Date(user.last_sign_in_at).toLocaleDateString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "numeric",
                  month: "short",
                })
              : inMemoryProfile.lastLoginAt,
          };
        }
      }
    } catch {
      // Fallback to in-memory profile
    }

    return inMemoryProfile;
  }

  async updateProfile(payload: ProfileUpdatePayload): Promise<SuperAdminProfile> {
    inMemoryProfile = {
      ...inMemoryProfile,
      fullName: payload.fullName,
      phone: payload.phone,
    };

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await (supabase.from("profiles") as any)
          .update({
            full_name: payload.fullName,
            phone: payload.phone,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      }
    } catch {
      // Offline fallback
    }

    return inMemoryProfile;
  }

  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Failed to update password. Please try again.",
      };
    }
  }

  async signOut(): Promise<{ success: boolean }> {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      return { success: true };
    } catch {
      return { success: false };
    }
  }
}

export const profileService = new ProfileService();
