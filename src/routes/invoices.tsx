import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useEffect, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PortalPage } from '@/components/portal-shell';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { formatUGX, usePortal } from '@/lib/use-portal';
import { sendInvoiceSms } from '@/lib/invoice-sms.functions';

export const Route = createFileRoute('/invoices')({
  validateSearch: z.object({ appointment: z.string().uuid().optional() }),
  head: () => ({ meta: [
    { title: 'Invoices & payments | ZatuHealth' },
    { name: 'description', content: 'View clinic invoices, pay by Mobile Money, card or cash, and send SMS payment links.' },
    { property: 'og:title', content: 'Invoices & payments | ZatuHealth' },
    { property: 'og:description', content: 'Clinic invoicing with SMS payment links.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: InvoicesPage,
});

type Invoice = Tables<'invoices'>;
type Item = { label: string; amount: number };

function InvoicesPage() {
  const { appointment } = Route.useSearch();
  const navigate = useNavigate();
  const { session, isStaff, loaded } = usePortal();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [appt, setAppt] = useState<Tables<'appointments'> | null>(null);
  const [items, setItems] = useState<Item[]>([{ label: '', amount: 0 }]);
  const sendSms = useServerFn(sendInvoiceSms);

  async function load() {
    const q = supabase.from('invoices').select('*').order('created_at', { ascending: false });
    const { data } = isStaff ? await q : await q.eq('owner_id', session.user!.id);
    setRows(data ?? []);
  }
  useEffect(() => { if (session.user && loaded) void load(); }, [session.user, loaded, isStaff]);
  useEffect(() => {
    if (!appointment || !session.user || appt?.id === appointment) return;
    void supabase.from('appointments').select('*').eq('id', appointment).maybeSingle().then(({ data }) => { setAppt(data); if (data) setItems([{ label: data.service, amount: 0 }]); });
  }, [appointment, session.user]);

  if (!session.ready) return <PortalPage title="Invoices"><p>Loading…</p></PortalPage>;
  if (!session.user) return <PortalPage title="Invoices"><p className="mb-4">Sign in to see your invoices.</p><Button asChild><Link to="/test">Sign in</Link></Button></PortalPage>;

  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!appt) return;
    const clean = items.filter(i => i.label.trim() && i.amount > 0);
    if (!clean.length) { toast.error('Add at least one item with an amount.'); return; }
    const f = new FormData(e.currentTarget);
    const { error } = await supabase.from('invoices').insert({
      owner_id: appt.owner_id, dependent_id: appt.dependent_id, appointment_id: appt.id, patient_name: appt.patient_name || 'Patient',
      clinic_name: appt.clinic, items: clean, amount_ugx: clean.reduce((s, i) => s + i.amount, 0), due_on: String(f.get('due') || '') || null,
    });
    if (error) { toast.error('Could not create invoice.'); return; }
    toast.success('Invoice created'); setAppt(null); void navigate({ to: '/invoices', search: {} }); void load();
  }
  async function markPaid(id: string, method: string) {
    const { error } = await supabase.from('invoices').update({ status: 'paid', payment_method: method, paid_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error('Could not update.'); else { toast.success('Marked as paid'); void load(); }
  }
  async function text(id: string) {
    const res = await sendSms({ data: { invoiceId: id } });
    if (res.ok) toast.success('Payment link texted to the patient'); else toast.error(res.error);
  }

  const input = 'w-full border-b border-border bg-transparent py-2 outline-none';
  return <PortalPage title={isStaff ? 'Clinic invoices' : 'My invoices'}>
    {isStaff && appt && <form onSubmit={create} className="mb-8 space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-heading text-lg font-bold">New invoice · {appt.patient_name}</h2>
      <p className="text-sm text-muted-foreground">{appt.clinic}</p>
      {items.map((it, i) => <div key={i} className="grid grid-cols-[1fr_8rem] gap-3">
        <input aria-label="Item" placeholder="Item" value={it.label} onChange={e => setItems(items.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} className={input} />
        <input aria-label="Amount (UGX)" type="number" min={0} placeholder="UGX" value={it.amount || ''} onChange={e => setItems(items.map((x, j) => j === i ? { ...x, amount: Number(e.target.value) } : x))} className={input} />
      </div>)}
      <Button type="button" variant="ghost" size="sm" onClick={() => setItems([...items, { label: '', amount: 0 }])}>+ Add item</Button>
      <label className="block text-sm">Due date<input type="date" name="due" className={input} /></label>
      <p className="font-semibold">Total {formatUGX(total)}</p>
      <Button type="submit" className="w-full">Create invoice</Button>
    </form>}
    {rows.length === 0 ? <p className="text-sm text-muted-foreground">No invoices yet.{isStaff && ' Create one from an appointment in the clinic queue.'}</p> : <ul className="space-y-3">{rows.map(inv => <li key={inv.id} className="rounded-xl border border-border bg-card p-4 text-sm shadow-sm">
      <div className="flex justify-between"><strong>#{inv.invoice_number}</strong><span className={inv.status === 'paid' ? 'font-semibold text-primary' : 'font-semibold text-destructive'}>{inv.status === 'paid' ? 'Paid' : 'Unpaid'}</span></div>
      <p className="text-muted-foreground">{inv.patient_name} · {inv.clinic_name}</p>
      <p className="text-base font-bold">{formatUGX(inv.amount_ugx)}</p>
      {inv.paid_at && <p className="text-muted-foreground">Paid {new Date(inv.paid_at).toLocaleDateString('en-GB')} by {inv.payment_method}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" asChild><Link to="/pay/$invoiceNumber" params={{ invoiceNumber: inv.invoice_number }}>{inv.status === 'paid' ? 'View receipt' : 'Pay'}</Link></Button>
        {isStaff && inv.status === 'unpaid' && <>
          <Button size="sm" onClick={() => text(inv.id)}>Send payment SMS</Button>
          {['Cash', 'Mobile Money', 'Card'].map(m => <Button key={m} size="sm" variant="ghost" onClick={() => markPaid(inv.id, m)}>Paid: {m}</Button>)}
        </>}
      </div>
    </li>)}</ul>}
  </PortalPage>;
}
