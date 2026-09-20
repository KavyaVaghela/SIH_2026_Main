import * as fs from "fs";
import * as path from "path";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 1. Load environment from .env.local
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

// 2. Import handlers and repository
import {
  EmergencyResponseMatrixRepository,
  SEED_EMERGENCY_RESPONSE_MATRIX,
} from "../lib/emergency/response-matrix-store";
import { GET as getMatrixHandler, PATCH as patchMatrixHandler, POST as postMatrixHandler } from "../app/api/emergency/matrix/route";
import { POST as createIncidentHandler } from "../app/api/emergency/incidents/route";
import { GET as getIncidentDetailHandler } from "../app/api/emergency/incidents/[id]/route";
import { POST as createBookingHandler } from "../app/api/bookings/route";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const supabaseSecret = process.env.SUPABASE_SECRET_KEY || "";
const dbClient = createClient(supabaseUrl, supabaseSecret);

async function runTask2Verification() {
  console.log("==================================================");
  console.log("KAUSHALYA SETU EMERGENCY SERVICES — TASK 2");
  console.log("DETERMINISTIC EMERGENCY RESPONSE MATRIX VERIFICATION");
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
  // SETUP: Authenticate real test customer
  // -------------------------------------------------------------
  console.log("[SETUP] Authenticating test customer...");
  const anonClient = createClient(supabaseUrl, supabaseAnon);
  const { data: authCustomer, error: errAuth } = await anonClient.auth.signInWithPassword({
    email: "customer@example.com",
    password: "Password123!",
  });
  if (errAuth || !authCustomer.session) {
    throw new Error("Failed to authenticate test customer: " + errAuth?.message);
  }
  const customerToken = authCustomer.session.access_token;
  const customerId = authCustomer.user.id;
  console.log(`  Authenticated Customer: ${customerId} (${authCustomer.user.email})\n`);

  // -------------------------------------------------------------
  // 1. PREDEFINED EMERGENCY TYPES EXIST ACROSS ALL 5 WORKFLOW CATEGORIES
  // -------------------------------------------------------------
  console.log("--------------------------------------------------");
  console.log("1. PREDEFINED EMERGENCY TYPES EXIST");
  console.log("--------------------------------------------------");
  const allMatrix = await EmergencyResponseMatrixRepository.listAll();
  assert(allMatrix.length >= 14, `Predefined matrix contains at least 14 types (found ${allMatrix.length})`);

  const expectedCategories = [
    "Water Infrastructure",
    "Electrical Systems",
    "Gas & Fire Hazard",
    "Structural & Security",
    "Sanitation & Biohazard",
  ];

  for (const cat of expectedCategories) {
    const matching = allMatrix.filter((m) => m.category_name.toLowerCase() === cat.toLowerCase());
    assert(matching.length > 0, `Category "${cat}" exists and has ${matching.length} defined emergency types`);
  }

  // -------------------------------------------------------------
  // 2. EACH TYPE HAS A VALID RESPONSE CONFIGURATION
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("2. EACH TYPE HAS A VALID RESPONSE CONFIGURATION");
  console.log("--------------------------------------------------");
  for (const entry of allMatrix) {
    assert(Boolean(entry.matrix_code && entry.matrix_code.length > 3), `Valid stable matrix_code: ${entry.matrix_code}`);
    assert(["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(entry.severity), `Valid severity for ${entry.matrix_code}: ${entry.severity}`);
    assert(entry.recommended_worker_count >= 1, `Recommended worker count >= 1 for ${entry.matrix_code} (got ${entry.recommended_worker_count})`);
    assert(Array.isArray(entry.worker_roles) && entry.worker_roles.length > 0, `Worker roles defined for ${entry.matrix_code}`);
    assert(Array.isArray(entry.initial_tasks) && entry.initial_tasks.length > 0, `Initial response tasks defined for ${entry.matrix_code}`);
    assert(typeof entry.team_lead_required === "boolean", `Team lead requirement boolean for ${entry.matrix_code}`);
    assert(typeof entry.federation_involvement_required === "boolean", `Federation involvement boolean for ${entry.matrix_code}`);
  }

  // -------------------------------------------------------------
  // 3 & 4 & 5. CONCRETE WORKFLOW REFERENCE: WATER TANK BURST
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("3, 4, 5. CONCRETE REFERENCE: SOCIETY WATER TANK BURST");
  console.log("--------------------------------------------------");
  const waterTankBurst = await EmergencyResponseMatrixRepository.findByCode("wat-tank-burst");
  assert(waterTankBurst !== null, "Found entry for code 'wat-tank-burst'");
  if (waterTankBurst) {
    assert(waterTankBurst.emergency_type === "Society Water Tank Burst", "Emergency type name matches 'Society Water Tank Burst'");
    assert(waterTankBurst.severity === "CRITICAL", `Severity is CRITICAL (got ${waterTankBurst.severity})`);

    // Required Skills verification:
    // Plumbing, Water infrastructure, Pump operation, Electrical safety
    const skills = waterTankBurst.required_skills;
    console.log("  Required skills:", skills);
    assert(skills.includes("Plumbing"), "Water Tank Burst requires Plumbing skill");
    assert(skills.includes("Water infrastructure"), "Water Tank Burst requires Water infrastructure skill");
    assert(skills.includes("Pump operation"), "Water Tank Burst requires Pump operation skill");
    assert(skills.includes("Electrical safety"), "Water Tank Burst requires Electrical safety skill");

    // Recommended Team verification:
    // 1 Team Lead, 3 Plumbers, 1 Water Technician, 1 Electrician (Total 6)
    assert(waterTankBurst.recommended_worker_count === 6, `Recommended worker count is 6 (got ${waterTankBurst.recommended_worker_count})`);
    assert(waterTankBurst.team_lead_required === true, "Team Lead requirement is true");

    const roles = waterTankBurst.worker_roles;
    const teamLeadRole = roles.find((r) => r.role === "Team Lead");
    const plumberRole = roles.find((r) => r.role === "Plumber");
    const waterTechRole = roles.find((r) => r.role === "Water Technician");
    const electricianRole = roles.find((r) => r.role === "Electrician");

    assert(teamLeadRole !== undefined && teamLeadRole.count === 1, "Team Lead role count is 1");
    assert(plumberRole !== undefined && plumberRole.count === 3, "Plumber role count is 3");
    assert(waterTechRole !== undefined && waterTechRole.count === 1, "Water Technician role count is 1");
    assert(electricianRole !== undefined && electricianRole.count === 1, "Electrician role count is 1");

    // Federation Involvement verification: Required
    assert(waterTankBurst.federation_involvement_required === true, "Federation involvement is strictly REQUIRED (true)");

    // Initial tasks verification
    assert(waterTankBurst.initial_tasks.length >= 3, `Initial response tasks count >= 3 (got ${waterTankBurst.initial_tasks.length})`);
    const valveTask = waterTankBurst.initial_tasks.find((t) => t.title.toLowerCase().includes("riser") || t.title.toLowerCase().includes("valve"));
    assert(valveTask !== undefined, "Initial tasks include valve/riser isolation");
  }

  // -------------------------------------------------------------
  // 6. DETERMINISTIC LOOKUP WORKS (CODE & TYPE DISPLAY NAME)
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("6. DETERMINISTIC LOOKUP (STABLE CODE & DISPLAY NAME)");
  console.log("--------------------------------------------------");
  {
    // Lookup by stable code
    const byCode = await EmergencyResponseMatrixRepository.findByCode("wat-tank-burst");
    // Lookup by type display name
    const byName = await EmergencyResponseMatrixRepository.findByEmergencyType("Society Water Tank Burst");
    // Lookup case-insensitively
    const byCaseInsensitive = await EmergencyResponseMatrixRepository.findByEmergencyType("society water tank burst");

    assert(byCode !== null && byName !== null, "Both lookups succeed");
    assert(Boolean(byCode && byName && byCode.id === byName.id), "Lookup by code and lookup by display name yield the identical matrix entity ID");
    assert(Boolean(byCode && byCaseInsensitive && byCode.matrix_code === byCaseInsensitive.matrix_code), "Case-insensitive lookup yields identical matrix code");

    // HTTP Endpoint Lookup
    const reqHttp = new NextRequest("http://localhost:3000/api/emergency/matrix?code=wat-tank-burst");
    const resHttp = await getMatrixHandler(reqHttp);
    const bodyHttp = await resHttp.json();
    assert(resHttp.status === 200, "GET /api/emergency/matrix?code=wat-tank-burst returns 200");
    assert(bodyHttp.matrix.matrix_code === "wat-tank-burst", "API returns matching matrix record");
    assert(bodyHttp.matrix.recommended_worker_count === 6, "API returns correct team count");
  }

  // -------------------------------------------------------------
  // 7. INVALID / UNKNOWN EMERGENCY TYPE IS REJECTED
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("7. INVALID / UNKNOWN EMERGENCY TYPE IS REJECTED");
  console.log("--------------------------------------------------");
  {
    // 1. Direct repository check
    const invalidResult = await EmergencyResponseMatrixRepository.findByEmergencyType("NonExistentEmergencyType");
    assert(invalidResult === null, "Unknown emergency type returns null from repository");

    // 2. Incident creation with invalid type
    const reqInvalid = new NextRequest("http://localhost:3000/api/emergency/incidents", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        categoryName: "Unknown",
        emergencyType: "Alien UFO Laser Strike",
        location: "Vastrapur Lake, Ahmedabad",
        description: "Laser beam striking building roof.",
      }),
    });

    const resInvalid = await createIncidentHandler(reqInvalid);
    assert(resInvalid.status === 400, `Unknown emergency type rejected with 400 Bad Request (got ${resInvalid.status})`);
    const bodyInvalid = await resInvalid.json();
    assert(bodyInvalid.error.includes("Must match predefined Emergency Response Matrix"), "Error message specifies requirement to match matrix");
  }

  // -------------------------------------------------------------
  // 8. CUSTOMERS CANNOT MODIFY MATRIX CONFIGURATION (SECURITY / RLS)
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("8. CUSTOMERS CANNOT MODIFY MATRIX CONFIGURATION");
  console.log("--------------------------------------------------");
  {
    // 1. Direct repository update rejection for CUSTOMER role
    const directUpdate = await EmergencyResponseMatrixRepository.updateMatrixEntry(
      "wat-tank-burst",
      { recommended_worker_count: 1 },
      "CUSTOMER"
    );
    assert(directUpdate.success === false, "Customer role cannot directly update matrix entry in repository");
    assert(Boolean(directUpdate.error?.includes("strictly forbidden")), "Rejection message prevents customer tampering");

    // 2. API PATCH request with Customer token
    const reqPatch = new NextRequest("http://localhost:3000/api/emergency/matrix", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        code: "wat-tank-burst",
        recommended_worker_count: 1,
      }),
    });
    const resPatch = await patchMatrixHandler(reqPatch);
    assert(resPatch.status === 403, `Customer PATCH to /api/emergency/matrix rejected with 403 Forbidden (got ${resPatch.status})`);

    // 3. API POST request with Customer token
    const reqPost = new NextRequest("http://localhost:3000/api/emergency/matrix", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        matrix_code: "hack-type",
        emergency_type: "Hacked Emergency Type",
      }),
    });
    const resPost = await postMatrixHandler(reqPost);
    assert(resPost.status === 403, `Customer POST to /api/emergency/matrix rejected with 403 Forbidden (got ${resPost.status})`);

    // Verify matrix record was NOT tampered with
    const verifyOriginal = await EmergencyResponseMatrixRepository.findByCode("wat-tank-burst");
    assert(Boolean(verifyOriginal && verifyOriginal.recommended_worker_count === 6), `Water Tank Burst worker count remains protected at 6 (got ${verifyOriginal?.recommended_worker_count})`);
  }

  // -------------------------------------------------------------
  // 9. TASK 1 EMERGENCY INCIDENT CREATION STILL WORKS & LINKS TO MATRIX
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("9. TASK 1 INCIDENT CREATION STILL WORKS & LINKS MATRIX");
  console.log("--------------------------------------------------");
  {
    const reqIncident = new NextRequest("http://localhost:3000/api/emergency/incidents", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        categoryName: "Water Infrastructure",
        emergencyType: "Society Water Tank Burst",
        location: "Terrace Block B, Vraj Vihar, Satellite, Ahmedabad",
        description: "10,000L rooftop water tank cracked vertically. Severe water flood entering elevator shaft.",
        approxPeopleAffected: 40,
        immediateDanger: true,
        dangerDetails: "Water approaching main lift motor room wiring.",
      }),
    });

    const resIncident = await createIncidentHandler(reqIncident);
    const bodyIncident = await resIncident.json();

    assert(resIncident.status === 201, `Incident created with 201 Created (got ${resIncident.status})`);
    assert(Boolean(bodyIncident.incident?.id), "Incident ID present");
    assert(bodyIncident.incident.responseMatrixCode === "wat-tank-burst", `Incident deterministically linked to matrix code: ${bodyIncident.incident.responseMatrixCode}`);
    assert(Boolean(bodyIncident.responseMatrix), "Response matrix structure returned with created incident");
    assert(bodyIncident.responseMatrix.recommended_worker_count === 6, "Response matrix in incident specifies 6 workers");
    assert(bodyIncident.responseMatrix.team_lead_required === true, "Response matrix requires Team Lead");
    assert(bodyIncident.responseMatrix.federation_involvement_required === true, "Response matrix requires Federation Involvement");

    // Also verify GET /api/emergency/incidents/[id] returns the linked responseMatrix
    const reqGetDetail = new NextRequest(`http://localhost:3000/api/emergency/incidents/${bodyIncident.incident.id}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const resGetDetail = await getIncidentDetailHandler(reqGetDetail, { params: { id: bodyIncident.incident.id } });
    const bodyGetDetail = await resGetDetail.json();
    assert(resGetDetail.status === 200, "Incident detail retrieval succeeded (200)");
    assert(bodyGetDetail.incident.responseMatrixCode === "wat-tank-burst", "Incident detail includes responseMatrixCode");
    assert(Boolean(bodyGetDetail.responseMatrix), "Incident detail includes resolved responseMatrix");
    assert(bodyGetDetail.responseMatrix.matrix_code === "wat-tank-burst", "Resolved response matrix matches wat-tank-burst");
  }

  // -------------------------------------------------------------
  // 10. NORMAL BOOKING FLOW STILL WORKS (REGRESSION TEST)
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("10. NORMAL BOOKING FLOW STILL WORKS (REGRESSION)");
  console.log("--------------------------------------------------");
  {
    const normalReq = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        action: "create",
        customerId: customerId,
        workerId: "59eca4ff-a589-4363-ad76-24a4ff5b6e2e",
        serviceId: "a510e2c8-5ee9-4b01-abfc-a2a101ea729e",
        federationId: "b765df3b-c418-4a15-b79f-3cbc09e475dc",
        addressId: "3f50baf2-d986-4bec-88c2-dfa901d78a0b",
        totalAmount: 450,
        problemDescription: "Standard scheduled plumbing inspection",
      }),
    });

    const bookingRes = await createBookingHandler(normalReq);
    const bookingBody = await bookingRes.json();

    assert(bookingRes.status === 200, `Normal booking creation returned 200 OK (got ${bookingRes.status})`);
    assert(Boolean(bookingBody.booking?.id), "Normal booking ID generated");
    assert(bookingBody.booking?.status === "REQUEST_SENT", `Normal booking initial status is REQUEST_SENT (got ${bookingBody.booking?.status})`);
    assert(bookingBody.booking?.bookingNumber.startsWith("BK-"), `Normal booking number has BK- prefix: ${bookingBody.booking?.bookingNumber}`);
    console.log(`  ℹ️ Confirmed: Normal booking ${bookingBody.booking?.bookingNumber} unaffected by Task 2.`);
  }

  console.log("\n==================================================");
  console.log(`TASK 2 VERIFICATION SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log("==================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTask2Verification().catch((err) => {
  console.error("\n💥 FATAL VERIFICATION ERROR:", err);
  process.exit(1);
});
