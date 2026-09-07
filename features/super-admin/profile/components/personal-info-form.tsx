"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Phone, Mail, Edit3, X, Save, Lock } from "lucide-react";
import type { SuperAdminProfile } from "../types";

interface PersonalInfoFormProps {
  profile: SuperAdminProfile;
  isEditing: boolean;
  editName: string;
  editPhone: string;
  onEditNameChange: (val: string) => void;
  onEditPhoneChange: (val: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (e: React.FormEvent) => void;
  isSaving?: boolean;
}

export function PersonalInfoForm({
  profile,
  isEditing,
  editName,
  editPhone,
  onEditNameChange,
  onEditPhoneChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  isSaving,
}: PersonalInfoFormProps) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-emerald-700" />
            <CardTitle className="text-sm font-bold text-foreground">
              Personal & Contact Information
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Verified contact identity used for administrative communications and system logs.
          </CardDescription>
        </div>

        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onStartEdit}
            className="text-xs font-semibold"
          >
            <Edit3 className="h-3.5 w-3.5 mr-1.5" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancelEdit}
              disabled={isSaving}
              className="text-xs"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={onSave}
              disabled={isSaving || !editName.trim()}
              className="bg-emerald-800 text-white hover:bg-emerald-900 text-xs font-semibold"
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <form onSubmit={onSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center">
                <User className="h-3.5 w-3.5 mr-1 text-emerald-700" />
                Full Name *
              </label>
              {isEditing ? (
                <Input
                  value={editName}
                  onChange={(e) => onEditNameChange(e.target.value)}
                  placeholder="Enter your legal full name"
                  className="h-9 text-xs"
                  required
                />
              ) : (
                <p className="p-2.5 rounded-lg border bg-muted/20 text-xs font-semibold text-foreground">
                  {profile.fullName}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center">
                <Phone className="h-3.5 w-3.5 mr-1 text-emerald-700" />
                Contact Phone
              </label>
              {isEditing ? (
                <Input
                  value={editPhone}
                  onChange={(e) => onEditPhoneChange(e.target.value)}
                  placeholder="+91 98200 XXXXX"
                  className="h-9 text-xs"
                />
              ) : (
                <p className="p-2.5 rounded-lg border bg-muted/20 text-xs font-medium text-foreground">
                  {profile.phone || "Not configured"}
                </p>
              )}
            </div>

            {/* Email (Read-Only) */}
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center">
                  <Mail className="h-3.5 w-3.5 mr-1 text-emerald-700" />
                  Primary Authentication Email
                </label>
                <span className="text-[10px] text-muted-foreground flex items-center">
                  <Lock className="h-3 w-3 mr-1" />
                  Locked for Security
                </span>
              </div>
              <div className="p-2.5 rounded-lg border bg-muted/40 text-xs text-muted-foreground flex items-center justify-between">
                <span className="font-mono font-medium text-foreground">{profile.email}</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                  Verified Identity
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Email address modifications require multi-factor verification with the Apex Identity Authority.
              </p>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
