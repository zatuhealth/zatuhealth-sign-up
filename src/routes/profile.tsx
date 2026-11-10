import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, type FormEvent, type InputHTMLAttributes } from 'react';
import { ArrowLeft, Check, HeartPulse, LoaderCircle, Pencil, Save, ShieldCheck, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brand } from '@/components/account-experience';
import { useAccountSession } from '@/components/account-session';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { bloodTypes, countries } from '@/lib/registration';
import { bmiCategory, genders, maritalStatuses, profileBMI, profileSchema, ugandaDistricts } from '@/lib/profile';

export const Route = createFileRoute('/profile')({
  head: () => ({ meta: [
    { title: 'Edit your profile | ZatuHealth' },
    { name: 'description', content: 'Update your ZatuHealth personal details, blood type, height and weight, and calculate your BMI.' },
    { property: 'og:title', content: 'Edit your profile | ZatuHealth' },
    { property: 'og:description', content: 'Manage your personal and health profile securely with ZatuHealth.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: ProfilePage,
});

function ProfileField({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="field"><span className="field-label">{label}</span><span className="field-control"><input {...props} aria-label={label} /></span></label>;
}
function ProfilePicker({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return <div className="field"><span className="field-label">{label}</span><Select value={value || 'unset'} onValueChange={value => onChange(value === 'unset' ? '' : value)}><SelectTrigger className="select-underline w-full" aria-label={label}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unset">Not specified</SelectItem>{options.map(option => <SelectItem value={option} key={option}>{option}</SelectItem>)}</SelectContent></Select></div>;
}
function ProfilePage() {
  const session = useAccountSession();
  const [editing, setEditing] = useState(false);
  return <div className="account-page"><header className="account-header"><Brand /><span className="header-security"><ShieldCheck size={16} />Secure account</span></header><main className="mx-auto max-w-2xl px-6 py-8 sm:py-12">{editing ? <Button variant="ghost" className="mb-6" onClick={() => setEditing(false)}><ArrowLeft />Back to profile</Button> : <Button variant="ghost" asChild className="mb-6"><Link to="/"><ArrowLeft />Home</Link></Button>}
    {!session.ready ? <LoaderCircle aria-label="Loading profile" className="mx-auto animate-spin text-primary" /> : !session.user ? <div className="py-12 text-center"><UserRound className="mx-auto mb-4 text-primary" size={36} /><h1 className="font-heading text-2xl font-bold">Sign in to view your profile</h1><Button asChild className="mt-6"><Link to="/sign-in">Sign in</Link></Button></div> : !session.profile ? <div role="alert"><p className="form-error">{session.error || 'Your profile is not available yet. Please try again.'}</p><Button variant="outline" onClick={() => void session.refresh()}>Try again</Button></div> : editing ? <ProfileForm key={session.user.id} profile={session.profile} refresh={session.refresh} onSaved={() => setEditing(false)} /> : <ProfileSummary profile={session.profile} onEdit={() => setEditing(true)} />}
  </main></div>;
}
function ProfileSummary({ profile, onEdit }: { profile: Tables<'profiles'>; onEdit: () => void }) {
  const bmi = profile.height_cm != null && profile.weight_kg != null ? profileBMI(String(profile.height_cm), String(profile.weight_kg)) : null;
  const rows: [string, string | null][] = [['First name', profile.first_name], ['Last names', profile.last_name], ['Gender', profile.gender], ['Date of birth', profile.date_of_birth], ['Nationality', profile.nationality], ['Province / District', profile.state_province]];
  const health: [string, string | null][] = [['Blood type', profile.blood_type], ['Weight', profile.weight_kg != null ? `${profile.weight_kg} kg` : null], ['Height', profile.height_cm != null ? `${profile.height_cm} cm` : null], ['BMI', bmi != null ? `${bmi} kg/m² · ${bmiCategory(bmi)}` : null]];
  const list = (items: [string, string | null][]) => <dl className="divide-y divide-border rounded-xl border border-border bg-card shadow-sm">{items.map(([k, v]) => <div key={k} className="flex items-center justify-between gap-4 px-4 py-3 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-semibold">{v || <span className="font-normal text-muted-foreground">Not set</span>}</dd></div>)}</dl>;
  return <><div className="section-kicker">PERSONAL HEALTH</div><div className="mb-8 mt-3 flex items-center justify-between gap-4"><h1 className="font-heading text-3xl font-extrabold">My profile</h1><Button onClick={onEdit}><Pencil />Edit profile</Button></div>
    {list(rows)}
    <div className="mb-4 mt-8 flex items-center gap-2 text-teal"><HeartPulse size={20} /><h2 className="font-heading text-lg font-bold">Health details</h2></div>
    {list(health)}
  </>;
}
function ProfileForm({ profile, refresh, onSaved }: { profile: Tables<'profiles'>; refresh: () => Promise<void>; onSaved: () => void }) {
  const [values, setValues] = useState({ first_name: profile.first_name, last_name: profile.last_name, gender: profile.gender || '', date_of_birth: profile.date_of_birth || '', marital_status: profile.marital_status || '', nationality: profile.nationality || '', country: profile.country || 'Uganda', state_province: profile.state_province || '', blood_type: profile.blood_type || '', height_cm: profile.height_cm == null ? '' : String(profile.height_cm), weight_kg: profile.weight_kg == null ? '' : String(profile.weight_kg) });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [bmi, setBmi] = useState<number | null>(profileBMI(values.height_cm, values.weight_kg));
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  function change(key: keyof typeof values, value: string) {
    setValues(current => ({ ...current, [key]: value })); setSaved(false); setError('');
    if (key === 'height_cm' || key === 'weight_kg') setBmi(null);
  }
  function calculate() {
    const result = profileBMI(values.height_cm, values.weight_kg);
    setBmi(result); setError(result === null ? 'Enter a valid height and weight to calculate BMI.' : '');
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setError(''); setSaved(false);
    const parsed = profileSchema(today).safeParse(values);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'Check your details.'); return; }
    setBusy(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user?.phone_confirmed_at || user.id !== profile.id) { setError('Please sign in with your verified mobile number first.'); return; }
      const result = await supabase.from('profiles').update(parsed.data).eq('id', user.id).select('*').single();
      if (result.error) { setError('Your profile could not be saved. Please try again.'); return; }
      await refresh(); setBmi(profileBMI(values.height_cm, values.weight_kg)); setSaved(true); onSaved();
    } catch { setError('Your profile could not be saved. Please try again.'); }
    finally { setBusy(false); }
  }
  const field = (key: keyof typeof values, label: string, props: InputHTMLAttributes<HTMLInputElement> = {}) => <ProfileField label={label} value={values[key]} onChange={event => change(key, event.target.value)} {...props} />;
  return <><div className="section-kicker">PERSONAL HEALTH</div><h1 className="mb-8 mt-3 font-heading text-3xl font-extrabold">Edit your profile</h1><form onSubmit={save} noValidate>
    <fieldset disabled={busy}>
      <div className="field-grid">{field('first_name', 'First name', { autoComplete: 'given-name', maxLength: 100 })}{field('last_name', 'Last names', { autoComplete: 'family-name', maxLength: 100 })}</div>
      <div className="field-grid"><ProfilePicker label="Gender" value={values.gender} options={genders} onChange={value => change('gender', value)} />{field('date_of_birth', 'Date of birth', { type: 'date', max: today, autoComplete: 'bday' })}</div>
      <ProfilePicker label="Marital status" value={values.marital_status} options={maritalStatuses} onChange={value => change('marital_status', value)} />
      {field('nationality', 'Nationality', { placeholder: 'e.g. Ugandan', maxLength: 100 })}
      {field('country', 'Country of residence', { list: 'residence-countries', autoComplete: 'country-name', maxLength: 100 })}<datalist id="residence-countries">{countries.map(country => <option key={country.code} value={country.name} />)}</datalist>
      {field('state_province', 'Province / District', { list: values.country.trim().toLowerCase() === 'uganda' ? 'uganda-districts' : undefined, autoComplete: 'address-level1', maxLength: 100 })}<datalist id="uganda-districts">{ugandaDistricts.map(district => <option key={district} value={district} />)}</datalist>
      <div className="mb-6 mt-5 flex items-center gap-2 border-t border-border pt-6 text-teal"><HeartPulse size={20} /><h2 className="font-heading text-lg font-bold">Health details</h2></div>
      <ProfilePicker label="Blood type" value={values.blood_type} options={bloodTypes} onChange={value => change('blood_type', value)} />
      <div className="field-grid">{field('weight_kg', 'Weight (kg)', { type: 'number', min: 1, max: 500, step: '0.1', placeholder: 'e.g. 65' })}{field('height_cm', 'Height (cm)', { type: 'number', min: 30, max: 300, step: '0.1', placeholder: 'e.g. 170' })}</div>
      <Button type="button" variant="outline" className="w-full" onClick={calculate}><HeartPulse />Calculate BMI</Button>
      {bmi !== null && <div className="bmi-result" aria-live="polite"><span>Body mass index</span><strong>{bmi}<small> kg/m²</small></strong></div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {saved && <p role="status" className="my-5 flex items-center gap-2 text-sm text-primary"><Check size={18} />Your profile has been saved.</p>}
      <Button type="submit" disabled={busy} className="submit-button mt-6">{busy ? <LoaderCircle className="animate-spin" /> : <Save />}Save profile</Button>
    </fieldset>
  </form></>;
}