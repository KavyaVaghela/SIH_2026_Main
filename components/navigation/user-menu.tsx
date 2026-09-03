"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, Settings, LogOut, Shield } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Dropdown, type DropdownItem } from "@/components/ui/dropdown";
import { createClient } from "@/lib/supabase/client";

export interface UserMenuProps {
  userName?: string;
  userRole?: string;
  avatarUrl?: string;
  onNavigateProfile?: () => void;
  onNavigateSettings?: () => void;
  onLogout?: () => void;
}

export function UserMenu({
  userName = "Ravi Patel",
  userRole = "Household Customer",
  avatarUrl,
  onNavigateProfile,
  onNavigateSettings,
  onLogout,
}: UserMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isSuperAdmin = pathname?.startsWith("/super-admin") || userRole?.toLowerCase().includes("super");

  const handleProfileClick = () => {
    if (onNavigateProfile) {
      onNavigateProfile();
    } else if (isSuperAdmin) {
      router.push("/super-admin/profile");
    } else {
      router.push("/customer/profile");
    }
  };

  const handleSettingsClick = () => {
    if (onNavigateSettings) {
      onNavigateSettings();
    } else if (isSuperAdmin) {
      router.push("/super-admin/settings");
    } else {
      router.push("/customer/settings");
    }
  };

  const handleSignOutClick = async () => {
    if (onLogout) {
      onLogout();
    } else {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Sign out error", err);
      } finally {
        router.push("/login");
      }
    }
  };

  const items: DropdownItem[] = [
    {
      label: (
        <div className="flex flex-col text-left py-0.5">
          <span className="font-semibold text-xs text-foreground">{userName}</span>
          <span className="text-[10px] text-muted-foreground capitalize">{userRole}</span>
        </div>
      ),
      disabled: true,
    },
    {
      label: "Profile",
      icon: <User className="h-4 w-4 text-emerald-600" />,
      onClick: handleProfileClick,
    },
    {
      label: "Account Settings",
      icon: <Settings className="h-4 w-4 text-emerald-600" />,
      onClick: handleSettingsClick,
    },
    {
      label: "Cooperative Verification",
      icon: <Shield className="h-4 w-4 text-emerald-600" />,
    },
    {
      label: "Sign Out",
      icon: <LogOut className="h-4 w-4" />,
      destructive: true,
      onClick: handleSignOutClick,
    },
  ];

  return (
    <Dropdown
      trigger={
        <button className="flex items-center space-x-2 rounded-full p-1 transition-colors hover:bg-accent focus:outline-none">
          <Avatar src={avatarUrl} fallback={userName} size="sm" />
          <div className="hidden md:block text-left text-xs">
            <p className="font-semibold text-foreground leading-tight">{userName}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{userRole}</p>
          </div>
        </button>
      }
      items={items}
      align="right"
    />
  );
}
