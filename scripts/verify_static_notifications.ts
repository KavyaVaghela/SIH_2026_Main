import {
  STATIC_ROLE_NOTIFICATIONS,
  getRoleFromPathname,
  getStaticNotificationsForRole,
  type RoleNotificationItem,
} from "../constants/static-notifications";
import type { PlatformRole } from "../config/navigation";

console.log("==================================================");
console.log("STATIC NOTIFICATIONS VERIFICATION SUITE");
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

// 1. Role isolation & dataset completeness
const roles: PlatformRole[] = ["CUSTOMER", "WORKER", "FEDERATION_ADMIN", "SUPER_ADMIN"];

roles.forEach((role) => {
  const notifs = STATIC_ROLE_NOTIFICATIONS[role];
  assert(Array.isArray(notifs), `${role}: notifications array exists`);
  assert(notifs.length >= 4 && notifs.length <= 5, `${role}: has 4-5 static notifications (actual: ${notifs.length})`);

  const unreadCount = notifs.filter((n) => !n.isRead).length;
  assert(unreadCount >= 1, `${role}: at least 1 notification is unread (actual unread: ${unreadCount})`);

  const hasRead = notifs.filter((n) => n.isRead).length;
  assert(hasRead >= 1, `${role}: has read notifications (actual read: ${hasRead})`);

  notifs.forEach((n, idx) => {
    assert(Boolean(n.id && n.title && n.message && n.timestamp), `${role} item #${idx + 1}: has id, title, message, and timestamp`);
    assert(typeof n.isRead === "boolean", `${role} item #${idx + 1}: isRead is boolean`);
    assert(["info", "success", "warning", "alert"].includes(n.type), `${role} item #${idx + 1}: valid type (${n.type})`);
  });
});

// 2. Exact Title Matches as per requirements
const expectedCustomerTitles = [
  "New estimate received",
  "Booking confirmed",
  "Payment required",
  "Complaint update",
  "Service completed",
];

const customerTitles = STATIC_ROLE_NOTIFICATIONS.CUSTOMER.map((n) => n.title);
expectedCustomerTitles.forEach((title) => {
  assert(customerTitles.includes(title), `Customer includes notification title: "${title}"`);
});

const expectedWorkerTitles = [
  "New service request",
  "Booking confirmed",
  "Customer complaint",
  "Complaint response required",
  "Payment received",
];
const workerTitles = STATIC_ROLE_NOTIFICATIONS.WORKER.map((n) => n.title);
expectedWorkerTitles.forEach((title) => {
  assert(workerTitles.includes(title), `Worker includes notification title: "${title}"`);
});

const expectedFedTitles = [
  "Worker registration pending",
  "New customer complaint",
  "Worker complaint received",
  "Worker response received",
  "Escalated complaint",
];
const fedTitles = STATIC_ROLE_NOTIFICATIONS.FEDERATION_ADMIN.map((n) => n.title);
expectedFedTitles.forEach((title) => {
  assert(fedTitles.includes(title), `Federation Admin includes notification title: "${title}"`);
});

const expectedSuperAdminTitles = [
  "Federation complaint received",
  "Escalated complaint",
  "Federation performance alert",
  "Federation review required",
  "Complaint resolution update",
];
const saTitles = STATIC_ROLE_NOTIFICATIONS.SUPER_ADMIN.map((n) => n.title);
expectedSuperAdminTitles.forEach((title) => {
  assert(saTitles.includes(title), `Super Admin includes notification title: "${title}"`);
});

// 3. Strict Role Isolation: IDs across roles must be strictly distinct
const allIds = [
  ...STATIC_ROLE_NOTIFICATIONS.CUSTOMER.map((n) => n.id),
  ...STATIC_ROLE_NOTIFICATIONS.WORKER.map((n) => n.id),
  ...STATIC_ROLE_NOTIFICATIONS.FEDERATION_ADMIN.map((n) => n.id),
  ...STATIC_ROLE_NOTIFICATIONS.SUPER_ADMIN.map((n) => n.id),
];
const uniqueIds = new Set(allIds);
assert(allIds.length === uniqueIds.size, "Role Isolation: All notification IDs are mutually distinct across roles");

// 4. Pathname Role Resolution
assert(getRoleFromPathname("/customer") === "CUSTOMER", "getRoleFromPathname('/customer') -> CUSTOMER");
assert(getRoleFromPathname("/customer/bookings") === "CUSTOMER", "getRoleFromPathname('/customer/bookings') -> CUSTOMER");
assert(getRoleFromPathname("/worker") === "WORKER", "getRoleFromPathname('/worker') -> WORKER");
assert(getRoleFromPathname("/worker/schedule") === "WORKER", "getRoleFromPathname('/worker/schedule') -> WORKER");
assert(getRoleFromPathname("/federation-admin") === "FEDERATION_ADMIN", "getRoleFromPathname('/federation-admin') -> FEDERATION_ADMIN");
assert(getRoleFromPathname("/federation-admin/complaint-management") === "FEDERATION_ADMIN", "getRoleFromPathname('/federation-admin/complaint-management') -> FEDERATION_ADMIN");
assert(getRoleFromPathname("/super-admin") === "SUPER_ADMIN", "getRoleFromPathname('/super-admin') -> SUPER_ADMIN");
assert(getRoleFromPathname("/super-admin/notifications") === "SUPER_ADMIN", "getRoleFromPathname('/super-admin/notifications') -> SUPER_ADMIN");

// 5. Deep clone isolation: modifying returned array must not mutate static base
const custCopy = getStaticNotificationsForRole("CUSTOMER");
custCopy[0].isRead = true;
assert(
  STATIC_ROLE_NOTIFICATIONS.CUSTOMER[0].isRead === false,
  "Deep clone isolation: getStaticNotificationsForRole produces independent copy"
);

console.log("==================================================");
if (hasFailures) {
  console.error("VERIFICATION SUITE FAILED with errors.");
  process.exit(1);
} else {
  console.log("VERIFICATION SUITE PASSED! All assertions succeeded.");
  process.exit(0);
}
