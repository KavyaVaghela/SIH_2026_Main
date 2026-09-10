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
const key = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

console.log("Connecting to Supabase URL:", url);

const supabase = createClient(url, key, {
  auth: { persistSession: false }
});

async function checkCounts() {
  const tables = [
    'profiles',
    'federations',
    'service_categories',
    'services',
    'skills',
    'workers',
    'worker_skills',
    'worker_availability',
    'addresses'
  ];

  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`Table ${table} ERROR:`, error.message);
    } else {
      console.log(`Table ${table} count:`, count);
    }
  }

  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
  if (usersErr) {
    console.log("Auth users list ERROR:", usersErr.message);
  } else {
    console.log("Auth users count:", usersData.users ? usersData.users.length : 0);
  }
}

checkCounts().catch(console.error);
