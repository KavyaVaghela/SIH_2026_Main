import fs from "fs";
import path from "path";

console.log("==================================================");
console.log("AUTH NAVIGATION & SIGN OUT VERIFICATION SUITE");
console.log("==================================================");

let hasFailures = false;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}${detail ? ` - Detail: ${detail}` : ""}`);
    hasFailures = true;
  }
}

const root = path.resolve(__dirname, "..");

// 1. Check Login Page Navigation
const loginViewPath = path.join(root, "features", "auth", "login-view.tsx");
const loginContent = fs.readFileSync(loginViewPath, "utf-8");

assert(
  !loginContent.includes("Back to Home"),
  "LoginView top duplicate 'Back to Home' navigation link has been removed"
);
assert(
  loginContent.includes("Back to Landing Page") &&
    loginContent.includes('href="/"') &&
    loginContent.includes("text-primary") &&
    loginContent.includes("font-semibold"),
  "LoginView footer contains single '← Back to Landing Page' navigation link pointing to '/' styled with text-primary and font-semibold"
);

// 2. Check UserMenu (used across all 4 dashboards in TopNavbar)
const userMenuPath = path.join(root, "components", "navigation", "user-menu.tsx");
const userMenuContent = fs.readFileSync(userMenuPath, "utf-8");

assert(
  userMenuContent.includes("supabase.auth.signOut()"),
  "UserMenu performs supabase.auth.signOut() on Sign Out click"
);
assert(
  userMenuContent.includes('router.push("/")'),
  "UserMenu redirects to landing page '/' after sign out"
);
assert(
  !userMenuContent.includes('router.push("/login")'),
  "UserMenu does NOT redirect to '/login' on sign out"
);

// 3. Check lib/auth/actions.ts signOut
const actionsPath = path.join(root, "lib", "auth", "actions.ts");
const actionsContent = fs.readFileSync(actionsPath, "utf-8");

assert(
  actionsContent.includes('redirectUrl: "/"'),
  "signOut in lib/auth/actions.ts returns redirectUrl: '/'"
);

// 4. Check Super Admin Profile Logout
const superAdminProfileHookPath = path.join(
  root,
  "features",
  "super-admin",
  "profile",
  "hooks",
  "use-super-admin-profile.ts"
);
const superAdminProfileContent = fs.readFileSync(superAdminProfileHookPath, "utf-8");

assert(
  superAdminProfileContent.includes('router.push("/")'),
  "Super Admin profile logout redirects to landing page '/'"
);
assert(
  !superAdminProfileContent.includes('router.push("/login")'),
  "Super Admin profile logout does NOT redirect to '/login'"
);

// 5. Check Customer Settings Sign Out
const customerSettingsPath = path.join(
  root,
  "features",
  "customer",
  "settings",
  "settings-view.tsx"
);
const customerSettingsContent = fs.readFileSync(customerSettingsPath, "utf-8");

assert(
  customerSettingsContent.includes('router.push("/")'),
  "Customer settings handleSignOut redirects to landing page '/'"
);
assert(
  !customerSettingsContent.includes('router.push("/login")'),
  "Customer settings handleSignOut does NOT redirect to '/login'"
);

// 6. Check Middleware route protection
const middlewarePath = path.join(root, "middleware.ts");
const middlewareContent = fs.readFileSync(middlewarePath, "utf-8");

assert(
  middlewareContent.includes("!user && isProtectedPath"),
  "Middleware checks for unauthenticated user on protected paths"
);
assert(
  middlewareContent.includes('const loginUrl = new URL("/login", request.url);'),
  "Middleware directs unauthenticated requests for protected dashboard routes to /login"
);

console.log("==================================================");
if (hasFailures) {
  console.error("VERIFICATION SUITE FAILED with errors.");
  process.exit(1);
} else {
  console.log("VERIFICATION SUITE PASSED! All assertions succeeded.");
  process.exit(0);
}
