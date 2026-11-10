import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { phoneSchema, registrationSchema } from '@/lib/registration';
import { phoneAuthEmail } from '@/lib/phone-auth';

async function sha256(value: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
const pepper = () => process.env['SUPABASE_SERVICE_ROLE_KEY'] || '';

// Sends a 6-digit sign-up code via EgoSMS.
export const sendSignupOtp = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.object({ phone: phoneSchema }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { sendEgoSms, logSms } = await import('@/lib/egosms.server');
    const since = new Date(Date.now() - 30_000).toISOString();
    const recent = await supabaseAdmin.from('phone_otps').select('id').eq('phone', data.phone).gte('created_at', since).limit(1);
    if (recent.data?.length) return { ok: false as const, error: 'Please wait a moment before requesting another code.' };
    const hourAgo = new Date(Date.now() - 3600_000).toISOString();
    const hourly = await supabaseAdmin.from('phone_otps').select('id', { count: 'exact', head: true }).eq('phone', data.phone).gte('created_at', hourAgo);
    if ((hourly.count ?? 0) >= 5) return { ok: false as const, error: 'Too many codes requested. Please try again later.' };
    const digits = new Uint32Array(1); crypto.getRandomValues(digits);
    const code = String(digits[0]! % 1_000_000).padStart(6, '0');
    await supabaseAdmin.from('phone_otps').insert({ phone: data.phone, code_hash: await sha256(`${data.phone}:${code}:${pepper()}`), expires_at: new Date(Date.now() + 10 * 60_000).toISOString() });
    const message = `Your ZatuHealth verification code is: ${code}. Don't share this code with anyone; our employees will never ask for the code.`;
    const sent = await sendEgoSms(data.phone, message);
    await logSms({ phone: data.phone, kind: 'otp', message: 'Verification code (hidden)', status: sent.ok ? 'sent' : 'failed', provider_response: sent.response });
    if (!sent.ok) return { ok: false as const, error: 'We could not send the text message. Please check the number and try again.' };
    return { ok: true as const };
  });

// Checks the code, creates the verified account and returns a session.
export const verifySignupOtp = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.object({ code: z.string().regex(/^\d{6}$/), details: registrationSchema }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const phone = data.details.phone;
    const { data: rows } = await supabaseAdmin.from('phone_otps').select('*').eq('phone', phone).is('used_at', null).order('created_at', { ascending: false }).limit(1);
    const otp = rows?.[0];
    if (!otp || new Date(otp.expires_at) < new Date() || otp.attempts >= 5) return { ok: false as const, error: 'That code is invalid or expired. Please request a new code.' };
    if (otp.code_hash !== await sha256(`${phone}:${data.code}:${pepper()}`)) {
      await supabaseAdmin.from('phone_otps').update({ attempts: otp.attempts + 1 }).eq('id', otp.id);
      return { ok: false as const, error: 'That code is incorrect. Please check it and try again.' };
    }
    await supabaseAdmin.from('phone_otps').update({ used_at: new Date().toISOString() }).eq('id', otp.id);
    const { first_name, last_name, contact_email, country, password } = data.details;
    const created = await supabaseAdmin.auth.admin.createUser({
      email: phoneAuthEmail(phone), password, email_confirm: true, phone: phone.replace(/^\+/, ''), phone_confirm: true,
      user_metadata: { first_name, last_name, contact_email, country },
    });
    if (created.error) {
      const msg = /already/i.test(created.error.message) ? 'An account with this mobile number already exists. Please sign in.'
        : /weak|guess|pwned/i.test(created.error.message) ? 'That password is too easy to guess. Please go back and choose a stronger one.'
        : 'Your account could not be created. Please try again.';
      return { ok: false as const, error: msg };
    }
    const { createClient } = await import('@supabase/supabase-js');
    const pub = createClient(process.env['SUPABASE_URL']!, process.env['SUPABASE_PUBLISHABLE_KEY']!, { auth: { persistSession: false, autoRefreshToken: false, storage: undefined } });
    const signed = await pub.auth.signInWithPassword({ email: phoneAuthEmail(phone), password });
    if (signed.error || !signed.data.session) return { ok: false as const, error: 'Account created. Please sign in.' };
    return { ok: true as const, access_token: signed.data.session.access_token, refresh_token: signed.data.session.refresh_token };
  });
