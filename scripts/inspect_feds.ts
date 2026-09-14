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
  const { data: feds, error } = await supabase.from('federations').select('*');
  if (error) {
    console.error('Error fetching federations:', error);
    return;
  }
  console.log('Total federations:', feds.length);
  for (const f of feds) {
    console.log(`- ID: ${f.id} | Name: "${f.name}" | Code: ${f.code} | City: ${f.city}`);
  }

  const badId = '648a2e74-3dee-4111-a427-000c104db73e';
  const target = feds.find(f => f.id === badId || f.name.toLowerCase().includes('gota') || f.name.toLowerCase().includes('sluts'));
  if (target) {
    console.log('\nFound bad federation:', target);
    // check auth / profiles for contact email
    const { data: profs } = await supabase.from('profiles').select('*').eq('email', target.contact_email);
    console.log('Profiles with contact_email:', profs);
    // check dependent records
    const tables = ['workers', 'bookings', 'invoices', 'welfare_records', 'project_requests'];
    for (const t of tables) {
      const { data, count, error: err } = await supabase.from(t).select('*', { count: 'exact' }).eq('federation_id', target.id);
      console.log(`Dependent records in ${t}: count = ${count}, data length = ${data?.length}`);
      if (data && data.length > 0) {
        console.log(`Sample records in ${t}:`, JSON.stringify(data.slice(0, 3)));
      }
    }

  } else {
    console.log('\nBad federation not found by ID or name in federations table');
  }
}

run().catch(console.error);
