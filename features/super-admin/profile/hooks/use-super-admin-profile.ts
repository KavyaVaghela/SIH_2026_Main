"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { profileService } from "../services/profile-service";
import type { SuperAdminProfile, ProfileUpdatePayload } from "../types";

export function useSuperAdminProfile() {
  const router = useRouter();

  const [profile, setProfile] = React.useState<SuperAdminProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [isEditing, setIsEditing] = React.useState<boolean>(false);

  // Profile Edit State
  const [editName, setEditName] = React.useState<string>("");
  const [editPhone, setEditPhone] = React.useState<string>("");

  // Password Update State
  const [newPassword, setNewPassword] = React.useState<string>("");
  const [confirmPassword, setConfirmPassword] = React.useState<string>("");
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState<boolean>(false);

  // Feedback Messages
  const [successFeedback, setSuccessFeedback] = React.useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = React.useState<string | null>(null);

  const fetchProfile = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await profileService.getProfile();
      setProfile(data);
      setEditName(data.fullName);
      setEditPhone(data.phone);
    } catch {
      setErrorFeedback("Failed to load profile details.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const showSuccess = (msg: string) => {
    setSuccessFeedback(msg);
    setErrorFeedback(null);
    setTimeout(() => setSuccessFeedback(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorFeedback(msg);
    setSuccessFeedback(null);
    setTimeout(() => setErrorFeedback(null), 5000);
  };

  const startEditing = () => {
    if (profile) {
      setEditName(profile.fullName);
      setEditPhone(profile.phone);
    }
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (profile) {
      setEditName(profile.fullName);
      setEditPhone(profile.phone);
    }
    setIsEditing(false);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showError("Name cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await profileService.updateProfile({
        fullName: editName.trim(),
        phone: editPhone.trim(),
      });
      setProfile(updated);
      setIsEditing(false);
      showSuccess("Administrator profile updated successfully.");
    } catch {
      showError("Failed to save profile changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("New password and confirm password do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await profileService.updatePassword(newPassword);
      if (res.success) {
        showSuccess("Password updated successfully. Please use your new password next time you sign in.");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showError(res.error || "Failed to update password.");
      }
    } catch {
      showError("Failed to process password update.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const logout = async () => {
    await profileService.signOut();
    router.push("/login");
  };

  return {
    profile,
    isLoading,
    isSaving,
    isEditing,
    editName,
    editPhone,
    setEditName,
    setEditPhone,
    newPassword,
    confirmPassword,
    setNewPassword,
    setConfirmPassword,
    isUpdatingPassword,
    successFeedback,
    errorFeedback,
    startEditing,
    cancelEditing,
    saveProfile,
    changePassword,
    logout,
  };
}
