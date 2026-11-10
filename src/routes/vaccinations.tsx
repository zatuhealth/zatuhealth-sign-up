import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, Baby, Calendar, Camera, Cat, ChevronDown, ChevronRight, Dog, FileText, HeartPulse, Info, LoaderCircle, MapPin, Pencil, Plane, Plus, ScanLine, Settings2, Stethoscope, Syringe, UserRound, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useAccountSession } from '@/components/account-session';
import { useServerFn } from '@tanstack/react-start';
import { scanCard } from '@/lib/card-scan.functions';
import { CardScanner } from '@/components/card-scanner';
import { MenuButton, PortalNav } from '@/components/portal-shell';
import { bloodTypes, countries } from '@/lib/registration';
import { ageInYears, bmiCategory, profileBMI, ugandaDistricts } from '@/lib/profile';
import {
  ageLabel, categoryLabels, highRiskConditions, highRiskGroups, humanCategories, immunitySchedule, petDiseases, petSchedules,
  pregnancyGroups, pregnancyPhases, travelDestinations, travelGroups, applyContent, catalogFor, groupContentKey, type VaccineContent, type Category, type Vaccine, type VaccineGroup,
} from '@/lib/vaccines';

export const Route = createFileRoute('/vaccinations')({
  head: () => ({ meta: [
    { title: 'Family Vaccinations | ZatuHealth' },
    { name: 'description', content: 'Store and manage immunization records for yourself, your family and your pets, with travel, pregnancy and high-risk guidance.' },
    { property: 'og:title', content: 'Family Vaccinations | ZatuHealth' },
    { property: 'og:description', content: 'Vaccination records for every family member and pet in one place.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: VaccinationsPage,
});

type Dependent = Tables<'dependents'>;
type RecordRow = Tables<'vaccination_records'>;
type Member = { id: string | null; name: string; kind: 'human' | 'pet'; species?: string | null; center?: string | null; photo?: string | null };
type View = { name: 'dashboard' } | { name: 'dependents' } | { name: 'edit'; dependent?: Dependent } | { name: 'info'; vaccine: Vaccine } | { name: 'group'; group: VaccineGroup } | { name: 'petDiseases' } | { name: 'scan' };

function VaccinationsPage() {
  const session = useAccountSession();
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<Category>('immunity');
  const [view, setView] = useState<View>({ name: 'dashboard' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [content, setContent] = useState<Record<string, VaccineContent>>({});
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const scan = useServerFn(scanCard);

  async function load() {
    const [d, r, c, a] = await Promise.all([
      supabase.from('dependents').select('*').order('created_at'),
      supabase.from('vaccination_records').select('*'),
      supabase.from('vaccine_content').select('*'),
      supabase.rpc('has_role', { _user_id: session.user!.id, _role: 'admin' }),
    ]);
    if (d.error || r.error) setError('Your records could not be loaded. Please try again.');
    setDependents(d.data ?? []); setRecords(r.data ?? []);
    setContent(Object.fromEntries((c.data ?? []).map(x => [x.vaccine_key, x])));
    setIsAdmin(!!a.data);
    const paths = (d.data ?? []).filter(x => x.photo_path).map(x => x.photo_path!);
    if (paths.length) {
      const { data: urls } = await supabase.storage.from('member-photos').createSignedUrls(paths, 3600);
      const byPath = Object.fromEntries((urls ?? []).filter(u => u.signedUrl).map(u => [u.path, u.signedUrl]));
      setPhotos(Object.fromEntries((d.data ?? []).filter(x => x.photo_path && byPath[x.photo_path]).map(x => [x.id, byPath[x.photo_path!]])));
    } else setPhotos({});
    setLoading(false);
  }
  useEffect(() => { if (session.user) void load(); else if (session.ready) setLoading(false); }, [session.ready, session.user?.id]);

  const self: Member = { id: null, name: session.profile ? `${session.profile.first_name} ${session.profile.last_name}` : 'Me', kind: 'human' };
  const members: Member[] = [self, ...dependents.map(d => ({ id: d.id, name: d.name, kind: d.kind as 'human' | 'pet', species: d.species, center: d.vaccination_center, photo: photos[d.id] ?? null }))];
  const member = members.find(m => m.id === selected) ?? self;
  useEffect(() => { if (member.kind === 'pet') setTab('pet'); else if (tab === 'pet') setTab('immunity'); }, [member.id, member.kind]);

  if (!session.ready || loading) return <Shell><div className="flex justify-center py-24"><LoaderCircle className="animate-spin text-primary" /></div></Shell>;
  if (!session.user) return <Shell><div className="py-20 text-center"><Syringe className="mx-auto mb-4 text-primary" size={40} /><h1 className="font-heading text-2xl font-extrabold">Sign in to see your vaccinations</h1><p className="mt-2 text-sm text-muted-foreground">Your family vaccination records are private to your account.</p><Button asChild className="mt-6"><Link to="/sign-in">Sign in</Link></Button></div></Shell>;

  const recordFor = (key: string) => records.find(r => r.vaccine_key === key && (r.dependent_id ?? null) === member.id);
  async function saveRecord(vaccine: Vaccine, values: { taken: boolean; taken_on: string; note: string }) {
    const existing = recordFor(vaccine.key);
    const payload = { taken: values.taken, taken_on: values.taken ? values.taken_on || null : null, note: values.note.trim().slice(0, 1000) || null, updated_at: new Date().toISOString() };
    const result = existing
      ? await supabase.from('vaccination_records').update(payload).eq('id', existing.id).select().single()
      : await supabase.from('vaccination_records').insert({ ...payload, owner_id: session.user!.id, dependent_id: member.id, vaccine_key: vaccine.key }).select().single();
    if (result.error) return 'This record could not be saved. Please try again.';
    setRecords(rs => [...rs.filter(r => r.id !== result.data.id), result.data]);
    return '';
  }
  const withContent = (v: Vaccine) => applyContent(v, content[v.key]);
  const groupLabel = (id: string, label: string) => content[groupContentKey(id)]?.group_label?.trim() || label;
  const card = (raw: Vaccine) => { const v = withContent(raw); return <VaccineCard key={`${member.id}-${v.key}`} vaccine={v} record={recordFor(v.key)} onSave={saveRecord} onInfo={() => setView({ name: 'info', vaccine: v })} />; };

  if (view.name === 'info') return <Shell><SubHeader title={view.vaccine.name} onBack={() => setView({ name: 'dashboard' })} /><div className="space-y-3">{view.vaccine.info.map((s, i) => <Accordion key={s.title} title={s.title} defaultOpen={i === 0}><p>{s.body}</p></Accordion>)}</div></Shell>;
  if (view.name === 'scan') { const catalog = catalogFor(member.kind, member.species).map(withContent); return <Shell><SubHeader title={`Scan card for ${member.name.split(' ')[0]}`} onBack={() => setView({ name: 'dashboard' })} /><CardScanner catalog={catalog} scan={image => scan({ data: { image, kind: member.kind, species: member.species ?? null } })} onSave={async items => { for (const it of items) { const v = catalog.find(c => c.key === it.key); if (!v) continue; const e = await saveRecord(v, { taken: true, taken_on: it.date, note: recordFor(v.key)?.note ?? '' }); if (e) return e; } setView({ name: 'dashboard' }); return ''; }} /></Shell>; }
  if (view.name === 'group') return <Shell><SubHeader title={view.group.label} onBack={() => setView({ name: 'dashboard' })} /><div className="space-y-4">{view.group.vaccines.map(card)}</div></Shell>;
  if (view.name === 'petDiseases') { const info = petDiseases[(member.species as 'cat' | 'dog') ?? 'cat'] ?? petDiseases.cat; return <Shell><SubHeader title={info.title} onBack={() => setView({ name: 'dashboard' })} /><div className="space-y-3"><Accordion title={info.title} defaultOpen><ul className="space-y-3">{info.diseases.map(d => <li key={d}>{d}</li>)}</ul></Accordion><Accordion title="More information about the diseases" defaultOpen><p>{info.more}</p></Accordion></div></Shell>; }
  if (view.name === 'dependents') return <Shell><SubHeader title="Dependents" onBack={() => setView({ name: 'dashboard' })} action={<IconButton label="Add dependent" onClick={() => setView({ name: 'edit' })}><Plus /></IconButton>} />
    {dependents.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No dependents yet. Add family members or pets to track their vaccines.</p>}
    <div className="space-y-4">{dependents.map(d => <div key={d.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between"><h3 className="font-heading text-lg font-bold text-teal">{d.name}</h3><Avatar member={{ id: d.id, name: d.name, kind: d.kind as 'human' | 'pet', species: d.species, photo: photos[d.id] ?? null }} size="sm" /></div>
      <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
        {d.date_of_birth && <p className="flex items-center gap-2"><UserRound size={15} className="text-warm" />{ageLabel(d.date_of_birth)}</p>}
        {d.date_of_birth && <p className="flex items-center gap-2"><Calendar size={15} className="text-warm" />Born {new Date(d.date_of_birth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>}
        {d.vaccination_center && <p className="flex items-center gap-2"><Syringe size={15} className="text-warm" />{d.vaccination_center}</p>}
      </div>
      <Button variant="link" className="mt-2 h-auto p-0 text-muted-foreground" onClick={() => setView({ name: 'edit', dependent: d })}><Pencil size={14} />Edit Profile</Button>
    </div>)}</div></Shell>;
  if (view.name === 'edit') return <Shell><DependentForm dependent={view.dependent} photoUrl={view.dependent ? photos[view.dependent.id] : undefined} ownerId={session.user.id} onDone={async id => { await load(); if (id) setSelected(id); setView(view.dependent ? { name: 'dependents' } : { name: 'dashboard' }); }} onCancel={() => setView(view.dependent ? { name: 'dependents' } : { name: 'dashboard' })} /></Shell>;

  const tabs: Category[] = member.kind === 'pet' ? ['pet'] : humanCategories;
  return <Shell>
    <header className="mb-4 flex items-center justify-between"><MenuButton /><h1 className="font-heading text-2xl font-extrabold">Vaccinations</h1><div className="flex">{isAdmin && <Button asChild variant="ghost" size="icon" aria-label="Edit vaccine content"><Link to="/admin/vaccines"><Settings2 /></Link></Button>}<IconButton label="Add dependent" onClick={() => setView({ name: 'edit' })}><Plus /></IconButton></div></header>
    <Banner category={tab} species={member.species} />
    {error && <p className="form-error" role="alert">{error}</p>}
    <Button variant="outline" className="mt-4 w-full" onClick={() => setView({ name: 'scan' })}><ScanLine />Scan a vaccination card</Button>
    <div className="mt-6 flex items-center justify-between"><span className="text-xs font-bold tracking-wide">MY RECORDS</span><button className="flex items-center text-xs font-bold text-teal" onClick={() => setView({ name: 'dependents' })}>Dependents<ChevronRight size={15} /></button></div>
    <div className="-mx-1 mt-3 flex gap-3 overflow-x-auto px-1 pb-2">
      {members.map(m => <button key={m.id ?? 'self'} onClick={() => setSelected(m.id)} className="flex w-20 shrink-0 flex-col items-center gap-1.5"><Avatar member={m} active={m.id === member.id} /><span className={`w-full truncate text-xs ${m.id === member.id ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>{m.name.split(' ')[0]}</span>{m.id === member.id && <i className="h-0.5 w-6 rounded bg-primary" />}</button>)}
      <button onClick={() => setView({ name: 'edit' })} className="flex w-20 shrink-0 flex-col items-center gap-1.5"><span className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Plus /></span><span className="text-xs text-muted-foreground">Add New</span></button>
    </div>
    <nav className="mt-4 flex border-b border-border" role="tablist">{tabs.map(t => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`-mb-px flex-1 border-b-2 py-3 text-sm ${tab === t ? 'border-primary font-semibold text-primary' : 'border-transparent text-muted-foreground'}`}>{categoryLabels[t]}</button>)}</nav>
    <section className="mt-5 space-y-4">
      {tab === 'immunity' && immunitySchedule.map(g => <div key={g.id} className="space-y-3"><div className="flex items-center justify-between"><h3 className="font-heading font-bold text-primary">{groupLabel(g.id, g.label)}</h3>{member.center && <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={13} />{member.center}</span>}</div>{g.vaccines.map(card)}</div>)}
      {tab === 'travel' && <TravelTab onOpen={g => setView({ name: 'group', group: g })} />}
      {tab === 'pregnancy' && <PickerTab placeholder="Pregnancy Phase" options={pregnancyPhases} groups={pregnancyGroups} render={card} />}
      {tab === 'high_risk' && <PickerTab placeholder="Disease Condition" options={highRiskConditions} groups={highRiskGroups} render={card} />}
      {tab === 'pet' && <><RowButton onClick={() => setView({ name: 'petDiseases' })}>{petDiseases[(member.species as 'cat' | 'dog') ?? 'cat']?.title ?? 'Diseases spread by pets'}</RowButton>{(petSchedules[(member.species as 'cat' | 'dog') ?? 'cat'] ?? petSchedules.cat).map(g => <div key={g.id} className="space-y-3"><h3 className="font-heading font-bold text-primary">{groupLabel(g.id, g.label)}</h3>{g.vaccines.map(card)}</div>)}</>}
    </section>
  </Shell>;
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-muted/40 pb-20"><main className="mx-auto max-w-xl bg-background px-5 py-6 sm:my-6 sm:rounded-2xl sm:shadow-sm">{children}</main><PortalNav /></div>;
}
function IconButton({ label, onClick, children, asLink }: { label: string; onClick?: () => void; children: ReactNode; asLink?: boolean }) {
  if (asLink) return <Button asChild variant="ghost" size="icon" aria-label={label}><Link to="/">{children}</Link></Button>;
  return <Button variant="ghost" size="icon" aria-label={label} onClick={onClick}>{children}</Button>;
}
function SubHeader({ title, onBack, action }: { title: string; onBack: () => void; action?: ReactNode }) {
  return <header className="mb-5 flex items-center gap-2"><Button variant="ghost" size="icon" aria-label="Back" onClick={onBack}><ArrowLeft /></Button><h1 className="flex-1 font-heading text-lg font-bold">{title}</h1>{action}</header>;
}
function Avatar({ member, active, size = 'md' }: { member: Member; active?: boolean; size?: 'sm' | 'md' }) {
  const Icon = member.kind === 'pet' ? (member.species === 'dog' ? Dog : Cat) : member.id === null ? UserRound : Baby;
  const box = `flex items-center justify-center overflow-hidden rounded-xl bg-aside text-teal ${size === 'sm' ? 'h-12 w-12' : 'h-16 w-16'} ${active ? 'ring-2 ring-primary' : ''}`;
  if (member.photo) return <span className={box}><img src={member.photo} alt={member.name} className="h-full w-full object-cover" /></span>;
  return <span className={box}><Icon size={size === 'sm' ? 22 : 28} /></span>;
}
function Banner({ category, species }: { category: Category; species?: string | null | undefined }) {
  const icons: Record<Category, ReactNode> = { immunity: <Users size={44} />, travel: <Plane size={44} />, pregnancy: <HeartPulse size={44} />, high_risk: <Stethoscope size={44} />, pet: species === 'dog' ? <Dog size={44} /> : <Cat size={44} /> };
  return <div className="vacc-banner flex h-28 items-center justify-center rounded-xl"><span className="flex h-24 w-24 items-center justify-center rounded-full bg-background text-teal shadow-sm">{icons[category]}</span></div>;
}
function RowButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5 text-left text-sm shadow-sm">{children}<ChevronRight size={17} className="text-muted-foreground" /></button>;
}
function Accordion({ title, children, defaultOpen }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return <div className={`rounded-xl border bg-card shadow-sm ${open ? 'border-primary' : 'border-border'}`}><button className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-semibold text-teal" onClick={() => setOpen(!open)} aria-expanded={open}>{title}<ChevronDown size={16} className={open ? 'rotate-180' : ''} /></button>{open && <div className="border-t border-border px-4 py-3.5 text-sm leading-relaxed text-foreground">{children}</div>}</div>;
}
function TravelTab({ onOpen }: { onOpen: (g: VaccineGroup) => void }) {
  const [dest, setDest] = useState<string>(travelDestinations[0]!);
  return <><Select value={dest} onValueChange={setDest}><SelectTrigger aria-label="Destination" className="h-12 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{travelDestinations.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>{travelGroups.map(g => <RowButton key={g.id} onClick={() => onOpen(g)}>{g.label}</RowButton>)}</>;
}
function PickerTab({ placeholder, options, groups, render }: { placeholder: string; options: string[]; groups: Record<string, VaccineGroup[]>; render: (v: Vaccine) => ReactNode }) {
  const [value, setValue] = useState('');
  return <><Select value={value} onValueChange={setValue}><SelectTrigger aria-label={placeholder} className="h-12 rounded-xl"><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent>{options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
    {value && groups[value]?.map(g => <div key={g.id} className="space-y-3"><h3 className="font-heading font-bold text-teal">{g.label}</h3>{g.vaccines.map(render)}</div>)}</>;
}
function VaccineCard({ vaccine, record, onSave, onInfo }: { vaccine: Vaccine; record?: RecordRow | undefined; onSave: (v: Vaccine, values: { taken: boolean; taken_on: string; note: string }) => Promise<string>; onInfo: () => void }) {
  const [taken, setTaken] = useState(record?.taken ?? false);
  const [date, setDate] = useState(record?.taken_on ?? '');
  const [note, setNote] = useState(record?.note ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const dirty = taken !== (record?.taken ?? false) || date !== (record?.taken_on ?? '') || note !== (record?.note ?? '');
  const id = `v-${vaccine.key}`;
  return <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
    <div className="flex items-start gap-3"><Checkbox id={id} checked={taken} onCheckedChange={c => { setTaken(!!c); if (c && !date) setDate(new Date().toISOString().slice(0, 10)); }} aria-label={`Mark ${vaccine.short} as taken`} className="mt-0.5" />
      <label htmlFor={id} className="flex-1 cursor-pointer"><strong className="block font-heading">{vaccine.short}</strong><span className="block text-xs text-muted-foreground">{vaccine.description}</span>{vaccine.route && <span className="block text-xs text-muted-foreground">{vaccine.route}</span>}{vaccine.dose && <span className="block text-xs text-muted-foreground">{vaccine.dose}</span>}</label>
      <button onClick={onInfo} aria-label={`About ${vaccine.name}`} className="rounded-md border border-warm p-1 text-warm"><Info size={14} /></button></div>
    {taken && <div className="mt-3 flex items-center gap-2 pl-7 text-sm"><span className="font-medium text-primary">Taken</span><Calendar size={14} className="ml-3 text-muted-foreground" /><input type="date" aria-label="Date taken" value={date} max={new Date().toISOString().slice(0, 10)} onChange={e => setDate(e.target.value)} className="bg-transparent outline-none" /></div>}
    <div className="mt-3 pl-7"><div className="flex gap-2 rounded-lg border border-border p-2.5"><FileText size={14} className="mt-0.5 shrink-0 text-muted-foreground" /><textarea aria-label="Note" placeholder="Add Note" maxLength={1000} rows={2} value={note} onChange={e => setNote(e.target.value)} className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground" /></div>
      {dirty && <Button className="vacc-save mt-3 w-full" disabled={busy} onClick={async () => { setBusy(true); setMsg(await onSave(vaccine, { taken, taken_on: date, note })); setBusy(false); }}>{busy ? <LoaderCircle className="animate-spin" /> : 'SAVE'}</Button>}
      {msg && <p className="form-error" role="alert">{msg}</p>}</div>
  </div>;
}

const relationships = { human: ['Child', 'Spouse', 'Parent', 'Sibling', 'Other'], pet: ['Cat', 'Dog'] };
function DependentForm({ dependent, photoUrl, ownerId, onDone, onCancel }: { dependent?: Dependent | undefined; photoUrl?: string | undefined; ownerId: string; onDone: (id?: string) => void; onCancel: () => void }) {
  const [relationship, setRelationship] = useState(dependent?.relationship ?? '');
  const [firstName, setFirstName] = useState(dependent?.first_name ?? dependent?.name ?? '');
  const [lastName, setLastName] = useState(dependent?.last_name ?? '');
  const [gender, setGender] = useState(dependent?.gender ?? '');
  const [dob, setDob] = useState(dependent?.date_of_birth ?? '');
  const [country, setCountry] = useState(dependent?.country ?? 'Uganda');
  const [stateProv, setStateProv] = useState(dependent?.state_province ?? '');
  const [center, setCenter] = useState(dependent?.vaccination_center ?? '');
  const [bloodType, setBloodType] = useState(dependent?.blood_type ?? '');
  const [weight, setWeight] = useState(dependent?.weight_kg == null ? '' : String(dependent.weight_kg));
  const [height, setHeight] = useState(dependent?.height_cm == null ? '' : String(dependent.height_cm));
  const [bmi, setBmi] = useState<number | null>(() => profileBMI(height, weight));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const preview = useMemo(() => photo ? URL.createObjectURL(photo) : photoUrl, [photo, photoUrl]);
  const isPet = relationship === 'Cat' || relationship === 'Dog';
  const allRelationships = useMemo(() => [...relationships.human, ...relationships.pet], []);
  const age = dob ? ageInYears(dob) : null;
  const isAdult = !isPet && age !== null && age >= 18;
  async function submit() {
    setError('');
    if (!relationship) return setError('Choose a relationship.');
    if (!firstName.trim() || firstName.trim().length > 100) return setError('Enter a first name of up to 100 characters.');
    if (!isPet && !lastName.trim()) return setError('Enter last names.');
    if (dob && dob > new Date().toISOString().slice(0, 10)) return setError('Date of birth cannot be in the future.');
    const hasMeasure = isAdult && (weight.trim() || height.trim());
    if (hasMeasure && profileBMI(height, weight) === null) return setError('Enter a valid weight and height, or leave both empty.');
    setBusy(true);
    const fullName = [firstName.trim(), isPet ? '' : lastName.trim()].filter(Boolean).join(' ').slice(0, 100);
    const payload = { relationship, name: fullName, first_name: firstName.trim(), last_name: isPet ? null : lastName.trim().slice(0, 100), kind: isPet ? 'pet' : 'human', species: isPet ? relationship.toLowerCase() : null, gender: gender || null, date_of_birth: dob || null, country: isPet ? null : country || null, state_province: isPet ? null : stateProv.trim().slice(0, 100) || null, vaccination_center: center.trim().slice(0, 150) || null, blood_type: isPet ? null : bloodType || null, weight_kg: hasMeasure ? Number(weight) : null, height_cm: hasMeasure ? Number(height) : null };
    const result = dependent
      ? await supabase.from('dependents').update(payload).eq('id', dependent.id).select().single()
      : await supabase.from('dependents').insert({ ...payload, owner_id: ownerId }).select().single();
    if (result.error) { setBusy(false); return setError('The dependent could not be saved. Please try again.'); }
    if (photo) {
      const path = `${ownerId}/${result.data.id}-${Date.now()}.${photo.type === 'image/png' ? 'png' : photo.type === 'image/webp' ? 'webp' : 'jpg'}`;
      const up = await supabase.storage.from('member-photos').upload(path, photo, { contentType: photo.type });
      const upd = up.error ? up : await supabase.from('dependents').update({ photo_path: path }).eq('id', result.data.id);
      if (upd.error) { setBusy(false); return setError('Details saved, but the photo could not be uploaded. Please try again.'); }
      if (dependent?.photo_path) await supabase.storage.from('member-photos').remove([dependent.photo_path]);
    }
    setBusy(false);
    onDone(result.data.id);
  }
  const row = 'flex h-12 w-full items-center gap-3 rounded-xl border border-border bg-card px-4 text-sm shadow-sm';
  return <div>
    <header className="mb-6 flex items-center justify-between"><Button variant="ghost" onClick={onCancel}>Cancel</Button><h1 className="font-heading font-bold">{dependent ? 'Edit Dependent' : 'Add New Dependent'}</h1><Button variant="ghost" className="font-semibold text-primary" disabled={busy} onClick={() => void submit()}>{busy ? <LoaderCircle className="animate-spin" /> : dependent ? 'Save' : 'Add'}</Button></header>
    <label className="mx-auto mb-6 flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-border bg-card text-muted-foreground shadow-sm" aria-label="Upload photo">
      {preview ? <img src={preview} alt="Profile photo" className="h-full w-full object-cover" /> : <Camera />}
      <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 5 * 1024 * 1024) return setError('Photos must be 5 MB or smaller.'); setError(''); setPhoto(f); }} />
    </label>
    <p className="-mt-4 mb-6 text-center text-xs text-muted-foreground">Tap to {preview ? 'change' : 'add'} photo</p>
    <div className="space-y-3">
      <Select value={relationship} onValueChange={setRelationship}><SelectTrigger aria-label="Relationship" className="h-12 rounded-xl"><SelectValue placeholder="Relationship" /></SelectTrigger><SelectContent>{allRelationships.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
      <label className={row}><UserRound size={16} className="text-muted-foreground" /><input aria-label="First name" placeholder={isPet ? 'Pet name' : 'First Name'} maxLength={100} value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-transparent outline-none" /></label>
      {!isPet && <label className={row}><UserRound size={16} className="text-muted-foreground" /><input aria-label="Last names" placeholder="Last Names" maxLength={100} value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-transparent outline-none" /></label>}
      <Select value={gender} onValueChange={setGender}><SelectTrigger aria-label="Gender" className="h-12 rounded-xl"><SelectValue placeholder="Gender" /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent></Select>
      <label className={row}><Calendar size={16} className="text-muted-foreground" /><span className="shrink-0 text-muted-foreground">Date of Birth</span><input type="date" aria-label="Date of birth" value={dob} max={new Date().toISOString().slice(0, 10)} onChange={e => setDob(e.target.value)} className="w-full bg-transparent text-right outline-none" /></label>
      {age !== null && age >= 0 && <p className="px-1 text-xs text-muted-foreground">Age: {age} {age === 1 ? 'year' : 'years'}</p>}
      {!isPet && <>
        <Select value={country} onValueChange={setCountry}><SelectTrigger aria-label="Country" className="h-12 rounded-xl"><SelectValue placeholder="Country" /></SelectTrigger><SelectContent>{countries.map(c => <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select>
        <label className={row}><MapPin size={16} className="text-muted-foreground" /><input aria-label="Province or district" placeholder="Province/District" list={country === 'Uganda' ? 'dep-uganda-districts' : undefined} maxLength={100} value={stateProv} onChange={e => setStateProv(e.target.value)} className="w-full bg-transparent outline-none" /></label>
        <datalist id="dep-uganda-districts">{ugandaDistricts.map(d => <option key={d} value={d} />)}</datalist>
      </>}
      <label className={row}><Syringe size={16} className="text-muted-foreground" /><input aria-label="Vaccination center" placeholder="Vaccination Center" maxLength={150} value={center} onChange={e => setCenter(e.target.value)} className="w-full bg-transparent outline-none" /></label>
      {!isPet && <Select value={bloodType} onValueChange={setBloodType}><SelectTrigger aria-label="Blood type" className="h-12 rounded-xl"><SelectValue placeholder="Blood Type" /></SelectTrigger><SelectContent>{bloodTypes.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select>}
      {isAdult && <div className="space-y-3 border-t border-border pt-4">
        <p className="flex items-center gap-2 text-sm font-bold text-teal"><HeartPulse size={16} />Health details (18+)</p>
        <label className={row}><span className="shrink-0 text-muted-foreground">Weight (kg)</span><input type="number" aria-label="Weight in kg" min={1} max={500} step="0.1" value={weight} onChange={e => { setWeight(e.target.value); setBmi(null); }} className="w-full bg-transparent text-right outline-none" /></label>
        <label className={row}><span className="shrink-0 text-muted-foreground">Height (cm)</span><input type="number" aria-label="Height in cm" min={30} max={300} step="0.1" value={height} onChange={e => { setHeight(e.target.value); setBmi(null); }} className="w-full bg-transparent text-right outline-none" /></label>
        <Button type="button" variant="outline" className="w-full" onClick={() => { const r = profileBMI(height, weight); setBmi(r); setError(r === null ? 'Enter a valid weight and height to calculate BMI.' : ''); }}><HeartPulse />Calculate BMI</Button>
        {bmi !== null && <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm" aria-live="polite"><span>BMI <strong>{bmi}</strong> kg/m²</span><span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{bmiCategory(bmi)}</span></div>}
      </div>}
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
  </div>;
}
