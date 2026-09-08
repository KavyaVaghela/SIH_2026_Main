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

async function testAsWorker() {
  const supabase = createClient(url, anonKey);

  console.log("Signing in as worker@example.com...");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'worker@example.com',
    password: 'Password123!'
  });

  if (authErr || !authData.user) {
    console.error("Auth Error:", authErr?.message);
    return;
  }

  console.log("Authenticated Worker Profile ID:", authData.user.id);

  // Get Worker ID for this profile
  const { data: wRec } = await supabase.from('workers').select('id').eq('profile_id', authData.user.id).single();
  console.log("Worker Table ID (workers.id):", wRec?.id);

  // Attempt query on bookings table as authenticated WORKER
  console.log("\nQuerying bookings as authenticated WORKER...");
  const { data: bookings, error: qErr } = await supabase
    .from('bookings')
    .select(`
      *,
      customer:profiles!customer_id (full_name, phone, email),
      services (title, service_categories (name)),
      addresses (address_line1, city),
      federations (name)
    `)
    .eq('worker_id', wRec?.id);

  if (qErr) {
    console.error("QUERY FAILED WITH ERROR:", qErr);
  } else {
    console.log(`QUERY SUCCESSFUL! Found ${bookings.length} bookings for Ravi Patel:`);
    for (const b of bookings as any[]) {
      console.log(`- Booking ${b.booking_number} (${b.status}): Customer=${b.customer?.full_name}, Service=${b.services?.title}, Area=${b.addresses ? b.addresses.address_line1 + ', ' + b.addresses.city : 'N/A'}`);
    }
  }
}

testAsWorker().catch(console.error);
