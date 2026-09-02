import * as React from "react";
import {
  ShieldAlert,
  Building,
  FileCheck,
  Settings,
  Users,
  Briefcase,
  Calendar,
  Wallet,
  Clock,
  Search,
  HelpCircle,
  BarChart2,
} from "lucide-react";
import type { NavItem } from "@/components/navigation/desktop-sidebar";
import type { MobileNavItem } from "@/components/navigation/mobile-navigation";

export type PlatformRole = "SUPER_ADMIN" | "FEDERATION_ADMIN" | "WORKER" | "CUSTOMER";

export interface RoleNavigationConfig {
  role: PlatformRole;
  displayName: string;
  navItems: NavItem[];
  mobileNavItems: MobileNavItem[];
}

export const ROLE_NAVIGATION_CONFIGS: Record<PlatformRole, RoleNavigationConfig> = {
  SUPER_ADMIN: {
    role: "SUPER_ADMIN",
    displayName: "Super Administrator",
    navItems: [
      { title: "System Control", href: "/super-admin", icon: React.createElement(ShieldAlert) },
      { title: "Cooperatives", href: "/super-admin/cooperatives", icon: React.createElement(Building) },
      { title: "Global Audit", href: "/super-admin/audit", icon: React.createElement(FileCheck) },
      { title: "Platform Settings", href: "/super-admin/settings", icon: React.createElement(Settings) },
    ],
    mobileNavItems: [
      { title: "Overview", href: "/super-admin", icon: React.createElement(ShieldAlert) },
      { title: "Co-ops", href: "/super-admin/cooperatives", icon: React.createElement(Building) },
      { title: "Audit", href: "/super-admin/audit", icon: React.createElement(FileCheck) },
      { title: "Settings", href: "/super-admin/settings", icon: React.createElement(Settings) },
    ],
  },
  FEDERATION_ADMIN: {
    role: "FEDERATION_ADMIN",
    displayName: "Federation Admin",
    navItems: [
      { title: "Federation Hub", href: "/federation-admin", icon: React.createElement(Building) },
      { title: "Members", href: "/federation-admin/members", icon: React.createElement(Users) },
      { title: "Service Catalog", href: "/federation-admin/services", icon: React.createElement(Briefcase) },
      { title: "Welfare & Escrow", href: "/federation-admin/welfare", icon: React.createElement(Wallet) },
      { title: "Analytics", href: "/federation-admin/analytics", icon: React.createElement(BarChart2) },
    ],
    mobileNavItems: [
      { title: "Hub", href: "/federation-admin", icon: React.createElement(Building) },
      { title: "Members", href: "/federation-admin/members", icon: React.createElement(Users) },
      { title: "Services", href: "/federation-admin/services", icon: React.createElement(Briefcase) },
      { title: "Welfare", href: "/federation-admin/welfare", icon: React.createElement(Wallet) },
    ],
  },
  WORKER: {
    role: "WORKER",
    displayName: "Cooperative Worker",
    navItems: [
      { title: "My Gig Dashboard", href: "/worker", icon: React.createElement(Briefcase) },
      { title: "Schedule & Jobs", href: "/worker/schedule", icon: React.createElement(Calendar) },
      { title: "Earnings & Payouts", href: "/worker/earnings", icon: React.createElement(Wallet) },
      { title: "Member Welfare", href: "/worker/welfare", icon: React.createElement(Clock) },
    ],
    mobileNavItems: [
      { title: "Gigs", href: "/worker", icon: React.createElement(Briefcase) },
      { title: "Schedule", href: "/worker/schedule", icon: React.createElement(Calendar) },
      { title: "Earnings", href: "/worker/earnings", icon: React.createElement(Wallet) },
      { title: "Welfare", href: "/worker/welfare", icon: React.createElement(Clock) },
    ],
  },
  CUSTOMER: {
    role: "CUSTOMER",
    displayName: "Household Customer",
    navItems: [
      { title: "Find Services", href: "/customer", icon: React.createElement(Search) },
      { title: "Active Bookings", href: "/customer/bookings", icon: React.createElement(Calendar) },
      { title: "Booking History", href: "/customer/history", icon: React.createElement(Clock) },
      { title: "Support & Help", href: "/customer/support", icon: React.createElement(HelpCircle) },
    ],
    mobileNavItems: [
      { title: "Browse", href: "/customer", icon: React.createElement(Search) },
      { title: "Bookings", href: "/customer/bookings", icon: React.createElement(Calendar) },
      { title: "History", href: "/customer/history", icon: React.createElement(Clock) },
      { title: "Support", href: "/customer/support", icon: React.createElement(HelpCircle) },
    ],
  },
};
