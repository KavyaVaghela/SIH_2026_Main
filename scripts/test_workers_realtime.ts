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

const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

async function main() {
  console.log('Testing Realtime subscription on "notifications" table...');
  let eventReceived = false;

  const channel = supabase.channel('test-notifs-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notifications' },
      (payload) => {
        console.log('SUCCESS: Received payload on notifications:', payload.eventType, (payload.new as Record<string, unknown>)?.id);
        eventReceived = true;
      }
    )
    .subscribe(async (status, err) => {
      console.log('Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed! Now triggering an insert into notifications via service role client...');
        const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        const adminClient = createClient(url, serviceKey);
        const { data: prof } = await adminClient.from('profiles').select('id').limit(1).single();
        const { data, error } = await adminClient
          .from('notifications')
          .insert({
            profile_id: prof!.id,
            title: 'Realtime Test',
            message: 'Testing realtime delivery',
            type: 'info',
            is_read: false,
          })
          .select('id')
          .single();
        console.log('Insert executed:', data, error);
      }
    });

  setTimeout(() => {
    supabase.removeChannel(channel);
    console.log('Finished. Event received?', eventReceived);
    process.exit(eventReceived ? 0 : 1);
  }, 6000);
}

main().catch(console.error);
