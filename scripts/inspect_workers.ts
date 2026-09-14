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

const supabase = createClient(url, key, {
  auth: { persistSession: false }
});

async function run() {
  const { data: workers, error } = await supabase.from('workers').select(`
    id,
    profile_id,
    federation_id,
    verification_status,
    account_status,
    availability_status,
    profession,
    created_at,
    profiles ( full_name, email, phone ),
    federations ( name, code )
  `);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total workers in DB: ${workers.length}`);
  for (const w of workers) {
    console.log(`- ID: ${w.id} | Name: ${(w as any).profiles?.full_name} | Fed: ${(w as any).federations?.name} (${w.federation_id}) | Verif: ${w.verification_status} | Account: ${w.account_status} | Avail: ${w.availability_status}`);
  }
}

run().catch(console.error);
