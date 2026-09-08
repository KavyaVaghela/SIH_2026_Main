import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars: Record<string, string> = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    envVars[key] = value.trim();
  }
});

const url = envVars['NEXT_PUBLIC_SUPABASE_URL'] || '';
const key = envVars['SUPABASE_SECRET_KEY'] || envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || '';

console.log("Supabase URL:", url);
console.log("Key length:", key.length);

const supabase = createClient(url, key, {
  auth: { persistSession: false }
});

async function testQuery() {
  console.log("Querying bookings table with joins...");
  const { data, error } = await supabase.from('bookings').select(`
    *,
    customer:profiles!customer_id (full_name, phone, email),
    services (title, service_categories (name)),
    addresses (address_line1, city),
    federations (name)
  `);

  if (error) {
    console.error("Query Error:", error);
  } else {
    console.log("Bookings count:", data ? data.length : 0);
    console.log("Bookings data:", JSON.stringify(data, null, 2));
  }
}

testQuery();
