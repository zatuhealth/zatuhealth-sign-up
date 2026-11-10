import { createFileRoute } from '@tanstack/react-router';
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth';
import { immunitySchedule } from '@/lib/vaccines';

const dueDays: Record<string, number> = { birth: 0, '6w': 42, '9m': 274 };
const GRACE_DAYS = 14;

// Daily job: texts each parent a reminder listing overdue immunity doses for themselves and their family.
export const Route = createFileRoute('/api/public/jobs/vaccine-reminders')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const { sendEgoSms, logSms } = await import('@/lib/egosms.server');
        const [profiles, dependents, records] = await Promise.all([
          supabaseAdmin.from('profiles').select('id, first_name, mobile_number, date_of_birth'),
          supabaseAdmin.from('dependents').select('id, owner_id, kind, name, first_name, date_of_birth').eq('kind', 'human'),
          supabaseAdmin.from('vaccination_records').select('owner_id, dependent_id, vaccine_key, taken').eq('taken', true),
        ]);
        const taken = new Set((records.data ?? []).map(r => `${r.owner_id}|${r.dependent_id ?? ''}|${r.vaccine_key}`));
        const now = Date.now();
        let sent = 0, failed = 0;
        for (const p of profiles.data ?? []) {
          if (!p.mobile_number) continue;
          const members = [{ id: '', name: 'you', dob: p.date_of_birth as string | null },
            ...(dependents.data ?? []).filter(d => d.owner_id === p.id).map(d => ({ id: d.id, name: d.first_name || d.name, dob: d.date_of_birth as string | null }))];
          const lines: string[] = [];
          for (const m of members) {
            if (!m.dob) continue;
            const born = new Date(m.dob).getTime();
            const overdue = immunitySchedule.flatMap(g => (born + ((dueDays[g.id] ?? 0) + GRACE_DAYS) * 86400_000 < now ? g.vaccines : []))
              .filter(v => !taken.has(`${p.id}|${m.id}|${v.key}`)).map(v => v.short);
            if (overdue.length) lines.push(`${m.name}: ${overdue.slice(0, 4).join(', ')}${overdue.length > 4 ? ` +${overdue.length - 4} more` : ''}`);
          }
          if (!lines.length) continue;
          const dedupe = `overdue:${p.id}:week${Math.floor(now / (7 * 86400_000))}`;
          const exists = await supabaseAdmin.from('sms_logs').select('id').eq('dedupe_key', dedupe).eq('status', 'sent').limit(1);
          if (exists.data?.length) continue;
          const message = `ZatuHealth: overdue vaccines - ${lines.join('; ')}. Visit your vaccination center or update records at https://zatuhealth.com/vaccinations`;
          const r = await sendEgoSms(p.mobile_number, message.slice(0, 459));
          await logSms({ owner_id: p.id, phone: p.mobile_number, kind: 'overdue_reminder', dedupe_key: dedupe, message, status: r.ok ? 'sent' : 'failed', provider_response: r.response });
          if (r.ok) sent++; else failed++;
        }
        return Response.json({ sent, failed });
      },
    },
  },
});
