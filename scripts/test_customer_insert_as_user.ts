import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valParts] = trimmed.split('=');
        process.env[key.trim()] = valParts.join('=').trim();
      }
    }
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

async function testAsCustomer() {
  const supabase = createClient(url, anonKey);

  console.log("Signing in as customer@example.com...");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'customer@example.com',
    password: 'Password123!'
  });

  if (authErr || !authData.user) {
    console.error("Auth Error:", authErr?.message);
    return;
  }

  console.log("Authenticated User ID:", authData.user.id);

  // 1. Get Ravi Patel worker ID
  const { data: worker } = await supabase.from('workers').select('id').limit(1).single();
  console.log("Worker ID:", worker?.id);

  // 2. Get Service ID
  const { data: service } = await supabase.from('services').select('id').limit(1).single();
  console.log("Service ID:", service?.id);

  // 3. Get Federation ID
  const { data: federation } = await supabase.from('federations').select('id').limit(1).single();
  console.log("Federation ID:", federation?.id);

  // 4. Get Address ID for this customer
  const { data: address } = await supabase.from('addresses').select('id').eq('profile_id', authData.user.id).limit(1).single();
  console.log("Address ID:", address?.id);

  // Attempt insert into bookings table as authenticated CUSTOMER
  console.log("\nAttempting insert into public.bookings as authenticated customer...");
  const { data: insData, error: insErr } = await supabase.from('bookings').insert({
    booking_number: `BK-REAL-${Date.now().toString().slice(-4)}`,
    customer_id: authData.user.id,
    worker_id: worker?.id,
    service_id: service?.id,
    federation_id: federation?.id,
    address_id: address?.id,
    status: 'REQUEST_SENT',
    problem_description: 'Emergency tap leak repair requested by Prince Patel via browser simulation',
    scheduled_start_at: new Date().toISOString(),
    scheduled_end_at: new Date(Date.now() + 3600000).toISOString(),
    total_amount: 350.00,
    platform_fee: 17.50,
    worker_earnings: 332.50
  }).select().single();

  if (insErr) {
    console.error("INSERT FAILED WITH RLS ERROR:", insErr);
  } else {
    console.log("INSERT SUCCESSFUL! Booking ID:", insData.id);
  }
}

testAsCustomer().catch(console.error);
