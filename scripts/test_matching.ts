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

console.log("Testing Matching Query on Supabase URL:", url);

const supabase = createClient(url, anonKey, {
  auth: { persistSession: false }
});

async function testMatching() {
  // Query active verified workers for Plumbing
  const { data: workers, error } = await supabase
    .from('workers')
    .select(`
      id,
      profession,
      hourly_rate,
      experience_years,
      account_status,
      verification_status,
      availability_status,
      profiles!inner (
        full_name,
        email,
        role
      ),
      federations (
        name,
        city
      ),
      worker_skills!inner (
        skills!inner (
          name
        )
      )
    `)
    .eq('account_status', 'ACTIVE')
    .eq('verification_status', 'verified')
    .eq('availability_status', 'AVAILABLE');

  if (error) {
    console.error("Matching Query Error:", error.message);
  } else {
    console.log(`Found ${workers.length} active verified workers via RLS/anon client:`);
    for (const w of workers as any[]) {
      console.log(`- ${w.profiles?.full_name} (${w.profession}): ${w.federations?.name}, Skills: ${w.worker_skills?.map((ws: any) => ws.skills?.name).join(', ')}`);
    }
  }
}

testMatching().catch(console.error);
