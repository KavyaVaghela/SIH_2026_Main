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
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false }
});

async function testUser() {
  console.log("Testing auth user creation without metadata first...");
  const res1 = await supabase.auth.admin.createUser({
    email: 'test_minimal@example.com',
    password: 'Password123!',
    email_confirm: true
  });
  console.log("Minimal res:", res1.error ? res1.error.message : res1.data.user?.id);

  console.log("Testing auth user creation WITH metadata...");
  const res2 = await supabase.auth.admin.createUser({
    email: 'test_meta@example.com',
    password: 'Password123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Test Meta',
      role: 'CUSTOMER'
    }
  });
  console.log("Meta res:", res2.error ? res2.error.message : res2.data.user?.id);
}

testUser().catch(console.error);
