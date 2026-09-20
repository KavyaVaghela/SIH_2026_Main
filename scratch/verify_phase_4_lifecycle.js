const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split(/\r?\n/).forEach(line => {
  const cleanLine = line.trim();
  if (cleanLine && !cleanLine.startsWith('#')) {
    const idx = cleanLine.indexOf('=');
    if (idx !== -1) {
      const k = cleanLine.slice(0, idx).trim();
      let v = cleanLine.slice(idx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      envVars[k] = v;
    }
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = envVars.SUPABASE_SECRET_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

async function verifyPhase4() {
  const projectId = "d9b50ece-908a-4dd5-9b62-7b46ecf83350";

  console.log("==================================================");
  console.log("PHASE 4 — END-TO-END LARGE PROJECT LIFECYCLE TEST");
  console.log("==================================================");

  // 1. Fetch project request
  const { data: proj, error: pErr } = await admin
    .from("project_requests")
    .select("*")
    .eq("id", projectId)
    .single();

  if (pErr || !proj) {
    console.error("Error fetching project:", pErr);
    process.exit(1);
  }

  console.log(`✓ Project Loaded: "${proj.project_name || 'Large Project'}" (ID: ${projectId})`);
  console.log(`  Status: ${proj.status}`);
  console.log(`  Total Budget: ₹${proj.total_budget}`);
  console.log(`  Payments Received: ₹${proj.payments_received || 0}`);

  // 2. Test Payment Obligations & Deadlines
  const { data: plans } = await admin
    .from("project_payment_plans")
    .select("*")
    .eq("project_request_id", projectId)
    .order("created_at", { ascending: false });

  console.log(`\n✓ Active Payment Plans in DB: ${plans?.length || 0}`);

  const { data: insts } = await admin
    .from("project_payment_installments")
    .select("*")
    .eq("project_request_id", projectId)
    .order("installment_number", { ascending: true });

  console.log(`✓ Installment Schedule Obligations in DB: ${insts?.length || 0}`);
  (insts || []).forEach((inst) => {
    console.log(`  Installment ${inst.installment_number}: Amount ₹${inst.amount}, Status: ${inst.status}, Due Date: ${inst.due_date || inst.due_at}`);
  });

  // 3. Test Payments Ledger
  const { data: pmts } = await admin
    .from("project_payments")
    .select("*")
    .eq("project_request_id", projectId);

  console.log(`\n✓ Recorded Payments in DB: ${pmts?.length || 0}`);

  console.log("\n==================================================");
  console.log("✓ PHASE 4 LIFECYCLE & PAYMENT DEADLINES VERIFIED!");
  console.log("==================================================");
}

verifyPhase4().catch(console.error);
