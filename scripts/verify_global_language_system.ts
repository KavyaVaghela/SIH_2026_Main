/**
 * Verification Script: Global Multi-Language System across all 4 Dashboards
 * Tests:
 * 1. Language selector component in shared TopNavbar
 * 2. Presence in Customer, Worker, Federation Admin, and Super Admin shells
 * 3. Translation dictionaries structure and completeness across EN, GU, HI
 * 4. Safe persistence architecture (account-scoped + fallback + cookie + metadata sync)
 * 5. Role isolation and safety
 */

import * as fs from "fs";
import * as path from "path";

const projectRoot = process.cwd();

let totalPassed = 0;
let totalFailed = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${description}`);
    totalPassed++;
  } else {
    console.error(`  ✗ FAIL: ${description}`);
    totalFailed++;
  }
}

console.log("==================================================");
console.log("VERIFYING GLOBAL MULTI-LANGUAGE SELECTOR SYSTEM");
console.log("==================================================\n");

// SECTION 1: TopNavbar & Language Selector Integration
console.log("--- Section 1: Header & Language Selector Integration ---");
const topNavPath = path.join(projectRoot, "components", "navigation", "top-navbar.tsx");
const topNavContent = fs.readFileSync(topNavPath, "utf-8");
assert(topNavContent.includes("<LanguageSelector"), "TopNavbar mounts <LanguageSelector />");
assert(topNavContent.includes('import { LanguageSelector }'), "TopNavbar imports LanguageSelector");

const langSelectorPath = path.join(projectRoot, "components", "navigation", "language-selector.tsx");
assert(fs.existsSync(langSelectorPath), "LanguageSelector component file exists");
const langSelectorContent = fs.readFileSync(langSelectorPath, "utf-8");
assert(langSelectorContent.includes("SELECT LANGUAGE /"), "LanguageSelector contains required heading 'SELECT LANGUAGE /'");
assert(langSelectorContent.includes("ભાષા પસંદ કરો"), "LanguageSelector contains required heading 'ભાષા પસંદ કરો'");
assert(langSelectorContent.includes("Globe"), "LanguageSelector renders Globe icon");
assert(langSelectorContent.includes("ChevronDown"), "LanguageSelector renders ChevronDown dropdown arrow");
assert(langSelectorContent.includes("Check"), "LanguageSelector renders Check icon for selected language");
assert(langSelectorContent.includes("English") && langSelectorContent.includes("ગુજરાતી") && langSelectorContent.includes("हिन्दी"), "LanguageSelector contains English, Gujarati, and Hindi options");

// SECTION 2: Dashboard Role Shell Coverage
console.log("\n--- Section 2: Coverage across All Four Dashboards ---");
const customerLayoutPath = path.join(projectRoot, "app", "(dashboard)", "customer", "layout.tsx");
const workerLayoutPath = path.join(projectRoot, "app", "(dashboard)", "worker", "layout.tsx");
const superAdminLayoutPath = path.join(projectRoot, "app", "(dashboard)", "super-admin", "layout.tsx");
const federationAdminLayoutPath = path.join(projectRoot, "app", "(dashboard)", "federation-admin", "layout.tsx");
const roleShellPath = path.join(projectRoot, "components", "layout", "role-shell.tsx");
const fedShellPath = path.join(projectRoot, "features", "federation-admin", "components", "federation-admin-shell.tsx");
const appShellPath = path.join(projectRoot, "components", "layout", "app-shell.tsx");

const customerLayout = fs.readFileSync(customerLayoutPath, "utf-8");
const workerLayout = fs.readFileSync(workerLayoutPath, "utf-8");
const superAdminLayout = fs.readFileSync(superAdminLayoutPath, "utf-8");
const federationAdminLayout = fs.readFileSync(federationAdminLayoutPath, "utf-8");
const roleShell = fs.readFileSync(roleShellPath, "utf-8");
const fedShell = fs.readFileSync(fedShellPath, "utf-8");
const appShell = fs.readFileSync(appShellPath, "utf-8");

assert(customerLayout.includes('role="CUSTOMER"'), "Customer dashboard uses RoleShell with role CUSTOMER");
assert(workerLayout.includes('role="WORKER"'), "Worker dashboard uses RoleShell with role WORKER");
assert(superAdminLayout.includes('role="SUPER_ADMIN"'), "Super Admin dashboard uses RoleShell with role SUPER_ADMIN");
assert(roleShell.includes("<AppShell"), "RoleShell mounts shared AppShell");
assert(appShell.includes("<TopNavbar"), "AppShell mounts shared TopNavbar with LanguageSelector for Customer, Worker, Super Admin");
assert(federationAdminLayout.includes("<FederationAdminShell"), "Federation Admin dashboard uses FederationAdminShell");
assert(fedShell.includes("<TopNavbar"), "FederationAdminShell mounts shared TopNavbar with LanguageSelector for Federation Admin");

// SECTION 3: Global Provider & Persistence Architecture
console.log("\n--- Section 3: Global Provider & Persistence Architecture ---");
const rootLayoutPath = path.join(projectRoot, "app", "layout.tsx");
const rootLayoutContent = fs.readFileSync(rootLayoutPath, "utf-8");
assert(rootLayoutContent.includes("<LanguageProvider>"), "RootLayout wraps entire application in LanguageProvider");

const langContextPath = path.join(projectRoot, "lib", "i18n", "language-context.tsx");
assert(fs.existsSync(langContextPath), "lib/i18n/language-context.tsx exists");
const langContextContent = fs.readFileSync(langContextPath, "utf-8");
assert(langContextContent.includes("kaushalyasetu_preferred_lang"), "Supports global client persistence key kaushalyasetu_preferred_lang");
assert(langContextContent.includes("kaushalyasetu_lang_"), "Supports account-scoped persistence key kaushalyasetu_lang_{userId}");
assert(langContextContent.includes("kaushalyasetu_locale"), "Supports SSR/edge cookie kaushalyasetu_locale");
assert(langContextContent.includes("document.documentElement.lang"), "Dynamically updates document.documentElement.lang");
assert(langContextContent.includes("onAuthStateChange"), "Listens to auth state changes to isolate account preferences");
assert(langContextContent.includes("updateUser"), "Syncs preferred_language to Supabase user metadata asynchronously");

const useTranslationPath = path.join(projectRoot, "lib", "i18n", "use-translation.ts");
const useTranslationContent = fs.readFileSync(useTranslationPath, "utf-8");
assert(useTranslationContent.includes("useLanguage"), "useTranslation is globally wired to LanguageContext");

// SECTION 4: Translation Dictionaries & Key Completeness
console.log("\n--- Section 4: Translation Dictionaries (EN, GU, HI) ---");
const enJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "lib", "i18n", "locales", "en.json"), "utf-8"));
const guJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "lib", "i18n", "locales", "gu.json"), "utf-8"));
const hiJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "lib", "i18n", "locales", "hi.json"), "utf-8"));

assert(Boolean(enJson.language?.selectLanguageTitle && enJson.language?.selectLanguageSub), "EN has language header keys");
assert(Boolean(guJson.language?.selectLanguageTitle && guJson.language?.selectLanguageSub), "GU has language header keys");
assert(Boolean(hiJson.language?.selectLanguageTitle && hiJson.language?.selectLanguageSub), "HI has language header keys");

const requiredNavKeys = ["home", "profile", "settings", "logout", "guidance", "notifications", "platformNavigation"];
for (const k of requiredNavKeys) {
  assert(Boolean(enJson.nav?.[k] && guJson.nav?.[k] && hiJson.nav?.[k]), `All 3 locales contain nav.${k}`);
}

const requiredNotifKeys = ["customer", "worker", "federation", "superAdmin", "markAllRead", "noNotifications"];
for (const k of requiredNotifKeys) {
  assert(Boolean(enJson.notifications?.[k] && guJson.notifications?.[k] && hiJson.notifications?.[k]), `All 3 locales contain notifications.${k}`);
}

// SECTION 5: Shared Navigation & Header Translation Wiring
console.log("\n--- Section 5: Shared Header & Navigation Localization Wiring ---");
const userMenuPath = path.join(projectRoot, "components", "navigation", "user-menu.tsx");
const userMenuContent = fs.readFileSync(userMenuPath, "utf-8");
assert(userMenuContent.includes("useTranslation"), "UserMenu uses useTranslation hook");
assert(userMenuContent.includes('t("nav.profile"'), "UserMenu translates Profile");
assert(userMenuContent.includes('t("nav.helpGuidance"'), "UserMenu translates Help & Guidance");
assert(userMenuContent.includes('t("nav.accountSettings"'), "UserMenu translates Account Settings");
assert(userMenuContent.includes('t("common.logout"'), "UserMenu translates Sign Out");

const notifCenterPath = path.join(projectRoot, "components", "navigation", "notification-center.tsx");
const notifCenterContent = fs.readFileSync(notifCenterPath, "utf-8");
assert(notifCenterContent.includes("useTranslation"), "NotificationCenter uses useTranslation hook");
assert(notifCenterContent.includes('t("notifications.markAllRead"'), "NotificationCenter translates Mark all read");

const desktopSidebarPath = path.join(projectRoot, "components", "navigation", "desktop-sidebar.tsx");
const desktopSidebarContent = fs.readFileSync(desktopSidebarPath, "utf-8");
assert(desktopSidebarContent.includes("getTranslatedNavTitle"), "DesktopSidebar uses getTranslatedNavTitle");

const mobileNavPath = path.join(projectRoot, "components", "navigation", "mobile-navigation.tsx");
const mobileNavContent = fs.readFileSync(mobileNavPath, "utf-8");
assert(mobileNavContent.includes("getTranslatedNavTitle"), "MobileNavigation uses getTranslatedNavTitle");

const fedSidebarPath = path.join(projectRoot, "features", "federation-admin", "components", "federation-admin-sidebar.tsx");
const fedSidebarContent = fs.readFileSync(fedSidebarPath, "utf-8");
assert(fedSidebarContent.includes("getTranslatedNavTitle"), "FederationAdminSidebar uses getTranslatedNavTitle");

console.log("\n==================================================");
console.log(`TOTAL RESULTS: ${totalPassed} PASSED, ${totalFailed} FAILED`);
console.log("==================================================");

if (totalFailed > 0) {
  process.exit(1);
}
