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

async function main() {
  const badId = '648a2e74-3dee-4111-a427-000c104db73e';
  console.log(`Checking federation with ID: ${badId}`);

  const { data: fed, error: fetchErr } = await supabase
    .from('federations')
    .select('*')
    .eq('id', badId)
    .maybeSingle();

  if (fetchErr) {
    console.error('Error fetching federation:', fetchErr);
    process.exit(1);
  }

  if (!fed) {
    console.log('Federation with ID does not exist or has already been deleted.');
  } else {
    console.log('Found federation:', fed.name, `(${fed.id})`);

    // Verify dependencies
    const tables = ['workers', 'bookings', 'invoices', 'welfare_records', 'project_requests'];
    for (const t of tables) {
      const { count } = await supabase.from(t).select('*', { count: 'exact', head: true }).eq('federation_id', badId);
      if (count && count > 0) {
        throw new Error(`Cannot delete: federation has ${count} dependent records in ${t}!`);
      }
    }

    // Delete federation safely
    const { error: delErr } = await supabase.from('federations').delete().eq('id', badId);
    if (delErr) {
      console.error('Failed to delete federation:', delErr);
      process.exit(1);
    }
    console.log('✓ Successfully deleted federation:', badId);
  }

  // Also check for any remaining federations with "sluts" or "gota skilled" in name
  const { data: others } = await supabase
    .from('federations')
    .select('id, name')
    .or('name.ilike.%sluts%,name.ilike.%gota skilled%');

  if (others && others.length > 0) {
    console.log('Found additional matching federations to clean:', others);
    for (const o of others) {
      await supabase.from('federations').delete().eq('id', o.id);
      console.log('✓ Cleaned:', o.name, o.id);
    }
  } else {
    console.log('✓ No remaining bad federations found in database.');
  }
}

main().catch(console.error);
