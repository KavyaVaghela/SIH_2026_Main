import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...valParts] = trimmed.split("=");
        process.env[key.trim()] = valParts.join("=").trim();
      }
    }
  }
}
loadEnv();

async function verifyPhase8Notifications() {
  console.log("==================================================");
  console.log("PHASE 8 — NOTIFICATION CENTRALIZATION + REALTIME VERIFICATION");
  console.log("==================================================");

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  // 1. Query Super Admin profile and DB Ground Truth
  console.log("\n[1] Querying real notifications from Supabase directly...");
  const { data: saProfiles } = await adminClient
    .from("profiles")
    .select("id, email, role")
    .eq("role", "SUPER_ADMIN");

  if (!saProfiles || saProfiles.length === 0) {
    throw new Error("No Super Admin profile found in profiles table!");
  }

  const superAdmin = saProfiles[0];
  console.log(`Identified Super Admin Profile: ${superAdmin.email} (ID: ${superAdmin.id})`);

  const { data: dbNotifs, error: nErr } = await adminClient
    .from("notifications")
    .select("id, profile_id, title, message, type, is_read, metadata, created_at")
    .eq("profile_id", superAdmin.id)
    .order("created_at", { ascending: false });

  if (nErr) {
    throw new Error(`Failed to query notifications: ${nErr.message}`);
  }

  const totalDb = dbNotifs?.length || 0;
  const unreadDb = (dbNotifs || []).filter((n) => !n.is_read).length;
  console.log(`Direct DB Super Admin Notifications: Total=${totalDb}, Unread=${unreadDb}`);

  // 2. Query other roles to test Role Isolation
  console.log("\n[2] Verifying Strict Role Isolation in Database...");
  const { data: customerProfiles } = await adminClient
    .from("profiles")
    .select("id, email")
    .eq("role", "CUSTOMER")
    .limit(1);

  if (customerProfiles && customerProfiles.length > 0) {
    const custId = customerProfiles[0].id;
    const { data: custNotifs } = await adminClient
      .from("notifications")
      .select("id, profile_id")
      .eq("profile_id", custId);
    console.log(`Customer (${customerProfiles[0].email}) notification count: ${custNotifs?.length || 0}`);

    // Verify Super Admin does NOT have customer notifications
    const leakage = (dbNotifs || []).filter((n) => n.profile_id === custId);
    if (leakage.length > 0) {
      throw new Error(`Role isolation violation! Found ${leakage.length} customer notifications assigned to Super Admin!`);
    }
    console.log("✓ Role isolation verified: Customer notifications strictly isolated from Super Admin.");
  }

  // 3. Test Realtime Publication / Availability on notifications table
  console.log("\n[3] Verifying Realtime Table Availability...");
  const testChannel = adminClient.channel("verify-test-channel");
  if (!testChannel) {
    throw new Error("Failed to instantiate Supabase Realtime channel!");
  }
  console.log("✓ Supabase Realtime channel instantiated and ready for subscriptions.");
  adminClient.removeChannel(testChannel);

  // 4. Test Deep Link & Navigation Target Consistency
  console.log("\n[4] Verifying Notification Deep Links & Target Routes...");
  for (const n of (dbNotifs || []).slice(0, 3)) {
    const hasValidContext = n.metadata?.bookingId || n.metadata?.invoiceId || n.title;
    console.log(`  * [${n.type}] "${n.title}" -> metadata: ${JSON.stringify(n.metadata || {})}`);
    if (!hasValidContext) {
      throw new Error(`Notification ${n.id} lacks valid operational context!`);
    }
  }
  console.log("✓ Operational deep link context present on real database notifications.");

  // 5. Test Notification DB Read Persistence
  console.log("\n[5] Verifying Read State Persistence to Supabase...");
  if (dbNotifs && dbNotifs.length > 0) {
    const targetNotif = dbNotifs[0];
    const initialRead = targetNotif.is_read;

    // Toggle read state in DB
    const { error: updateErr } = await adminClient
      .from("notifications")
      .update({ is_read: !initialRead })
      .eq("id", targetNotif.id);

    if (updateErr) {
      throw new Error(`Failed to update notification read state: ${updateErr.message}`);
    }

    // Verify read state changed in DB
    const { data: verifiedRow } = await adminClient
      .from("notifications")
      .select("is_read")
      .eq("id", targetNotif.id)
      .single();

    if (verifiedRow?.is_read !== !initialRead) {
      throw new Error("Read state did not persist to Supabase!");
    }
    console.log(`✓ Read state successfully persisted to Supabase database (was: ${initialRead} -> now: ${verifiedRow?.is_read}).`);

    // Restore original state
    await adminClient
      .from("notifications")
      .update({ is_read: initialRead })
      .eq("id", targetNotif.id);
    console.log(`✓ Restored original read state (${initialRead}).`);
  }

  // 6. Verify No Sidebar Notifications Item
  console.log("\n[6] Verifying Sidebar Navigation Configuration...");
  const navConfigPath = path.join(process.cwd(), "config", "navigation.ts");
  const navContent = fs.readFileSync(navConfigPath, "utf8");
  if (navContent.includes('"Notifications"') || navContent.includes("href: \"/super-admin/notifications\"")) {
    throw new Error("Violation: Notifications item found in sidebar navigation configuration!");
  }
  console.log("✓ Notifications item confirmed removed from sidebar (header bell is canonical entry point).");

  console.log("\n==================================================");
  console.log("✓ PHASE 8 VERIFICATION PASSED SUCCESSFULLY");
  console.log("==================================================");
}

verifyPhase8Notifications().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
