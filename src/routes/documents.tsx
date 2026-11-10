import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { Eye, FileText, Lock, Share2, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { PortalPage } from '@/components/portal-shell';
import { usePortal } from '@/lib/use-portal';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/documents')({
  head: () => ({ meta: [
    { title: 'My Documents | ZatuHealth' },
    { name: 'description', content: 'Your private health document vault with patient-controlled clinic sharing.' },
    { property: 'og:title', content: 'My Documents | ZatuHealth' },
    { property: 'og:description', content: 'Your private health document vault with patient-controlled clinic sharing.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: DocumentsPage,
});

const BUCKET = 'member-photos';
export const partnerClinics: [string, ...string[]] = ['Span Medicare (Kisaasi)', 'Pearl Medical Centre (Kansanga)', 'City Medicals Kampala (Kololo)'];
const categories: [string, ...string[]] = ['Vaccination card', 'Lab result', 'Prescription', 'Certificate', 'Other'];
const durations = [{ label: '24 hours', h: 24 }, { label: '7 days', h: 168 }, { label: '30 days', h: 720 }];

type Doc = Tables<'patient_documents'>;
type Share = Tables<'document_shares'>;
type Log = Tables<'document_access_log'>;
const field = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm';

function DocumentsPage() {
  const { session, isStaff } = usePortal();
  const user = session.user;
  const [docs, setDocs] = useState<Doc[]>([]);
  const [shares, setShares] = useState<Share[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [file, setFile] = useState<File | null>(null);
  const [shareFor, setShareFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [d, s, l] = await Promise.all([
      supabase.from('patient_documents').select('*').order('created_at', { ascending: false }),
      supabase.from('document_shares').select('*').order('created_at', { ascending: false }),
      supabase.from('document_access_log').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(20),
    ]);
    setDocs(d.data ?? []); setShares(s.data ?? []); setLogs(l.data ?? []);
  }, [user]);
  useEffect(() => { void load(); }, [load]);

  const log = (doc: Doc, action: string, detail?: string) => user && supabase.from('document_access_log').insert({ document_id: doc.id, owner_id: doc.owner_id, actor_id: user.id, action, detail: detail ?? null });

  async function upload() {
    if (!user || !file || !title.trim()) { toast.error('Add a title and choose a file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File must be under 10 MB'); return; }
    setBusy(true);
    const path = `${user.id}/documents/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, '_')}`;
    const up = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
    if (up.error) { setBusy(false); { toast.error('Upload failed'); return; } }
    const { data, error } = await supabase.from('patient_documents').insert({ owner_id: user.id, title: title.trim(), category, storage_path: path, mime_type: file.type }).select().single();
    setBusy(false);
    if (error) { toast.error('Could not save document'); return; }
    await log(data, 'uploaded');
    setTitle(''); setFile(null); toast.success('Saved privately to your vault'); void load();
  }

  async function view(doc: Doc) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(doc.storage_path, 120);
    if (!data) { toast.error('Could not open document'); return; }
    await log(doc, 'viewed', doc.owner_id === user?.id ? 'Patient' : 'Clinic staff');
    window.open(data.signedUrl, '_blank', 'noopener');
  }

  async function remove(doc: Doc) {
    if (!confirm(`Delete "${doc.title}"? This also ends all sharing.`)) return;
    await supabase.storage.from(BUCKET).remove([doc.storage_path]);
    await supabase.from('patient_documents').delete().eq('id', doc.id);
    toast.success('Document deleted'); void load();
  }

  async function grant(doc: Doc, clinic: string, hours: number) {
    if (!user) return;
    const expires_at = new Date(Date.now() + hours * 3600_000).toISOString();
    const { error } = await supabase.from('document_shares').insert({ document_id: doc.id, owner_id: user.id, clinic_name: clinic, expires_at });
    if (error) { toast.error('Could not share'); return; }
    await log(doc, 'shared', `${clinic} until ${new Date(expires_at).toLocaleString('en-GB')}`);
    setShareFor(null); toast.success(`Shared with ${clinic}`); void load();
  }

  async function revoke(s: Share) {
    await supabase.from('document_shares').update({ revoked_at: new Date().toISOString() }).eq('id', s.id);
    const doc = docs.find(d => d.id === s.document_id);
    if (doc) { await log(doc, 'revoked', s.clinic_name); }
    toast.success('Access revoked'); void load();
  }

  if (!user) return <PortalPage title="Documents"><p className="text-muted-foreground">Sign in to open your document vault.</p></PortalPage>;

  const mine = docs.filter(d => d.owner_id === user.id);
  const sharedWithClinic = docs.filter(d => d.owner_id !== user.id);
  const active = (s: Share) => !s.revoked_at && new Date(s.expires_at) > new Date();

  return <PortalPage title="Documents">
    <p className="mb-5 flex items-start gap-2 rounded-xl bg-accent p-3 text-sm"><Lock size={18} className="mt-0.5 shrink-0 text-primary" />Your documents are private. Clinics can only see a document you share, until it expires or you revoke it.</p>

    <section className="mb-6 space-y-3 rounded-xl border border-border bg-card p-4">
      <h2 className="flex items-center gap-2 font-bold"><Upload size={18} className="text-primary" />Add a document</h2>
      <input className={field} placeholder="Title, e.g. Yellow fever card" value={title} onChange={e => setTitle(e.target.value)} />
      <select className={field} value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select>
      <input type="file" accept="image/*,application/pdf" className="text-sm" onChange={e => setFile(e.target.files?.[0] ?? null)} />
      <Button onClick={upload} disabled={busy} className="w-full">{busy ? 'Uploading…' : 'Save to my vault'}</Button>
    </section>

    <h2 className="mb-2 font-bold">My vault</h2>
    {mine.length === 0 && <p className="mb-6 text-sm text-muted-foreground">No documents yet.</p>}
    <ul className="mb-6 space-y-3">{mine.map(doc => {
      const docShares = shares.filter(s => s.document_id === doc.id && active(s));
      return <li key={doc.id} className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 text-primary" />
          <div className="flex-1"><p className="font-semibold">{doc.title}</p><p className="text-xs text-muted-foreground">{doc.category} · {new Date(doc.created_at).toLocaleDateString('en-GB')}</p></div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => view(doc)}><Eye size={14} />View</Button>
          <Button size="sm" variant="outline" onClick={() => setShareFor(shareFor === doc.id ? null : doc.id)}><Share2 size={14} />Share</Button>
          <Button size="sm" variant="ghost" onClick={() => remove(doc)}><Trash2 size={14} />Delete</Button>
        </div>
        {shareFor === doc.id && <ShareForm onShare={(c, h) => grant(doc, c, h)} />}
        {docShares.length > 0 && <ul className="mt-3 space-y-2 border-t border-border pt-3 text-sm">{docShares.map(s =>
          <li key={s.id} className="flex items-center justify-between gap-2"><span><ShieldCheck size={14} className="mr-1 inline text-primary" />{s.clinic_name}<span className="block text-xs text-muted-foreground">until {new Date(s.expires_at).toLocaleString('en-GB')}</span></span><Button size="sm" variant="destructive" onClick={() => revoke(s)}>Revoke</Button></li>)}</ul>}
      </li>;
    })}</ul>

    {isStaff && <>
      <h2 className="mb-2 font-bold">Shared with the clinic</h2>
      {sharedWithClinic.length === 0 ? <p className="mb-6 text-sm text-muted-foreground">No patient has shared documents right now.</p>
        : <ul className="mb-6 space-y-2">{sharedWithClinic.map(doc => <li key={doc.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm"><span>{doc.title} <span className="text-muted-foreground">· {doc.category}</span></span><Button size="sm" variant="outline" onClick={() => view(doc)}>View</Button></li>)}</ul>}
    </>}

    <h2 className="mb-2 font-bold">Activity</h2>
    {logs.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet.</p>
      : <ul className="space-y-1 text-sm">{logs.map(l => <li key={l.id} className="flex justify-between gap-2 border-b border-border py-1.5"><span className="capitalize">{l.action}{l.detail ? ` — ${l.detail}` : ''}<span className="block text-xs text-muted-foreground">{docs.find(d => d.id === l.document_id)?.title}</span></span><span className="shrink-0 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString('en-GB')}</span></li>)}</ul>}
  </PortalPage>;
}

function ShareForm({ onShare }: { onShare: (clinic: string, hours: number) => void }) {
  const [clinic, setClinic] = useState(partnerClinics[0]);
  const [hours, setHours] = useState(24);
  return <div className="mt-3 space-y-2 rounded-lg bg-muted p-3">
    <select className={field} value={clinic} onChange={e => setClinic(e.target.value)}>{partnerClinics.map(c => <option key={c}>{c}</option>)}</select>
    <select className={field} value={hours} onChange={e => setHours(Number(e.target.value))}>{durations.map(d => <option key={d.h} value={d.h}>Access for {d.label}</option>)}</select>
    <Button size="sm" className="w-full" onClick={() => onShare(clinic, hours)}>Grant access</Button>
  </div>;
}
