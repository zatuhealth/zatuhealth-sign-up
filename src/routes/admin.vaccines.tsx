import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowLeft, LoaderCircle, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAccountSession } from '@/components/account-session';
import { allScheduleGroups, applyContent, groupContentKey, type InfoSection, type VaccineContent } from '@/lib/vaccines';

export const Route = createFileRoute('/admin/vaccines')({
  head: () => ({ meta: [
    { title: 'Vaccine Content Editor | ZatuHealth' },
    { name: 'description', content: 'Clinic administrators replace sample vaccine schedules and guide text with approved information.' },
    { property: 'og:title', content: 'Vaccine Content Editor | ZatuHealth' },
    { property: 'og:description', content: 'Edit clinic-approved vaccine schedules and guides.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: AdminVaccines,
});

const input = 'w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm';

function AdminVaccines() {
  const session = useAccountSession();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [content, setContent] = useState<Record<string, VaccineContent>>({});
  const [editing, setEditing] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from('vaccine_content').select('*');
    setContent(Object.fromEntries((data ?? []).map(x => [x.vaccine_key, x])));
  }
  useEffect(() => {
    if (!session.ready) return;
    if (!session.user) { setAllowed(false); return; }
    void supabase.rpc('has_role', { _user_id: session.user.id, _role: 'admin' }).then(r => { setAllowed(!!r.data); if (r.data) void load(); });
  }, [session.ready, session.user?.id]);

  const wrap = (c: React.ReactNode) => <div className="min-h-screen bg-muted/40"><main className="mx-auto max-w-2xl bg-background px-5 py-6 sm:my-6 sm:rounded-2xl">{c}</main></div>;
  if (allowed === null) return wrap(<div className="flex justify-center py-24"><LoaderCircle className="animate-spin text-primary" /></div>);
  if (!allowed) return wrap(<div className="py-20 text-center"><h1 className="font-heading text-2xl font-extrabold">Admins only</h1><p className="mt-2 text-sm text-muted-foreground">Sign in with a clinic administrator account to edit vaccine content.</p><Button asChild className="mt-6"><Link to="/vaccinations">Back to vaccinations</Link></Button></div>);

  return wrap(<>
    <header className="mb-5 flex items-center gap-2"><Button asChild variant="ghost" size="icon" aria-label="Back"><Link to="/vaccinations"><ArrowLeft /></Link></Button><h1 className="font-heading text-lg font-bold">Vaccine content</h1></header>
    <p className="mb-5 text-sm text-muted-foreground">Edited text replaces the sample content for every patient. Leave a field empty to keep the sample.</p>
    <div className="space-y-6">{allScheduleGroups().map(g => <section key={g.id} className="space-y-2">
      <GroupLabel id={g.id} sample={g.label} current={content[groupContentKey(g.id)]} onSaved={load} />
      {g.vaccines.map(raw => { const v = applyContent(raw, content[raw.key]); return editing === raw.key
        ? <VaccineEditor key={raw.key} sample={raw} current={content[raw.key]} onClose={() => setEditing(null)} onSaved={load} userId={session.user!.id} />
        : <button key={raw.key} onClick={() => setEditing(raw.key)} className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left text-sm shadow-sm">
            <span><strong className="block">{v.short}</strong><span className="text-xs text-muted-foreground">{v.name}</span></span>
            <span className="text-xs text-primary">{content[raw.key] ? 'Edited' : 'Sample'} · Edit</span></button>; })}
    </section>)}</div>
  </>);
}

function GroupLabel({ id, sample, current, onSaved }: { id: string; sample: string; current?: VaccineContent | undefined; onSaved: () => Promise<void> }) {
  const [label, setLabel] = useState(current?.group_label ?? '');
  const [msg, setMsg] = useState('');
  async function save() {
    const r = await supabase.from('vaccine_content').upsert({ vaccine_key: groupContentKey(id), group_label: label.trim().slice(0, 100) || null, updated_at: new Date().toISOString() });
    setMsg(r.error ? 'Could not save.' : 'Saved'); if (!r.error) await onSaved();
  }
  return <div className="flex items-center gap-2"><input aria-label={`Schedule label for ${sample}`} className={`${input} font-heading font-bold`} placeholder={sample} value={label} maxLength={100} onChange={e => { setLabel(e.target.value); setMsg(''); }} />
    {label !== (current?.group_label ?? '') && <Button size="sm" onClick={() => void save()}>Save</Button>}{msg && <span className="text-xs text-muted-foreground">{msg}</span>}</div>;
}

function VaccineEditor({ sample, current, onClose, onSaved, userId }: { sample: import('@/lib/vaccines').Vaccine; current?: VaccineContent | undefined; onClose: () => void; onSaved: () => Promise<void>; userId: string }) {
  const [f, setF] = useState({ short: current?.short ?? '', name: current?.name ?? '', description: current?.description ?? '', dose: current?.dose ?? '', route: current?.route ?? '' });
  const [info, setInfo] = useState<InfoSection[]>(Array.isArray(current?.info) && (current!.info as InfoSection[]).length ? current!.info as InfoSection[] : sample.info);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const field = (k: keyof typeof f, label: string, max: number, area = false) => <label className="block text-xs font-semibold">{label}
    {area ? <textarea className={input} rows={2} maxLength={max} placeholder={sample[k] ?? ''} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} />
      : <input className={input} maxLength={max} placeholder={sample[k] ?? ''} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} />}</label>;
  async function save() {
    setBusy(true); setError('');
    const clean = info.map(s => ({ title: s.title.trim().slice(0, 120), body: s.body.trim().slice(0, 4000) })).filter(s => s.title && s.body);
    const r = await supabase.from('vaccine_content').upsert({ vaccine_key: sample.key, ...Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim() || null])), info: clean, updated_at: new Date().toISOString(), updated_by: userId });
    setBusy(false);
    if (r.error) return setError('Could not save. Please try again.');
    await onSaved(); onClose();
  }
  async function reset() { setBusy(true); await supabase.from('vaccine_content').delete().eq('vaccine_key', sample.key); setBusy(false); await onSaved(); onClose(); }
  return <div className="space-y-3 rounded-xl border border-primary bg-card p-4 shadow-sm">
    {field('short', 'Short name', 60)}{field('name', 'Full name', 120)}{field('description', 'Description', 500, true)}{field('dose', 'Dose', 60)}{field('route', 'Route', 60)}
    <div className="space-y-2"><span className="text-xs font-semibold">Guide sections</span>
      {info.map((s, i) => <div key={i} className="space-y-1 rounded-lg border border-border p-2">
        <div className="flex gap-2"><input aria-label="Section title" className={input} value={s.title} maxLength={120} onChange={e => setInfo(info.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} />
          <button aria-label="Remove section" onClick={() => setInfo(info.filter((_, j) => j !== i))}><Trash2 size={15} /></button></div>
        <textarea aria-label="Section text" className={input} rows={3} maxLength={4000} value={s.body} onChange={e => setInfo(info.map((x, j) => j === i ? { ...x, body: e.target.value } : x))} />
      </div>)}
      <Button variant="outline" size="sm" onClick={() => setInfo([...info, { title: '', body: '' }])}><Plus />Add section</Button></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="flex gap-2"><Button disabled={busy} onClick={() => void save()}>Save</Button><Button variant="ghost" onClick={onClose}>Cancel</Button>{current && <Button variant="ghost" className="ml-auto" disabled={busy} onClick={() => void reset()}>Restore sample</Button>}</div>
  </div>;
}
