import {
  STATIC_ROLE_NOTIFICATIONS,
  getRoleFromPathname,
  getStaticNotificationsForRole,
  type RoleNotificationItem,
} from "../constants/static-notifications";
import { SAMPLE_CUSTOMER_NOTIFICATIONS } from "../features/customer/home/customer-notifications-card";
import { MOCK_NOTIFICATIONS } from "../features/super-admin/notifications/data/mock-notifications";
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

// 2. Exact Title & Message Matches as per requirements
const expectedCustomer = [
  {
    title: "New estimate received",
    message: "A worker has submitted an estimate for your service request.",
  },
  {
    title: "Booking confirmed",
    message: "Your booking with the selected worker has been confirmed.",
  },
  {
    title: "Payment required",
    message: "Your final service bill is ready. Please complete payment to continue.",
  },
  {
    title: "Complaint update",
    message: "Your complaint has been reviewed by the federation. Open the complaint to view the latest update.",
  },
  {
    title: "Service completed",
    message: "Your service has been marked as completed. Please review the final bill and payment details.",
  },
];

expectedCustomer.forEach((exp) => {
  const match = STATIC_ROLE_NOTIFICATIONS.CUSTOMER.find((n) => n.title === exp.title);
  assert(Boolean(match), `Customer includes notification title: "${exp.title}"`);
  if (match) {
    assert(match.message === exp.message, `Customer notification "${exp.title}" has exact message match`);
  }
});

const expectedWorker = [
  {
    title: "New service request",
    message: "A customer has requested your services for a new job.",
  },
  {
    title: "Booking confirmed",
    message: "Your service request has been accepted and the booking is confirmed.",
  },
  {
    title: "Customer complaint",
    message: "A customer has submitted a complaint regarding one of your completed services.",
  },
  {
    title: "Complaint response required",
    message: "The federation is waiting for your response regarding a customer complaint.",
  },
  {
    title: "Payment received",
    message: "Payment for your completed service has been recorded successfully.",
  },
];

expectedWorker.forEach((exp) => {
  const match = STATIC_ROLE_NOTIFICATIONS.WORKER.find((n) => n.title === exp.title);
  assert(Boolean(match), `Worker includes notification title: "${exp.title}"`);
  if (match) {
    assert(match.message === exp.message, `Worker notification "${exp.title}" has exact message match`);
  }
});

const expectedFed = [
  {
    title: "Worker registration pending",
    message: "A new worker registration is waiting for federation review.",
  },
  {
    title: "New customer complaint",
    message: "A customer complaint regarding a worker is waiting for your review.",
  },
  {
    title: "Worker complaint received",
    message: "A worker has submitted a complaint that requires federation review.",
  },
  {
    title: "Worker response received",
    message: "A worker has submitted their response to a customer complaint.",
  },
  {
    title: "Escalated complaint",
    message: "A complaint has been escalated to the Super Admin and requires attention.",
  },
];

expectedFed.forEach((exp) => {
  const match = STATIC_ROLE_NOTIFICATIONS.FEDERATION_ADMIN.find((n) => n.title === exp.title);
  assert(Boolean(match), `Federation Admin includes notification title: "${exp.title}"`);
  if (match) {
    assert(match.message === exp.message, `Federation Admin notification "${exp.title}" has exact message match`);
  }
});

const expectedSuperAdmin = [
  {
    title: "Federation complaint received",
    message: "A federation has submitted a complaint that requires Super Admin review.",
  },
  {
    title: "Escalated complaint",
    message: "A federation has escalated a complaint for Super Admin intervention.",
  },
  {
    title: "Federation performance alert",
    message: "A federation currently has multiple pending complaints requiring attention.",
  },
  {
    title: "Federation review required",
    message: "A federation requires administrative review based on its current complaint activity.",
  },
  {
    title: "Complaint resolution update",
    message: "An escalated federation complaint has been updated and is ready for review.",
  },
];

expectedSuperAdmin.forEach((exp) => {
  const match = STATIC_ROLE_NOTIFICATIONS.SUPER_ADMIN.find((n) => n.title === exp.title);
  assert(Boolean(match), `Super Admin includes notification title: "${exp.title}"`);
  if (match) {
    assert(match.message === exp.message, `Super Admin notification "${exp.title}" has exact message match`);
  }
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

// 6. Verify CustomerNotificationsCard uses exact 5 static customer notifications
assert(SAMPLE_CUSTOMER_NOTIFICATIONS.length === 5, `CustomerNotificationsCard: exactly 5 items (actual: ${SAMPLE_CUSTOMER_NOTIFICATIONS.length})`);
assert(
  SAMPLE_CUSTOMER_NOTIFICATIONS[0].title === "New estimate received" &&
  SAMPLE_CUSTOMER_NOTIFICATIONS[0].message === "A worker has submitted an estimate for your service request.",
  "CustomerNotificationsCard: item 1 matches exact spec"
);

// 7. Verify Super Admin MOCK_NOTIFICATIONS uses exact 5 static super admin notifications
assert(MOCK_NOTIFICATIONS.length === 5, `MOCK_NOTIFICATIONS: exactly 5 items (actual: ${MOCK_NOTIFICATIONS.length})`);
assert(
  MOCK_NOTIFICATIONS[0].title === "Federation complaint received" &&
  MOCK_NOTIFICATIONS[0].description === "A federation has submitted a complaint that requires Super Admin review.",
  "MOCK_NOTIFICATIONS: item 1 matches exact spec"
);

console.log("==================================================");
if (hasFailures) {
  console.error("VERIFICATION SUITE FAILED with errors.");
  process.exit(1);
} else {
  console.log("VERIFICATION SUITE PASSED! All assertions succeeded.");
  process.exit(0);
}
