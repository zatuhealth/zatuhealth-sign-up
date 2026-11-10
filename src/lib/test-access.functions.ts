import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

export const TEST_EMAIL = 'zatu@test.zatuhealth.com';
const TEST_USERNAME = 'zatu';
const TEST_PASSWORD = 'zat@123';

// Checks the shared test credentials and makes sure the test account exists (confirmed, with admin role).
export const prepareTestAccount = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.object({ username: z.string().max(50), password: z.string().max(100) }).parse(input))
  .handler(async ({ data }) => {
    if (data.username.trim().toLowerCase() !== TEST_USERNAME || data.password !== TEST_PASSWORD) {
      return { ok: false as const, error: 'Incorrect username or password.' };
    }
    const seed = new TextEncoder().encode('zatu-test:' + (process.env['SUPABASE_SERVICE_ROLE_KEY'] || ''));
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', seed))).map(b => b.toString(16).padStart(2, '0')).join('');
    const authPassword = 'Zt!' + hash.slice(0, 40);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    let user = list?.users.find(u => u.email === TEST_EMAIL);
    if (!user) {
      const created = await supabaseAdmin.auth.admin.createUser({
        email: TEST_EMAIL, password: authPassword, email_confirm: true,
        user_metadata: { first_name: 'Zatu', last_name: 'Tester', country: 'Uganda' },
      });
      if (created.error || !created.data.user) return { ok: false as const, error: created.error?.message || 'Could not create test account.' };
      user = created.data.user;
    }
    else await supabaseAdmin.auth.admin.updateUserById(user.id, { password: authPassword });
    await supabaseAdmin.from('user_roles').upsert({ user_id: user.id, role: 'admin' }, { onConflict: 'user_id,role' });
    const { createClient } = await import('@supabase/supabase-js');
    const pub = createClient(process.env['SUPABASE_URL']!, process.env['SUPABASE_PUBLISHABLE_KEY']!, { auth: { persistSession: false, autoRefreshToken: false, storage: undefined } });
    const signed = await pub.auth.signInWithPassword({ email: TEST_EMAIL, password: authPassword });
    if (signed.error || !signed.data.session) return { ok: false as const, error: signed.error?.message || 'Sign-in failed.' };
    return { ok: true as const, access_token: signed.data.session.access_token, refresh_token: signed.data.session.refresh_token };
  });
