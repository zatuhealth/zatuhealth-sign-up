import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { CheckCircle2, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatUGX } from '@/lib/use-portal';

export const Route = createFileRoute('/pay/$invoiceNumber')({
  head: () => ({ meta: [
    { title: 'Pay your invoice | ZatuHealth' },
    { name: 'description', content: 'Securely view and pay your ZatuHealth clinic invoice.' },
    { property: 'og:title', content: 'Pay your invoice | ZatuHealth' },
    { property: 'og:description', content: 'View and pay your clinic invoice.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: PayPage,
});

type Inv = { invoice_number: string; clinic_name: string; patient_name: string; items: unknown; amount_ugx: number; due_on: string | null; status: string; paid_at: string | null };

function PayPage() {
  const { invoiceNumber } = Route.useParams();
  const [inv, setInv] = useState<Inv | null | undefined>(undefined);
  useEffect(() => { void supabase.rpc('get_invoice_for_payment', { _number: invoiceNumber }).then(({ data }) => setInv((data?.[0] as Inv | undefined) ?? null)); }, [invoiceNumber]);
  if (inv === undefined) return <main className="p-8 text-center">Loading…</main>;
  if (!inv) return <main className="p-8 text-center"><h1 className="font-heading text-xl font-bold">Invoice not found</h1><p className="text-muted-foreground">Check the link in your text message.</p></main>;
  const items = (Array.isArray(inv.items) ? inv.items : []) as { label: string; amount: number }[];
  return <main className="mx-auto min-h-screen max-w-md bg-background px-5 py-8">
    <p className="text-xs font-bold tracking-wide text-primary">ZATUHEALTH</p>
    <h1 className="font-heading text-2xl font-extrabold">{inv.clinic_name}</h1>
    <p className="mb-6 text-sm text-muted-foreground">Invoice #{inv.invoice_number} · {inv.patient_name}</p>
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <ul className="divide-y divide-border text-sm">{items.map((i, k) => <li key={k} className="flex justify-between py-2"><span>{i.label}</span><span>{formatUGX(i.amount)}</span></li>)}</ul>
      <div className="mt-3 flex justify-between border-t border-border pt-3 text-lg font-bold"><span>Total</span><span>{formatUGX(inv.amount_ugx)}</span></div>
      {inv.due_on && <p className="mt-1 text-sm text-muted-foreground">Due {new Date(inv.due_on).toLocaleDateString('en-GB')}</p>}
    </div>
    {inv.status === 'paid' ? <div className="mt-6 flex items-center gap-3 rounded-xl bg-accent p-4"><CheckCircle2 className="text-primary" /><div><p className="font-bold">Paid — thank you</p>{inv.paid_at && <p className="text-sm">{new Date(inv.paid_at).toLocaleString('en-GB')}</p>}</div></div>
      : <div className="mt-6 space-y-3 rounded-xl border border-border bg-card p-5 text-sm">
        <p className="flex items-center gap-2 font-bold"><Smartphone size={18} className="text-primary" />How to pay</p>
        <p><strong>Mobile Money (MTN / Airtel):</strong> pay {formatUGX(inv.amount_ugx)} to the clinic merchant code shown at reception, using reference <strong>{inv.invoice_number}</strong>.</p>
        <p><strong>Card or cash:</strong> pay at {inv.clinic_name} reception on your visit.</p>
        <p className="text-muted-foreground">This page updates to "Paid" once the clinic confirms your payment.</p>
      </div>}
  </main>;
}
