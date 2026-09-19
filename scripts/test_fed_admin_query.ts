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

console.log('ENV KEYS:', Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('DATABASE') || k.includes('POSTGRES')));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false }
});

async function main() {
  const { data: cats } = await supabase.from('service_categories').select('id, name, is_active');
  console.log('Current service categories count:', cats?.length);
  console.log(cats);

  const { data: services } = await supabase.from('services').select('id, title, category_id, base_price, price_unit');
  console.log('Current services count:', services?.length);
  console.log(services);
}

main().catch(console.error);

