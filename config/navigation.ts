import * as React from "react";
import {
  ShieldAlert,
  Building,
  Building2,
  FileCheck,
  Settings,
  Users,
  Briefcase,
  Calendar,
  Wallet,
  Clock,
  Home,
  UserCheck,
  CreditCard,
  User,
  BarChart2,
  Award,
  BarChart3,
  LayoutDashboard,
  TrendingUp,
  HeartHandshake,
  AlertTriangle,
  Bell,
  HelpCircle,
  GraduationCap,
  Sparkles,
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
      { title: "Overview", href: "/super-admin", icon: React.createElement(LayoutDashboard) },
      { title: "Cooperative Societies", href: "/super-admin/societies", icon: React.createElement(Building2) },
      { title: "Workforce", href: "/super-admin/workforce", icon: React.createElement(Users) },
      { title: "KaushalGrow", href: "/super-admin/learning", icon: React.createElement(GraduationCap) },
      { title: "Bookings", href: "/super-admin/bookings", icon: React.createElement(Calendar) },
      { title: "Demand Intelligence", href: "/super-admin/demand", icon: React.createElement(TrendingUp) },
      { title: "Analytics", href: "/super-admin/analytics", icon: React.createElement(BarChart3) },
      { title: "Worker Welfare", href: "/super-admin/welfare", icon: React.createElement(HeartHandshake) },
      { title: "Complaints", href: "/super-admin/complaints", icon: React.createElement(AlertTriangle) },
      { title: "Help & Guidance", href: "/super-admin/guidance", icon: React.createElement(HelpCircle) },
      { title: "Notifications", href: "/super-admin/notifications", icon: React.createElement(Bell) },
      { title: "Settings", href: "/super-admin/settings", icon: React.createElement(Settings) },
      { title: "Profile", href: "/super-admin/profile", icon: React.createElement(User) },
    ],
    mobileNavItems: [
      { title: "Overview", href: "/super-admin", icon: React.createElement(LayoutDashboard) },
      { title: "Societies", href: "/super-admin/societies", icon: React.createElement(Building2) },
      { title: "Workforce", href: "/super-admin/workforce", icon: React.createElement(Users) },
      { title: "KaushalGrow", href: "/super-admin/learning", icon: React.createElement(GraduationCap) },
      { title: "Bookings", href: "/super-admin/bookings", icon: React.createElement(Calendar) },
      { title: "Guidance", href: "/super-admin/guidance", icon: React.createElement(HelpCircle) },
      { title: "Settings", href: "/super-admin/settings", icon: React.createElement(Settings) },
    ],
  },
  FEDERATION_ADMIN: {
    role: "FEDERATION_ADMIN",
    displayName: "Federation Admin",
    navItems: [
      { title: "Federation Hub", href: "/federation-admin", icon: React.createElement(Building) },
      { title: "Federation Information", href: "/federation-admin/federation-information", icon: React.createElement(Building2) },
      { title: "Worker Information", href: "/federation-admin/worker-information", icon: React.createElement(Users) },
      { title: "Workforce Management", href: "/federation-admin/workforce-management", icon: React.createElement(Briefcase) },
      { title: "Welfare & Development", href: "/federation-admin/welfare", icon: React.createElement(HeartHandshake) },
      { title: "Complaint Management", href: "/federation-admin/complaint-management", icon: React.createElement(AlertTriangle) },
      { title: "Help & Guidance", href: "/federation-admin/guidance", icon: React.createElement(HelpCircle) },
    ],
    mobileNavItems: [
      { title: "Hub", href: "/federation-admin", icon: React.createElement(Building) },
      { title: "Federation Info", href: "/federation-admin/federation-information", icon: React.createElement(Building2) },
      { title: "Worker Info", href: "/federation-admin/worker-information", icon: React.createElement(Users) },
      { title: "Workforce", href: "/federation-admin/workforce-management", icon: React.createElement(Briefcase) },
      { title: "Welfare", href: "/federation-admin/welfare", icon: React.createElement(HeartHandshake) },
      { title: "Complaints", href: "/federation-admin/complaint-management", icon: React.createElement(AlertTriangle) },
      { title: "Guidance", href: "/federation-admin/guidance", icon: React.createElement(HelpCircle) },
    ],
  },
  WORKER: {
    role: "WORKER",
    displayName: "Cooperative Worker",
    navItems: [
      { title: "Home / Overview", href: "/worker", icon: React.createElement(Home) },
      { title: "My Profile", href: "/worker/profile", icon: React.createElement(User) },
      { title: "My Schedule & Jobs", href: "/worker/schedule", icon: React.createElement(Calendar) },
      { title: "Earnings", href: "/worker/earnings", icon: React.createElement(Wallet) },
      { title: "KaushalGrow", href: "/worker/grow", icon: React.createElement(GraduationCap) },
      { title: "Welfare & Support", href: "/worker/welfare", icon: React.createElement(HeartHandshake) },
      { title: "My Grievances", href: "/worker/grievances", icon: React.createElement(ShieldAlert) },
      { title: "Help & Guidance", href: "/worker/guidance", icon: React.createElement(HelpCircle) },
    ],
    mobileNavItems: [
      { title: "Overview", href: "/worker", icon: React.createElement(Home) },
      { title: "Profile", href: "/worker/profile", icon: React.createElement(User) },
      { title: "Schedule", href: "/worker/schedule", icon: React.createElement(Calendar) },
      { title: "Earnings", href: "/worker/earnings", icon: React.createElement(Wallet) },
      { title: "KaushalGrow", href: "/worker/grow", icon: React.createElement(GraduationCap) },
      { title: "Welfare & Support", href: "/worker/welfare", icon: React.createElement(HeartHandshake) },
      { title: "Grievances", href: "/worker/grievances", icon: React.createElement(ShieldAlert) },
      { title: "Guidance", href: "/worker/guidance", icon: React.createElement(HelpCircle) },
    ],
  },
  CUSTOMER: {
    role: "CUSTOMER",
    displayName: "Household Customer",
    navItems: [
      { title: "Home", href: "/customer", icon: React.createElement(Home) },
      { title: "My Bookings", href: "/customer/bookings", icon: React.createElement(Calendar) },
      { title: "Find a Worker", href: "/customer/find-worker", icon: React.createElement(UserCheck) },
      { title: "Payments & Bills", href: "/customer/payments", icon: React.createElement(CreditCard) },
      { title: "My Complaints", href: "/customer/complaints", icon: React.createElement(ShieldAlert) },
      { title: "Help & Guidance", href: "/customer/guidance", icon: React.createElement(HelpCircle) },
      { title: "SmartServe AI", href: "/customer/smartserve", icon: React.createElement(Sparkles) },
      { title: "Profile", href: "/customer/profile", icon: React.createElement(User) },
    ],
    mobileNavItems: [
      { title: "Home", href: "/customer", icon: React.createElement(Home) },
      { title: "Bookings", href: "/customer/bookings", icon: React.createElement(Calendar) },
      { title: "Find Worker", href: "/customer/find-worker", icon: React.createElement(UserCheck) },
      { title: "Payments", href: "/customer/payments", icon: React.createElement(CreditCard) },
      { title: "Complaints", href: "/customer/complaints", icon: React.createElement(ShieldAlert) },
      { title: "Guidance", href: "/customer/guidance", icon: React.createElement(HelpCircle) },
      { title: "SmartServe AI", href: "/customer/smartserve", icon: React.createElement(Sparkles) },
      { title: "Profile", href: "/customer/profile", icon: React.createElement(User) },
    ],
  },
};
