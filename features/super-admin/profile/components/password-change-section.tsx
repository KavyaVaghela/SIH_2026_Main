"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, Eye, EyeOff, Lock, Check } from "lucide-react";

interface PasswordChangeSectionProps {
  newPassword: string;
  confirmPassword: string;
  onNewPasswordChange: (val: string) => void;
  onConfirmPasswordChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isUpdating?: boolean;
}

export function PasswordChangeSection({
  newPassword,
  confirmPassword,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  isUpdating,
}: PasswordChangeSectionProps) {
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const isValidLength = newPassword.length >= 8;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center space-x-2">
          <KeyRound className="h-4 w-4 text-emerald-700" />
          <CardTitle className="text-sm font-bold text-foreground">
            Security & Authentication Credentials
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Update your administrative master login password. Updates are secured natively by Supabase Auth.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <form onSubmit={onSubmit} className="space-y-4 max-w-lg">
          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center">
              <Lock className="h-3.5 w-3.5 mr-1 text-emerald-700" />
              New Master Password *
            </label>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => onNewPasswordChange(e.target.value)}
                placeholder="Minimum 8 characters"
                className="h-9 text-xs pr-9"
                required
                disabled={isUpdating}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">Toggle visibility</span>
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center">
              <Lock className="h-3.5 w-3.5 mr-1 text-emerald-700" />
              Confirm New Master Password *
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => onConfirmPasswordChange(e.target.value)}
                placeholder="Re-enter new password"
                className="h-9 text-xs pr-9"
                required
                disabled={isUpdating}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">Toggle visibility</span>
              </button>
            </div>
          </div>

          {/* Requirements Checklist */}
          <div className="space-y-1 text-[11px] text-muted-foreground pt-1">
            <div className={`flex items-center space-x-1.5 ${isValidLength ? "text-emerald-700 font-semibold" : ""}`}>
              <Check className={`h-3 w-3 ${isValidLength ? "opacity-100" : "opacity-40"}`} />
              <span>Contains at least 8 characters</span>
            </div>
            <div className={`flex items-center space-x-1.5 ${isMatch ? "text-emerald-700 font-semibold" : ""}`}>
              <Check className={`h-3 w-3 ${isMatch ? "opacity-100" : "opacity-40"}`} />
              <span>Passwords match precisely</span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              size="sm"
              disabled={isUpdating || !isValidLength || !isMatch}
              className="bg-emerald-800 text-white hover:bg-emerald-900 text-xs font-semibold"
            >
              <KeyRound className="h-3.5 w-3.5 mr-1.5" />
              {isUpdating ? "Updating Security Credentials..." : "Update Master Password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
