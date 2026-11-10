import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PortalPage } from '@/components/portal-shell';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { usePortal } from '@/lib/use-portal';
import { vaccineName } from '@/lib/vaccine-names';

export const Route = createFileRoute('/certificate')({
  head: () => ({ meta: [
    { title: 'Vaccination card & certificate | ZatuHealth' },
    { name: 'description', content: 'Your digital vaccination card and printable certificate with a verification QR code.' },
    { property: 'og:title', content: 'Vaccination card & certificate | ZatuHealth' },
    { property: 'og:description', content: 'Digital vaccine passport with QR verification.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: CertificatePage,
});

function CertificatePage() {
  const { session, members } = usePortal();
  const [idx, setIdx] = useState(0);
  const [records, setRecords] = useState<Tables<'vaccination_records'>[]>([]);
  const [mode, setMode] = useState<'card' | 'certificate'>('card');
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => { if (session.user) void supabase.from('vaccination_records').select('*').eq('taken', true).then(({ data }) => setRecords(data ?? [])); }, [session.user]);

  if (!session.ready) return <PortalPage title="Vaccination card"><p>Loading…</p></PortalPage>;
  if (!session.user) return <PortalPage title="Vaccination card"><p className="mb-4">Sign in to see your vaccination card.</p><Button asChild><Link to="/test">Sign in</Link></Button></PortalPage>;
  const m = members[idx];
  if (!m) return <PortalPage title="Vaccination card"><p>Loading…</p></PortalPage>;
  const mine = records.filter(r => r.dependent_id === m.id).sort((a, b) => (a.taken_on ?? '').localeCompare(b.taken_on ?? ''));
  const verifyId = m.id ?? session.user.id;
  const verifyUrl = `${origin}/verify/${verifyId}`;
  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return <PortalPage title="Vaccination card" action={<Button size="sm" variant="outline" onClick={() => window.print()}><Printer />Print</Button>}>
    <div className="print:hidden mb-4 space-y-3">
      <select aria-label="Family member" className="w-full border-b border-border bg-transparent py-2" value={idx} onChange={e => setIdx(Number(e.target.value))}>{members.map((x, i) => <option key={x.id ?? 'self'} value={i}>{x.name}</option>)}</select>
      <div className="flex gap-2"><Button size="sm" variant={mode === 'card' ? 'default' : 'outline'} onClick={() => setMode('card')}>Card</Button><Button size="sm" variant={mode === 'certificate' ? 'default' : 'outline'} onClick={() => setMode('certificate')}>Certificate</Button></div>
    </div>
    {mode === 'card' ? <section className="rounded-2xl border-2 border-primary bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold tracking-wide text-primary">ZATUHEALTH VACCINATION CARD</p><h2 className="mt-1 font-heading text-xl font-extrabold">{m.name}</h2><p className="text-sm text-muted-foreground">Born {fmt(m.dob)}</p></div>{origin && <QRCodeSVG value={verifyUrl} size={84} />}</div>
      <table className="mt-4 w-full text-sm"><thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="py-1">Vaccine</th><th className="py-1 text-right">Date</th></tr></thead>
        <tbody>{mine.length ? mine.map(r => <tr key={r.id} className="border-b border-border/50"><td className="py-1.5">{vaccineName(r.vaccine_key)}</td><td className="py-1.5 text-right">{fmt(r.taken_on)}</td></tr>) : <tr><td colSpan={2} className="py-3 text-muted-foreground">No doses recorded yet. Tick vaccines as taken on the Vaccines page.</td></tr>}</tbody></table>
    </section> : <section className="rounded-sm border-[6px] border-double border-primary bg-card p-8 text-center shadow-sm">
      <p className="text-xs font-bold tracking-[0.3em] text-primary">ZATUHEALTH</p>
      <h2 className="mt-2 font-heading text-2xl font-extrabold">Certificate of Vaccination</h2>
      <p className="mt-6 text-sm text-muted-foreground">This certifies that</p>
      <p className="font-heading text-2xl font-bold">{m.name}</p>
      <p className="text-sm text-muted-foreground">Date of birth: {fmt(m.dob)}</p>
      <p className="mt-4 text-sm">has received the following vaccinations:</p>
      <ul className="mx-auto mt-3 max-w-sm space-y-1 text-left text-sm">{mine.length ? mine.map(r => <li key={r.id} className="flex justify-between border-b border-border/50 py-1"><span>{vaccineName(r.vaccine_key)}</span><span>{fmt(r.taken_on)}</span></li>) : <li className="text-center text-muted-foreground">No doses recorded yet.</li>}</ul>
      {origin && <div className="mt-6 flex flex-col items-center gap-1"><QRCodeSVG value={verifyUrl} size={96} /><p className="text-xs text-muted-foreground">Scan to verify · Issued {fmt(new Date().toISOString())}</p></div>}
    </section>}
  </PortalPage>;
}
