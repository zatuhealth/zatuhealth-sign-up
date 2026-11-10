import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

// Staff-only: texts the patient a payment link for an invoice via EgoSMS.
export const sendInvoiceSms = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ invoiceId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const [admin, staff] = await Promise.all([
      context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' }),
      context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'staff' }),
    ]);
    if (!admin.data && !staff.data) return { ok: false as const, error: 'Only clinic staff can send payment texts.' };
    const { data: inv } = await context.supabase.from('invoices').select('*').eq('id', data.invoiceId).maybeSingle();
    if (!inv) return { ok: false as const, error: 'Invoice not found.' };
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: prof } = await supabaseAdmin.from('profiles').select('mobile_number').eq('id', inv.owner_id).maybeSingle();
    if (!prof?.mobile_number) return { ok: false as const, error: 'This patient has no mobile number on file.' };
    // Texts must carry a link a phone can open; never a local dev address.
    const reqOrigin = new URL(getRequest().url).origin;
    const origin = process.env['PUBLIC_APP_URL'] || (/localhost|127\.0\.0\.1/.test(reqOrigin) ? 'https://id-preview--d0234e91-2298-43dd-b4a3-b52b50588afb.lovable.app' : reqOrigin);
    const amount = Number(inv.amount_ugx).toLocaleString('en-US');
    const message = `You have received an invoice from ${inv.clinic_name} for UGX ${amount}. Please pay using ${origin}/pay/${inv.invoice_number}`;
    const { sendEgoSms, logSms } = await import('@/lib/egosms.server');
    const sent = await sendEgoSms(prof.mobile_number, message);
    await logSms({ owner_id: inv.owner_id, phone: prof.mobile_number, kind: 'invoice', dedupe_key: `invoice:${inv.id}:${Date.now()}`, message, status: sent.ok ? 'sent' : 'failed', provider_response: sent.response });
    return sent.ok ? { ok: true as const } : { ok: false as const, error: 'The text could not be sent. Please try again.' };
  });
