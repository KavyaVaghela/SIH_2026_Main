import * as fs from "fs";
import * as path from "path";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 1. Manually load environment from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  }
}

// 2. Import route handlers to test the real server logic directly
import { POST as createIncidentHandler, GET as getIncidentsHandler } from "../app/api/emergency/incidents/route";
import { GET as getIncidentDetailHandler, PATCH as patchIncidentHandler } from "../app/api/emergency/incidents/[id]/route";
import { POST as createBookingHandler } from "../app/api/bookings/route";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const supabaseSecret = process.env.SUPABASE_SECRET_KEY || "";
const dbClient = createClient(supabaseUrl, supabaseSecret);

async function runVerificationSuite() {
  console.log("==================================================");
  console.log("KAUSHALYA SETU EMERGENCY SERVICES — INCIDENT FOUNDATION");
  console.log("STRICT SESSION AUTHENTICATION & SECURITY VERIFICATION");
  console.log("==================================================\n");

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failedTests++;
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // -------------------------------------------------------------
  // SETUP: Authenticate real Supabase test users
  // -------------------------------------------------------------
  console.log("[SETUP] Authenticating Supabase test users...");
  const anonClient = createClient(supabaseUrl, supabaseAnon);

  // Authenticate Customer A
  const { data: authA, error: errA } = await anonClient.auth.signInWithPassword({
    email: "customer@example.com",
    password: "Password123!",
  });
  if (errA || !authA.session) {
    throw new Error("Failed to authenticate test customer A: " + errA?.message);
  }
  const tokenA = authA.session.access_token;
  const customerAId = authA.user.id;
  console.log(`  Authenticated Customer A: ${customerAId} (${authA.user.email})`);

  // Create & authenticate temporary Customer B for isolation tests
  const customerBEmail = `customer.b.test.${Date.now()}@example.com`;
  const { data: userBCreated, error: errBCreate } = await dbClient.auth.admin.createUser({
    email: customerBEmail,
    password: "Password123!",
    email_confirm: true,
  });
  if (errBCreate || !userBCreated.user) {
    throw new Error("Failed to create Customer B: " + errBCreate?.message);
  }
  const customerBId = userBCreated.user.id;
  await (dbClient.from("profiles") as any).insert({
    id: customerBId,
    email: customerBEmail,
    full_name: "Customer B Isolation Test",
    role: "CUSTOMER",
  });

  const { data: authB, error: errB } = await anonClient.auth.signInWithPassword({
    email: customerBEmail,
    password: "Password123!",
  });
  if (errB || !authB.session) {
    throw new Error("Failed to authenticate Customer B: " + errB?.message);
  }
  const tokenB = authB.session.access_token;
  console.log(`  Authenticated Customer B: ${customerBId} (${customerBEmail})\n`);

  let createdIncidentA: any = null;
  let createdIncidentB: any = null;

  // -------------------------------------------------------------
  // TEST: Unauthenticated Requests MUST be Rejected
  // -------------------------------------------------------------
  console.log("--------------------------------------------------");
  console.log("TEST SECURITY: Unauthenticated Requests Strictly Blocked");
  console.log("--------------------------------------------------");
  {
    const unauthReq = new NextRequest("http://localhost:3000/api/emergency/incidents", {
      method: "POST",
      body: JSON.stringify({
        // Client attempts to spoof identity via body without a session
        customerId: customerAId,
        categoryName: "Water Infrastructure",
        emergencyType: "Society Water Tank Burst",
        location: "Test Location",
        description: "Test description",
      }),
    });

    const unauthRes = await createIncidentHandler(unauthReq);
    assert(unauthRes.status === 401, `Unauthenticated POST rejected with 401 Unauthorized (got ${unauthRes.status})`);

    const unauthGetReq = new NextRequest("http://localhost:3000/api/emergency/incidents");
    const unauthGetRes = await getIncidentsHandler(unauthGetReq);
    assert(unauthGetRes.status === 401, `Unauthenticated GET rejected with 401 Unauthorized (got ${unauthGetRes.status})`);
  }

  // -------------------------------------------------------------
  // TEST A — Create Emergency with Session Authentication
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("TEST A: Create Emergency Incident via Authenticated Session");
  console.log("--------------------------------------------------");
  {
    const req = new NextRequest("http://localhost:3000/api/emergency/incidents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        // Notice: NO customerId supplied in body
        categoryName: "Water Infrastructure",
        emergencyType: "Society Water Tank Burst",
        location: "Block C, Shivam Apartments, Satellite, Ahmedabad",
        description: "Overhead 5000L water tank split open flooding terrace and main electrical shafts.",
        approxPeopleAffected: 25,
        immediateDanger: true,
        dangerDetails: "Water actively dripping onto building central circuit breaker panel.",
        evidencePhotos: ["https://example.com/evidence-tank-burst.jpg"],
      }),
    });

    const res = await createIncidentHandler(req);
    const body = await res.json();

    assert(res.status === 201, `Status code is 201 Created (got ${res.status})`);
    assert(body.success === true, "Response has success: true");
    assert(Boolean(body.incident?.id), "Internal incident UUID is generated");
    assert(Boolean(body.incident?.emergencyId), `Emergency ID generated: ${body.incident?.emergencyId}`);
    assert(body.incident?.customerId === customerAId, `Incident customer_id strictly matches authenticated Customer A session UID`);
    assert(body.incident?.status === "AWAITING_RESPONSE", `Status is strictly AWAITING_RESPONSE`);
    assert(body.incident?.emergencyType === "Society Water Tank Burst", `Emergency type matches predefined selection`);
    assert(body.incident?.approxPeopleAffected === 25, "Approx affected population recorded");
    assert(body.incident?.immediateDanger === true, "Immediate danger flag stored");

    createdIncidentA = body.incident;
  }

  // -------------------------------------------------------------
  // TEST B — Emergency ID Format & Uniqueness
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("TEST B: Emergency ID Format & Uniqueness");
  console.log("--------------------------------------------------");
  {
    const emgId = createdIncidentA.emergencyId;
    const formatRegex = /^EMG-\d{4}-[A-Z0-9]{5,6}$/;
    assert(formatRegex.test(emgId), `Emergency ID format matches EMG-YYYY-XXXXXX pattern (got ${emgId})`);

    // Verify dynamic server year is derived from current server date (not hardcoded)
    const currentYear = String(new Date().getFullYear());
    assert(
      emgId.startsWith(`EMG-${currentYear}-`),
      `Emergency ID year is dynamically derived from current server year (${currentYear}): got ${emgId}`
    );

    // Create a second incident authenticated as Customer B
    const req2 = new NextRequest("http://localhost:3000/api/emergency/incidents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        categoryName: "Electrical Systems",
        emergencyType: "Electrical Short Circuit & Sparking",
        location: "Flat 202, Radhe Shyam Complex, Ahmedabad",
        description: "Main line sparks emitting from hallway junction box.",
        approxPeopleAffected: 4,
        immediateDanger: true,
      }),
    });

    const res2 = await createIncidentHandler(req2);
    const body2 = await res2.json();
    createdIncidentB = body2.incident;

    assert(res2.status === 201, "Second incident created successfully");
    assert(createdIncidentB.customerId === customerBId, "Second incident customer_id matches authenticated Customer B session UID");
    assert(formatRegex.test(createdIncidentB.emergencyId), `Second Emergency ID format matches: ${createdIncidentB.emergencyId}`);
    assert(createdIncidentA.emergencyId !== createdIncidentB.emergencyId, `Both Emergency IDs are strictly unique (${createdIncidentA.emergencyId} !== ${createdIncidentB.emergencyId})`);
  }

  // -------------------------------------------------------------
  // TEST C — No Booking & Severity Property Isolation (CRITICAL)
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("TEST C: Verification That NO Normal Booking Was Created & Severity Isolation");
  console.log("--------------------------------------------------");
  {
    // 1. Verify severity is strictly an Emergency Incident operational property
    assert(
      createdIncidentA.severity === "CRITICAL",
      `Severity is strictly an Emergency Incident property: ${createdIncidentA.severity}`
    );

    // 2. Query bookings table to ensure the Emergency ID, Incident ID, or Severity was NEVER created as a booking
    const { data: matchedBookings } = await dbClient
      .from("bookings")
      .select("id, booking_number, priority")
      .or(`booking_number.eq.${createdIncidentA.emergencyId},id.eq.${createdIncidentA.id}`);

    assert(!matchedBookings || matchedBookings.length === 0, "No bookings table record exists matching the Emergency ID or Incident UUID");
    console.log("  ℹ️ Confirmed: Emergency Incident exists strictly as an independent entity.");
  }

  // -------------------------------------------------------------
  // TEST D — Customer Isolation & Scoping
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("TEST D: Customer Isolation");
  console.log("--------------------------------------------------");
  {
    // Customer A queries Customer A's incident
    const reqOwner = new NextRequest(`http://localhost:3000/api/emergency/incidents/${createdIncidentA.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const resOwner = await getIncidentDetailHandler(reqOwner, { params: { id: createdIncidentA.id } });
    const bodyOwner = await resOwner.json();
    assert(resOwner.status === 200, "Customer A can successfully retrieve their own incident");
    assert(bodyOwner.incident?.emergencyId === createdIncidentA.emergencyId, "Retrieved incident matches Owner's incident");

    // Customer B attempts to view Customer A's incident
    const reqTrespasser = new NextRequest(`http://localhost:3000/api/emergency/incidents/${createdIncidentA.id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const resTrespasser = await getIncidentDetailHandler(reqTrespasser, { params: { id: createdIncidentA.id } });
    assert(resTrespasser.status === 403, `Customer B is blocked from viewing Customer A's incident with 403 Forbidden (got ${resTrespasser.status})`);

    // Customer A lists incidents
    const reqListA = new NextRequest(`http://localhost:3000/api/emergency/incidents`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const resListA = await getIncidentsHandler(reqListA);
    const bodyListA = await resListA.json();
    assert(resListA.status === 200, "Customer A list retrieved");
    const hasOwnerIncident = bodyListA.incidents.some((i: any) => i.id === createdIncidentA.id);
    assert(hasOwnerIncident, "Customer A's incident appears in Customer A's list");
    const hasOtherCustomerIncident = bodyListA.incidents.some((i: any) => i.id === createdIncidentB.id);
    assert(!hasOtherCustomerIncident, "Customer B's incident does NOT appear in Customer A's scoped list");
  }

  // -------------------------------------------------------------
  // TEST E — Status Protection
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("TEST E: Status Protection (Customer Cannot Change Status)");
  console.log("--------------------------------------------------");
  {
    const patchReqActive = new NextRequest(`http://localhost:3000/api/emergency/incidents/${createdIncidentA.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        status: "ACTIVE",
      }),
    });

    const patchResActive = await patchIncidentHandler(patchReqActive, { params: { id: createdIncidentA.id } });
    assert(patchResActive.status === 403, `Customer attempt to change status to ACTIVE is rejected with 403 Forbidden (got ${patchResActive.status})`);

    const patchReqClosed = new NextRequest(`http://localhost:3000/api/emergency/incidents/${createdIncidentA.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        status: "CLOSED",
      }),
    });

    const patchResClosed = await patchIncidentHandler(patchReqClosed, { params: { id: createdIncidentA.id } });
    assert(patchResClosed.status === 403, `Customer attempt to change status to CLOSED is rejected with 403 Forbidden (got ${patchResClosed.status})`);

    // Verify status remains unchanged at AWAITING_RESPONSE
    const verifyReq = new NextRequest(`http://localhost:3000/api/emergency/incidents/${createdIncidentA.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const verifyRes = await getIncidentDetailHandler(verifyReq, { params: { id: createdIncidentA.id } });
    const verifyBody = await verifyRes.json();
    assert(verifyBody.incident?.status === "AWAITING_RESPONSE", `Incident status is verified unchanged: ${verifyBody.incident?.status}`);
  }

  // -------------------------------------------------------------
  // TEST F — Emergency Type Validation
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("TEST F: Emergency Type Validation");
  console.log("--------------------------------------------------");
  {
    const reqInvalid = new NextRequest("http://localhost:3000/api/emergency/incidents", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        categoryName: "Unknown",
        emergencyType: "Random Fabricated Emergency Type",
        location: "Satellite, Ahmedabad",
        description: "Test description for invalid emergency type",
      }),
    });

    const resInvalid = await createIncidentHandler(reqInvalid);
    assert(resInvalid.status === 400, `Invalid emergency type rejected with 400 Bad Request (got ${resInvalid.status})`);
    const bodyInvalid = await resInvalid.json();
    assert(bodyInvalid.error.includes("Invalid or unrecognized emergency type"), "Rejection error message clearly indicates invalid emergency type");
  }

  // -------------------------------------------------------------
  // TEST G — Client-Side Identity Spoofing Protection
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("TEST G: Client-Side Identity Spoofing Protection");
  console.log("--------------------------------------------------");
  {
    // Customer A is authenticated, but supplies Customer B's ID in the body
    const reqSpoof = new NextRequest("http://localhost:3000/api/emergency/incidents", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        customerId: customerBId, // Malicious attempt to create incident under Customer B's identity
        customer_id: customerBId,
        profileId: customerBId,
        emergency_id: "EMG-HACK-99999", // Malicious attempt to force an Emergency ID
        status: "ACTIVE", // Malicious attempt to bypass initial status
        categoryName: "Water Infrastructure",
        emergencyType: "Main Water Supply Line Rupture",
        location: "Near Iscon Cross Road, Ahmedabad",
        description: "Main municipal line burst flooding commercial road.",
      }),
    });

    const resSpoof = await createIncidentHandler(reqSpoof);
    const bodySpoof = await resSpoof.json();

    assert(resSpoof.status === 201, "Incident created with server sanitization");
    assert(bodySpoof.incident.customerId === customerAId, `Incident ownership is strictly Customer A (${customerAId}); client body customerId (${customerBId}) was COMPLETELY DISCARDED`);
    assert(bodySpoof.incident.emergencyId !== "EMG-HACK-99999", "Client-supplied EMG-HACK-99999 was discarded");
    assert(bodySpoof.incident.status === "AWAITING_RESPONSE", "Client-supplied ACTIVE status was discarded; forced to AWAITING_RESPONSE");
    assert(/^EMG-\d{4}-[A-Z0-9]{5,6}$/.test(bodySpoof.incident.emergencyId), `Authoritative server-generated Emergency ID assigned: ${bodySpoof.incident.emergencyId}`);
  }

  // -------------------------------------------------------------
  // TEST H — Evidence Photo Association
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("TEST H: Evidence Photo Association");
  console.log("--------------------------------------------------");
  {
    const testPhoto = "https://dxvnwbmxeubpbunwlmnd.supabase.co/storage/v1/object/public/avatars/incident-evidence-test-123.jpg";
    const reqEvidence = new NextRequest("http://localhost:3000/api/emergency/incidents", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        categoryName: "Gas & Fire Hazard",
        emergencyType: "Piped Gas Leakage",
        location: "Building 4, Piped Gas Meter Bank, Ahmedabad",
        description: "Strong pungent gas odor near society main manifold.",
        photoUrl: testPhoto,
        evidencePhotos: [testPhoto],
        immediateDanger: true,
        dangerDetails: "Active gas leak inside enclosed utility room.",
      }),
    });

    const resEvidence = await createIncidentHandler(reqEvidence);
    const bodyEvidence = await resEvidence.json();

    assert(resEvidence.status === 201, "Incident with evidence created");
    assert(bodyEvidence.incident?.photoUrl === testPhoto, "Single photoUrl resolved correctly");
    assert(Array.isArray(bodyEvidence.incident?.evidencePhotos), "evidencePhotos is an array");
    assert(bodyEvidence.incident?.evidencePhotos.includes(testPhoto), "Supplied photo is saved inside evidencePhotos array");
  }

  // -------------------------------------------------------------
  // TEST I — Normal Customer → Worker Booking Regression
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("TEST I: Normal Customer -> Worker Booking Regression");
  console.log("--------------------------------------------------");
  {
    const normalBookingReq = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        action: "create",
        customerId: customerAId,
        workerId: "59eca4ff-a589-4363-ad76-24a4ff5b6e2e", // Ravi Patel
        serviceId: "a510e2c8-5ee9-4b01-abfc-a2a101ea729e",
        federationId: "b765df3b-c418-4a15-b79f-3cbc09e475dc",
        addressId: "3f50baf2-d986-4bec-88c2-dfa901d78a0b",
        totalAmount: 450,
        problemDescription: "Normal scheduled tap repair service",
      }),
    });

    const bookingRes = await createBookingHandler(normalBookingReq);
    const bookingBody = await bookingRes.json();

    assert(bookingRes.status === 200, `Normal booking creation returned status 200 OK (got ${bookingRes.status})`);
    assert(Boolean(bookingBody.booking?.id), "Normal booking ID is present");
    assert(bookingBody.booking?.status === "REQUEST_SENT", `Normal booking initial status is REQUEST_SENT (got ${bookingBody.booking?.status})`);
    assert(bookingBody.booking?.bookingNumber.startsWith("BK-"), `Normal booking number has BK- prefix (got ${bookingBody.booking?.bookingNumber})`);
    console.log(`  ℹ️ Confirmed: Normal booking ${bookingBody.booking?.bookingNumber} created successfully without interference from Emergency system.`);
  }

  // Cleanup temporary test user B
  try {
    await dbClient.auth.admin.deleteUser(customerBId);
  } catch {
    // Cleanup notice
  }

  console.log("\n==================================================");
  console.log(`VERIFICATION SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log("==================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runVerificationSuite().catch((err) => {
  console.error("\n💥 FATAL VERIFICATION ERROR:", err);
  process.exit(1);
});
