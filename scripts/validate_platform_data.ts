import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...valParts] = trimmed.split("=");
        process.env[key.trim()] = valParts.join("=").trim().replace(/^['"]|['"]$/g, '');
      }
    }
  }
}
loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const PRINCE_PROFILE_ID = "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";
const RAVI_PROFILE_ID = "70fbdb46-120f-459e-a616-67b4f676f5d0";
const RAVI_WORKER_ID = "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";

async function main() {
  console.log('====================================================');
  console.log('🔍 KAUSHALYA SETU - PLATFORM DATA VALIDATION AUDIT');
  console.log('====================================================\n');

  let failureCount = 0;
  function assert(condition: boolean, passMsg: string, failMsg: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${passMsg}`);
    } else {
      console.error(`  ❌ [FAIL] ${failMsg}`);
      failureCount++;
    }
  }

  // 1. Table Counts
  console.log('1. Fetching Table Entity Counts...');
  const [
    { count: federationCount },
    { count: profileCount },
    { count: customerCount },
    { count: workerCount },
    { count: bookingCount },
    { count: invoiceCount },
    { count: paymentCount },
    { count: reviewCount },
    { count: complaintCount },
    { count: welfareCount },
    { count: insuranceCount },
    { count: jobRequestCount },
    { count: workerEstimateCount },
    { count: emergencyCount },
    { count: projectCount },
  ] = await Promise.all([
    supabase.from('federations').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'CUSTOMER'),
    supabase.from('workers').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('invoices').select('*', { count: 'exact', head: true }),
    supabase.from('payments').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('complaints').select('*', { count: 'exact', head: true }),
    supabase.from('welfare_records').select('*', { count: 'exact', head: true }),
    supabase.from('insurance_records').select('*', { count: 'exact', head: true }),
    supabase.from('job_requests').select('*', { count: 'exact', head: true }),
    supabase.from('worker_estimates').select('*', { count: 'exact', head: true }),
    supabase.from('emergency_incidents').select('*', { count: 'exact', head: true }),
    supabase.from('project_requests').select('*', { count: 'exact', head: true }),
  ]);

  console.log(`  - Federations:       ${federationCount}`);
  console.log(`  - Total Profiles:    ${profileCount} (Customers: ${customerCount})`);
  console.log(`  - Active Workers:    ${workerCount}`);
  console.log(`  - Total Bookings:    ${bookingCount}`);
  console.log(`  - Total Invoices:    ${invoiceCount}`);
  console.log(`  - Total Payments:    ${paymentCount}`);
  console.log(`  - Customer Reviews:  ${reviewCount}`);
  console.log(`  - Complaints:        ${complaintCount}`);
  console.log(`  - Welfare Records:   ${welfareCount}`);
  console.log(`  - Insurance Records: ${insuranceCount}`);
  console.log(`  - Job Requests:      ${jobRequestCount}`);
  console.log(`  - Worker Estimates:  ${workerEstimateCount}`);
  console.log(`  - Emergencies:       ${emergencyCount}`);
  console.log(`  - Project Requests:  ${projectCount}\n`);

  assert((federationCount || 0) >= 5, `Federations >= 5 (${federationCount})`, `Expected >= 5 federations`);
  assert((customerCount || 0) >= 20, `Customer Profiles >= 20 (${customerCount})`, `Expected >= 20 customers`);
  assert((workerCount || 0) >= 60, `Active Workers >= 60 (${workerCount})`, `Expected >= 60 workers`);
  assert((bookingCount || 0) >= 200, `Bookings >= 200 (${bookingCount})`, `Expected >= 200 bookings`);
  assert((invoiceCount || 0) >= 150, `Invoices >= 150 (${invoiceCount})`, `Expected >= 150 invoices`);
  assert((paymentCount || 0) >= 150, `Payments >= 150 (${paymentCount})`, `Expected >= 150 payments`);
  assert((reviewCount || 0) >= 100, `Reviews >= 100 (${reviewCount})`, `Expected >= 100 reviews`);
  assert((jobRequestCount || 0) >= 30, `Job Requests >= 30 (${jobRequestCount})`, `Expected >= 30 job requests`);

  // 2. Booking Lifecycle Integrity
  console.log('\n2. Verifying Booking Lifecycle & Financial Integrity...');
  const { data: completedBookings } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('status', 'BOOKING_COMPLETED');

  const completedIds = (completedBookings || []).map(b => b.id);
  const { data: allInvoices } = await supabase
    .from('invoices')
    .select('id, booking_id, status, subtotal, tax_amount, total_amount, platform_fee');

  const invoiceBookingIds = new Set((allInvoices || []).map(i => i.booking_id));
  const completedWithoutInvoice = completedIds.filter(id => !invoiceBookingIds.has(id));

  assert(
    completedWithoutInvoice.length === 0,
    `100% of Completed Bookings have an Invoice (${completedIds.length}/${completedIds.length})`,
    `Found ${completedWithoutInvoice.length} completed bookings missing invoices!`
  );

  let mathErrors = 0;
  for (const inv of allInvoices || []) {
    const calcTotal = Math.round((Number(inv.subtotal) + Number(inv.tax_amount)) * 100) / 100;
    if (Math.abs(calcTotal - Number(inv.total_amount)) > 1) {
      mathErrors++;
    }
  }
  assert(mathErrors === 0, `All sampled invoices have mathematically consistent totals (subtotal + tax = total)`, `Found ${mathErrors} invoices with math discrepancy`);

  // 3. Protected Test Accounts
  console.log('\n3. Verifying Protected Test Accounts...');
  const { data: raviWorker } = await supabase
    .from('workers')
    .select('*, profile:profiles(*)')
    .eq('id', RAVI_WORKER_ID)
    .single();

  assert(!!raviWorker, `Ravi Patel worker record intact`, `Ravi Patel worker record missing!`);
  
  const { count: raviBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('worker_id', RAVI_WORKER_ID);

  const { count: raviReviews } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('worker_id', RAVI_WORKER_ID);

  const { count: raviWelfare } = await supabase
    .from('welfare_records')
    .select('*', { count: 'exact', head: true })
    .eq('worker_id', RAVI_WORKER_ID);

  const { count: raviInsurance } = await supabase
    .from('insurance_records')
    .select('*', { count: 'exact', head: true })
    .eq('worker_id', RAVI_WORKER_ID);

  const { count: raviComplaints } = await supabase
    .from('complaints')
    .select('*', { count: 'exact', head: true })
    .eq('target_profile_id', RAVI_PROFILE_ID);

  console.log(`  - Ravi Patel Bookings:   ${raviBookings}`);
  console.log(`  - Ravi Patel Reviews:    ${raviReviews}`);
  console.log(`  - Ravi Patel Welfare:    ${raviWelfare}`);
  console.log(`  - Ravi Patel Insurance:  ${raviInsurance}`);
  console.log(`  - Ravi Patel Complaints: ${raviComplaints}`);

  assert((raviBookings || 0) >= 15 && (raviBookings || 0) <= 40, `Ravi Patel has realistic booking count (${raviBookings})`, `Ravi Patel booking count out of expected bounds: ${raviBookings}`);
  assert((raviComplaints || 0) <= 2, `Ravi Patel complaints are realistic/clean (${raviComplaints})`, `Ravi Patel has too many complaints (${raviComplaints})`);
  assert((raviWelfare || 0) >= 1, `Ravi Patel has welfare records (${raviWelfare})`, `Ravi Patel missing welfare records`);
  assert((raviInsurance || 0) >= 1, `Ravi Patel has insurance records (${raviInsurance})`, `Ravi Patel missing insurance records`);

  const { count: princeBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', PRINCE_PROFILE_ID);

  const { count: princeComplaints } = await supabase
    .from('complaints')
    .select('*', { count: 'exact', head: true })
    .eq('raised_by', PRINCE_PROFILE_ID);

  console.log(`  - Prince Prajapati Bookings:   ${princeBookings}`);
  console.log(`  - Prince Prajapati Complaints: ${princeComplaints}`);

  assert((princeBookings || 0) >= 12 && (princeBookings || 0) <= 25, `Prince Prajapati has realistic booking count (${princeBookings})`, `Prince Prajapati booking count out of bounds: ${princeBookings}`);
  assert((princeComplaints || 0) <= 2, `Prince Prajapati complaints cleared of test spam (${princeComplaints})`, `Prince Prajapati still has excess complaints: ${princeComplaints}`);

  // 4. Workforce Utilization & AI Demand Signals
  console.log('\n4. Auditing Workforce Utilization & AI Signals...');
  const { data: allWorkers } = await supabase
    .from('workers')
    .select('id, profession, availability_status, account_status, verification_status, federation_id');

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentCompleted } = await supabase
    .from('bookings')
    .select('worker_id, actual_start_at, actual_end_at, created_at')
    .eq('status', 'BOOKING_COMPLETED')
    .gte('created_at', fourteenDaysAgo);

  const workerHours: Record<string, number> = {};
  for (const b of recentCompleted || []) {
    if (!b.worker_id) continue;
    let hours = 2.0;
    if (b.actual_start_at && b.actual_end_at) {
      const diffMs = new Date(b.actual_end_at).getTime() - new Date(b.actual_start_at).getTime();
      hours = Math.max(0.5, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10);
    }
    workerHours[b.worker_id] = (workerHours[b.worker_id] || 0) + hours;
  }

  let underUtilizedCount = 0;
  let optimalCount = 0;
  let highCount = 0;
  let unavailableCount = 0;

  for (const w of allWorkers || []) {
    if (w.availability_status !== 'AVAILABLE') {
      unavailableCount++;
      continue;
    }
    const hrs = workerHours[w.id] || 0;
    const utilRatio = hrs / 80;
    if (utilRatio < 0.40) underUtilizedCount++;
    else if (utilRatio <= 0.75) optimalCount++;
    else highCount++;
  }

  console.log(`  - Under-utilized Workers (<40% capacity): ${underUtilizedCount}`);
  console.log(`  - Optimal Workers (40-75% capacity):      ${optimalCount}`);
  console.log(`  - High Utilization (>75% capacity):       ${highCount}`);
  console.log(`  - Unavailable / Off-duty Workers:         ${unavailableCount}`);

  assert(underUtilizedCount >= 15, `Under-utilized worker pool healthy (>=15: found ${underUtilizedCount})`, `Too few underutilized workers: ${underUtilizedCount}`);
  assert(optimalCount >= 20, `Optimal worker pool healthy (>=20: found ${optimalCount})`, `Too few optimal workers: ${optimalCount}`);

  // 5. Demand Gap Check (Ahmedabad Plumbing)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: plumbingJobReqs } = await supabase
    .from('job_requests')
    .select('*, service:services(title, service_categories(name))')
    .gte('created_at', thirtyDaysAgo);

  const plumbingCount = (plumbingJobReqs || []).filter(jr => {
    const title = (jr.service?.title || '').toLowerCase();
    const cat = (jr.service?.service_categories?.name || '').toLowerCase();
    return title.includes('plumb') || cat.includes('plumb');
  }).length;

  console.log(`  - 30-day Plumbing Job Requests: ${plumbingCount}`);
  assert(plumbingCount >= 15, `Ahmedabad Plumbing 30-day demand pressure healthy (>=15: found ${plumbingCount})`, `Too few plumbing job requests: ${plumbingCount}`);

  console.log('\n====================================================');
  if (failureCount === 0) {
    console.log('🎉 ALL DATA INTEGRITY AUDIT CHECKS PASSED PERFECTLY!');
  } else {
    console.error(`⚠️  AUDIT COMPLETED WITH ${failureCount} FAILURE(S)`);
    process.exit(1);
  }
  console.log('====================================================\n');
}

main().catch(err => {
  console.error('Validation script encountered error:', err);
  process.exit(1);
});
