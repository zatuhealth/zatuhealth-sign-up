import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { vaccineName } from '@/lib/vaccine-names';

export const Route = createFileRoute('/verify/$memberId')({
  head: () => ({ meta: [
    { title: 'Verify vaccination certificate | ZatuHealth' },
    { name: 'description', content: 'Confirm a ZatuHealth vaccination certificate is genuine.' },
    { property: 'og:title', content: 'Verify vaccination certificate | ZatuHealth' },
    { property: 'og:description', content: 'ZatuHealth certificate verification.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: VerifyPage,
});

type Row = { full_name: string; date_of_birth: string | null; vaccine_key: string | null; taken_on: string | null };

function VerifyPage() {
  const { memberId } = Route.useParams();
  const [rows, setRows] = useState<Row[] | null | undefined>(undefined);
  useEffect(() => {
    if (!/^[0-9a-f-]{36}$/i.test(memberId)) { setRows(null); return; }
    void supabase.rpc('verify_certificate', { _member: memberId }).then(({ data }) => setRows(data?.length ? (data as Row[]) : null));
  }, [memberId]);
  if (rows === undefined) return <main className="p-8 text-center">Checking…</main>;
  if (!rows) return <main className="p-8 text-center"><h1 className="font-heading text-xl font-bold">Certificate not found</h1><p className="text-muted-foreground">This code is not a valid ZatuHealth certificate.</p></main>;
  const doses = rows.filter(r => r.vaccine_key);
  return <main className="mx-auto max-w-md px-5 py-10">
    <div className="flex items-center gap-2 text-primary"><ShieldCheck /><span className="font-bold">Verified ZatuHealth record</span></div>
    <h1 className="mt-3 font-heading text-2xl font-extrabold">{rows[0]!.full_name}</h1>
    {rows[0]!.date_of_birth && <p className="text-sm text-muted-foreground">Born {new Date(rows[0]!.date_of_birth).toLocaleDateString('en-GB')}</p>}
    <ul className="mt-5 divide-y divide-border rounded-xl border border-border bg-card text-sm">{doses.length ? doses.map((r, i) => <li key={i} className="flex justify-between px-4 py-2"><span>{vaccineName(r.vaccine_key!)}</span><span>{r.taken_on ? new Date(r.taken_on).toLocaleDateString('en-GB') : '—'}</span></li>) : <li className="px-4 py-3 text-muted-foreground">No doses recorded.</li>}</ul>
  </main>;
}
