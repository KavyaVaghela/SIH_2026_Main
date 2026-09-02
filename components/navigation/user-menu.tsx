"use client";

import * as React from "react";
import { User, Settings, LogOut, Shield } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Dropdown, type DropdownItem } from "@/components/ui/dropdown";

export interface UserMenuProps {
  userName?: string;
  userRole?: string;
  avatarUrl?: string;
  onNavigateProfile?: () => void;
  onNavigateSettings?: () => void;
  onLogout?: () => void;
}

export function UserMenu({
  userName = "Cooperative User",
  userRole = "Member",
  avatarUrl,
  onNavigateProfile,
  onNavigateSettings,
  onLogout,
}: UserMenuProps) {
  const items: DropdownItem[] = [
    {
      label: (
        <div className="flex flex-col text-left py-0.5">
          <span className="font-semibold text-xs">{userName}</span>
          <span className="text-[10px] text-muted-foreground capitalize">{userRole}</span>
        </div>
      ),
      disabled: true,
    },
    {
      label: "My Profile",
      icon: <User className="h-4 w-4" />,
      onClick: onNavigateProfile,
    },
    {
      label: "Account Settings",
      icon: <Settings className="h-4 w-4" />,
      onClick: onNavigateSettings,
    },
    {
      label: "Cooperative Verification",
      icon: <Shield className="h-4 w-4 text-emerald-600" />,
    },
    {
      label: "Sign Out",
      icon: <LogOut className="h-4 w-4" />,
      destructive: true,
      onClick: onLogout,
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
