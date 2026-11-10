import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PortalPage } from '@/components/portal-shell';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { usePortal } from '@/lib/use-portal';

export const Route = createFileRoute('/appointments')({
  head: () => ({ meta: [
    { title: 'Book an appointment | ZatuHealth' },
    { name: 'description', content: 'Book vaccination and clinic appointments for you, your family and pets.' },
    { property: 'og:title', content: 'Book an appointment | ZatuHealth' },
    { property: 'og:description', content: 'Self-booking for vaccinations and clinic visits.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: AppointmentsPage,
});

const services = ['Vaccination', 'Vaccine consultation', 'Travel vaccines', 'Pet vaccination', 'General check-up'];
const clinics = ['ZatuHealth Kampala Central', 'ZatuHealth Nakawa', 'ZatuHealth Entebbe', 'ZatuHealth Jinja'];
type Appt = Tables<'appointments'>;
const statusLabel: Record<string, string> = { booked: 'Booked', checked_in: 'Checked in', completed: 'Completed', cancelled: 'Cancelled' };

function AppointmentsPage() {
  const { session, members, isStaff } = usePortal();
  const [rows, setRows] = useState<Appt[]>([]);
  const [staffView, setStaffView] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    const q = supabase.from('appointments').select('*').order('scheduled_at');
    const { data } = staffView ? await q : await q.eq('owner_id', session.user!.id);
    setRows(data ?? []);
  }
  useEffect(() => { if (session.user) void load(); }, [session.user, staffView]);

  if (!session.ready) return <PortalPage title="Appointments"><p>Loading…</p></PortalPage>;
  if (!session.user) return <PortalPage title="Appointments"><p className="mb-4">Sign in to book an appointment.</p><Button asChild><Link to="/test">Sign in</Link></Button></PortalPage>;

  async function book(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; const f = new FormData(form);
    const memberIdx = Number(f.get('member'));
    const m = members[memberIdx];
    const date = String(f.get('date')); const time = String(f.get('time'));
    const when = new Date(`${date}T${time}`);
    if (!m || isNaN(when.getTime()) || when < new Date()) { toast.error('Pick a future date and time.'); return; }
    setBusy(true);
    const { error } = await supabase.from('appointments').insert({
      owner_id: session.user!.id, dependent_id: m.id, patient_name: m.name, patient_phone: session.profile?.mobile_number ?? null,
      service: String(f.get('service')), clinic: String(f.get('clinic')), scheduled_at: when.toISOString(), notes: String(f.get('notes') || '') || null,
    });
    setBusy(false);
    if (error) { toast.error('Could not book. Please try again.'); return; }
    toast.success('Appointment booked'); form.reset(); void load();
  }
  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) toast.error('Could not update.'); else void load();
  }

  const input = 'w-full border-b border-border bg-transparent py-2 outline-none';
  return <PortalPage title="Appointments" action={isStaff && <Button size="sm" variant={staffView ? 'default' : 'outline'} onClick={() => setStaffView(v => !v)}>{staffView ? 'Clinic queue' : 'Staff view'}</Button>}>
    {!staffView && <form onSubmit={book} className="mb-8 space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-heading text-lg font-bold">Book a visit</h2>
      <label className="block text-sm">Who is it for?<select name="member" className={input}>{members.map((m, i) => <option key={m.id ?? 'self'} value={i}>{m.name}{m.kind === 'pet' ? ' (pet)' : ''}</option>)}</select></label>
      <label className="block text-sm">Service<select name="service" className={input}>{services.map(s => <option key={s}>{s}</option>)}</select></label>
      <label className="block text-sm">Clinic<select name="clinic" className={input}>{clinics.map(s => <option key={s}>{s}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-4"><label className="block text-sm">Date<input required type="date" name="date" className={input} /></label><label className="block text-sm">Time<input required type="time" name="time" min="08:00" max="18:00" className={input} /></label></div>
      <label className="block text-sm">Notes<input name="notes" className={input} placeholder="Optional" /></label>
      <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Booking…' : 'Book appointment'}</Button>
    </form>}
    <h2 className="mb-3 font-heading text-lg font-bold">{staffView ? 'All appointments' : 'My appointments'}</h2>
    {rows.length === 0 ? <p className="text-sm text-muted-foreground">No appointments yet.</p> : <ul className="space-y-3">{rows.map(a => <li key={a.id} className="rounded-xl border border-border bg-card p-4 text-sm shadow-sm">
      <div className="flex justify-between gap-2"><strong>{a.patient_name || 'Patient'}</strong><span className="text-xs font-semibold text-primary">{statusLabel[a.status]}</span></div>
      <p className="text-muted-foreground">{a.service} · {a.clinic}</p>
      <p>{new Date(a.scheduled_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>
      {a.notes && <p className="text-muted-foreground">{a.notes}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {staffView && a.status === 'booked' && <Button size="sm" variant="outline" onClick={() => setStatus(a.id, 'checked_in')}>Check in</Button>}
        {staffView && a.status === 'checked_in' && <Button size="sm" variant="outline" onClick={() => setStatus(a.id, 'completed')}>Complete</Button>}
        {staffView && a.status !== 'cancelled' && <Button size="sm" asChild><Link to="/invoices" search={{ appointment: a.id }}>Create invoice</Link></Button>}
        {a.status === 'booked' && <Button size="sm" variant="ghost" onClick={() => setStatus(a.id, 'cancelled')}>Cancel</Button>}
      </div>
    </li>)}</ul>}
  </PortalPage>;
}
