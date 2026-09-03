"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Save,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const LOCAL_STORAGE_USER_KEY = "kaushalyasetu_customer_profile_info";

export function AccountSettingsView() {
  const router = useRouter();

  // Account Info Form State
  const [fullName, setFullName] = React.useState("Ravi Patel");
  const [email, setEmail] = React.useState("ravi.patel@example.com");
  const [phone, setPhone] = React.useState("+91 98250 11021");
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = React.useState<string | null>(null);

  // Password Security Form State
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [updatingPassword, setUpdatingPassword] = React.useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = React.useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fullName) setFullName(parsed.fullName);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.phone) setPhone(parsed.phone);
      }
    } catch {
      // Fallback defaults
    }
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccessMsg(null);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          LOCAL_STORAGE_USER_KEY,
          JSON.stringify({ fullName, email, phone })
        );
      }
      setProfileSuccessMsg("Changes saved successfully.");
    } catch (err) {
      console.error("Failed to save profile settings", err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg(null);
    setPasswordSuccessMsg(null);

    if (newPassword.length < 6) {
      setPasswordErrorMsg("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg("New password and confirm password do not match.");
      return;
    }

    setUpdatingPassword(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setPasswordErrorMsg(error.message);
      } else {
        setPasswordSuccessMsg("Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update password.";
      setPasswordErrorMsg(msg);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error", err);
    } finally {
      router.push("/login");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Account Settings"
        description="Manage personal details, security credentials, and authentication preferences."
        breadcrumbs={[
          { label: "Customer Portal", href: "/customer" },
          { label: "Account Settings" },
        ]}
      />

      {/* Section 1: Account Information */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <User className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">
            1. Personal Account Information
          </h3>
        </div>

        {profileSuccessMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 p-3 rounded-lg border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{profileSuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Mobile Number</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="submit"
              disabled={savingProfile}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2 shadow-sm gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {savingProfile ? "Saving..." : "Save Account Changes"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Section 2: Password & Security */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Lock className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">
            2. Password & Security
          </h3>
        </div>

        {passwordSuccessMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 p-3 rounded-lg border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{passwordSuccessMsg}</span>
          </div>
        )}

        {passwordErrorMsg && (
          <div className="bg-rose-50 dark:bg-rose-950/60 p-3 rounded-lg border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{passwordErrorMsg}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Current Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="submit"
              disabled={updatingPassword}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2 shadow-sm gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              {updatingPassword ? "Updating Password..." : "Update Password"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Section 3: Account Actions */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <LogOut className="w-4 h-4 text-rose-600" />
          <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">
            3. Account Actions
          </h3>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100">Sign Out of Customer Session</p>
            <p className="text-slate-500">Securely sign out of KaushalyaSetu platform on this device.</p>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleSignOut}
            className="text-xs font-bold px-4 py-2 gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
}
