import { useEffect, useState, type InputHTMLAttributes, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, HeartPulse, LoaderCircle, LockKeyhole, Phone, RefreshCw, ShieldCheck, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { calculateBMI, countries, measurementsSchema, normalizePhone, otpSchema, passwordSchema, phoneSchema, registrationSchema } from '@/lib/registration';
import { useAccountSession } from './account-session';
import { phoneAuthEmail } from '@/lib/phone-auth';
import { sendSignupOtp, verifySignupOtp } from '@/lib/phone-auth.functions';
import { z } from 'zod';

export function Brand() {
  return <Link to="/" className="brand" aria-label="ZatuHealth home"><span className="brand-icon"><HeartPulse size={26} strokeWidth={1.8} /></span><span>Zatu<span className="text-primary">Health</span></span></Link>;
}
function Field({ label, password = false, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; password?: boolean }) {
  const [visible, setVisible] = useState(false);
  return <label className="field"><span className="field-label">{label}</span><span className="field-control"><input {...props} aria-label={label} type={password ? (visible ? 'text' : 'password') : props.type || 'text'} />{password && <Button type="button" variant="ghost" size="icon" aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} title={`${visible ? 'Hide' : 'Show'} password`} onClick={() => setVisible(!visible)}>{visible ? <EyeOff /> : <Eye />}</Button>}</span></label>;
}
function Picker({ label, value, onChange, items }: { label: string; value: string; onChange: (value: string) => void; items: string[] }) {
  return <div className="field"><span className="field-label">{label}</span><Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className="select-underline"><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger><SelectContent>{items.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>;
}
function friendlyError(error: { message: string; code?: string | undefined }) {
  if (/phone.*(disabled|not enabled)|unsupported.*phone/i.test(error.message) || error.code === 'phone_provider_disabled') return 'SMS verification is not available yet. Please try again once phone sign-in has been enabled.';
  if (/invalid login/i.test(error.message)) return 'The mobile number or password is incorrect.';
  if (/rate|seconds/i.test(error.message)) return 'Please wait a moment before requesting another code.';
  if (/expired|token|otp/i.test(error.message)) return 'That code is invalid or expired. Please check it or request a new code.';
  return error.message;
}
export function AccountExperience({ mode = 'register', signInPath = '/sign-in', registerPath = '/' }: { mode?: 'register' | 'signin'; signInPath?: '/sign-in' | '/test/sign-in'; registerPath?: '/' | '/test/register' }) {
  const navigate = useNavigate();
  const session = useAccountSession();
  const [step, setStep] = useState<'register' | 'signin' | 'verify' | 'health' | 'complete'>(mode);
  const [country, setCountry] = useState('Uganda');
  const [dial, setDial] = useState('+256');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [remaining, setRemaining] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState<z.infer<typeof registrationSchema> | null>(null);
  useEffect(() => { if (remaining <= 0) return; const timer = setTimeout(() => setRemaining(remaining - 1), 1000); return () => clearTimeout(timer); }, [remaining]);
  useEffect(() => {
    if (!session.ready || !session.user || !session.user.phone_confirmed_at || step === 'verify') return;
    if (session.profile?.height_cm && session.profile.weight_kg) { setHeight(String(session.profile.height_cm)); setWeight(String(session.profile.weight_kg)); setSaved(true); setStep('complete'); }
    else setStep('health');
  }, [session.ready, session.user?.id, session.profile]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    try {
      if (step === 'register') {
        const parsed = registrationSchema.safeParse({ ...values, country, phone: normalizePhone(String(values['mobile'] || ''), dial) });
        if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'Check your details.'); return; }
        const mobile = parsed.data.phone;
        const result = await sendSignupOtp({ data: { phone: mobile } });
        if (!result.ok) { setError(result.error); return; }
        setPending(parsed.data); setPhone(mobile); setOtp(''); setStep('verify'); setRemaining(33);
      } else if (step === 'signin') {
        const mobile = phoneSchema.parse(normalizePhone(String(values['mobile'] || ''), dial));
        const password = passwordSchema.parse(values['password']);
        const result = await supabase.auth.signInWithPassword({ email: phoneAuthEmail(mobile), password });
        if (result.error) { setError(friendlyError(result.error)); return; }
        await session.refresh(); setStep('health');
      } else if (step === 'verify') {
        const token = otpSchema.parse(otp);
        if (!pending) { setError('Please enter your details again.'); setStep('register'); return; }
        const result = await verifySignupOtp({ data: { code: token, details: pending } });
        if (!result.ok) { setError(result.error); return; }
        const set = await supabase.auth.setSession({ access_token: result.access_token, refresh_token: result.refresh_token });
        if (set.error) { setError('Verification could not be completed. Please sign in.'); return; }
        setPending(null);
        await session.refresh(); setStep('health');
      } else if (step === 'health') {
        const measurements = measurementsSchema.parse({ height_cm: height, weight_kg: weight });
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user?.phone_confirmed_at) { setError('Please sign in with your verified mobile number first.'); return; }
        const result = await supabase.from('profiles').update(measurements).eq('id', user.id).select().single();
        if (result.error) { setError('Your measurements could not be saved. Please try again.'); return; }
        setSaved(true); await session.refresh(); setStep('complete');
      }
    } catch (caught) { setError(caught instanceof Error && 'issues' in caught ? JSON.parse(caught.message)[0]?.message || 'Check the entered details.' : 'Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  }
  async function resend() {
    if (remaining || busy) return;
    setBusy(true); setError('');
    const result = await sendSignupOtp({ data: { phone } });
    if (!result.ok) setError(result.error); else { setRemaining(33); setOtp(''); }
    setBusy(false);
  }
  const activeStep = step === 'register' || step === 'signin' ? 0 : step === 'verify' ? 1 : 2;
  const isAccount = step === 'health' || step === 'complete';
  const bmi = measurementsSchema.safeParse({ height_cm: height, weight_kg: weight }).success ? calculateBMI(Number(height), Number(weight)) : null;
  return <div className="account-page">
    <header className="account-header"><Brand /><div className="header-security"><ShieldCheck size={16} /><span>Secure account</span></div></header>
    <main className="account-layout">
      <aside className="account-aside">
        <div className="aside-top"><span className="eyebrow">YOUR HEALTH, CONNECTED</span><h1>ZatuHealth</h1><p>A healthier journey<br />starts with you.</p></div>
        <ol className="steps">{[['Your details', 'A little about you'], ['Verify your mobile', 'Keep your account secure'], ['Your health profile', 'Make it personal']].map(([title, detail], i) => <li key={title} className={i === activeStep ? 'active' : i < activeStep ? 'done' : ''}><span className="step-number">{i < activeStep ? <Check size={16} /> : `0${i + 1}`}</span><div><strong>{title}</strong><span>{detail}</span></div>{i === activeStep && <span className="step-dot" />}</li>)}</ol>
        <div className="aside-bottom"><div className="health-art" aria-hidden="true"><HeartPulse size={60} strokeWidth={1.2} /><span className="art-cross">+</span></div><div className="privacy-note"><LockKeyhole size={17} /><p>Your information stays personal.<br /><strong>Your health stays yours.</strong></p></div></div>
      </aside>
      <section className="account-content"><div className="form-wrap">
        <div className="mobile-steps"><span>Step {activeStep + 1} of 3</span><div>{[0, 1, 2].map(i => <i key={i} className={i <= activeStep ? 'filled' : ''} />)}</div></div>
        <div className="section-kicker">{isAccount ? 'PERSONAL HEALTH' : step === 'verify' ? 'MOBILE VERIFICATION' : mode === 'signin' ? 'WELCOME BACK' : 'WELCOME TO ZATUHEALTH'}</div>
        <h2>{step === 'register' ? 'Create your account' : step === 'signin' ? 'Sign in' : step === 'verify' ? 'Verify your mobile number' : step === 'health' ? 'Your health profile' : 'You’re all set'}</h2>
        <p className="form-subtitle">{step === 'register' ? 'Let’s get to know you.' : step === 'signin' ? 'Good to see you again.' : step === 'verify' ? 'We’ve sent a six-digit code to your mobile number.' : step === 'health' ? 'Add your height and weight.' : 'Your ZatuHealth profile is ready.'}</p>
        {session.error && <div className="form-error" role="alert">{session.error}<Button variant="link" onClick={() => void session.refresh()}>Try again</Button></div>}
        <form onSubmit={submit} noValidate>
          {step === 'register' && <><div className="field-grid"><Field label="First name" name="first_name" placeholder="First name" maxLength={100} autoComplete="given-name" required /><Field label="Last name" name="last_name" placeholder="Last name" maxLength={100} autoComplete="family-name" required /></div><Picker label="Country" value={country} items={countries.map(c => c.name)} onChange={value => { setCountry(value); setDial(countries.find(c => c.name === value)?.dial || '+256'); }} /></>}
          {(step === 'register' || step === 'signin') && <><div className="field"><span className="field-label">Mobile number</span><div className="phone-control"><Select value={dial} onValueChange={setDial}><SelectTrigger aria-label="Calling code" className="dial-select"><SelectValue /></SelectTrigger><SelectContent>{countries.map(c => <SelectItem key={c.code} value={c.dial}>{c.flag} {c.dial}</SelectItem>)}</SelectContent></Select><input aria-label="Mobile number" name="mobile" type="tel" placeholder="700 000 000" maxLength={22} autoComplete="tel-national" /></div></div>{step === 'register' && <Field label="Email address (optional)" name="contact_email" type="email" placeholder="you@example.com" autoComplete="email" maxLength={255} />}<div className={step === 'register' ? 'field-grid' : ''}><Field label="Password" password name="password" placeholder={step === 'register' ? 'At least 8 characters' : 'Your password'} maxLength={128} autoComplete={step === 'register' ? 'new-password' : 'current-password'} />{step === 'register' && <Field label="Confirm password" password name="confirmPassword" placeholder="Repeat password" maxLength={128} autoComplete="new-password" />}</div></>}
          {step === 'verify' && <><div className="verified-phone"><Phone size={20} /><strong>{phone}</strong><Button type="button" variant="link" onClick={() => { setStep('register'); setError(''); }}>Change</Button></div><label className="otp-label" htmlFor="otp">Enter verification code</label><input id="otp" aria-label="Verification code" className="otp-input" inputMode="numeric" autoComplete="one-time-code" placeholder="— — — — — —" value={otp} maxLength={6} onChange={event => setOtp(event.target.value.replace(/\D/g, ''))} /></>}
          {step === 'health' && <><div className="verification-success"><ShieldCheck size={18} />Mobile number verified</div><div className="field-grid"><Field label="Height (cm)" type="number" min={30} max={300} step="0.1" placeholder="e.g. 170" value={height} onChange={event => setHeight(event.target.value)} /><Field label="Weight (kg)" type="number" min={1} max={500} step="0.1" placeholder="e.g. 65" value={weight} onChange={event => setWeight(event.target.value)} /></div>{bmi && <div className="bmi-result"><span>Body mass index</span><strong>{bmi}<small> kg/m²</small></strong></div>}</>}
          {step === 'complete' && <><div className="complete-mark"><Check size={32} /></div><div className="profile-summary"><UserRound size={20} /><strong>{session.profile?.first_name} {session.profile?.last_name}</strong><span>{session.profile?.country} · {session.profile?.blood_type ? (session.profile.blood_type === 'Unknown' ? 'Blood type unknown' : `Blood type ${session.profile.blood_type}`) : 'Blood type unknown'}</span></div>{saved && bmi && <div className="bmi-result"><span>Body mass index</span><strong>{bmi}<small> kg/m²</small></strong></div>}<Button asChild className="w-full mt-6"><Link to="/vaccinations">Open family vaccinations <ArrowRight /></Link></Button><Button type="button" variant="outline" className="w-full mt-3" onClick={() => { setStep('health'); setError(''); }}>Update measurements</Button></>}
          {step === 'complete' && <Button type="button" variant="outline" asChild className="w-full mt-3"><Link to="/profile"><UserRound />Edit profile</Link></Button>}
          {error && <p className="form-error" role="alert">{error}</p>}
          {step !== 'complete' && <Button disabled={busy} type="submit" className="submit-button">{busy ? <LoaderCircle className="animate-spin" /> : step === 'verify' ? <ShieldCheck /> : null}{step === 'register' ? 'Create Account' : step === 'signin' ? 'Sign In' : step === 'verify' ? 'Verify OTP' : 'Save health profile'}{!busy && step !== 'verify' && <ArrowRight />}</Button>}
          {step === 'verify' && <><Button type="button" variant="outline" className="resend-button" disabled={remaining > 0 || busy} onClick={() => void resend()}><RefreshCw />Resend OTP</Button><p className="resend-caption">{remaining > 0 ? `Resend available in ${remaining} seconds` : 'Didn’t receive a code? Request a new one.'}</p><Button variant="link" type="button" className="back-link" onClick={() => { setStep('register'); setError(''); }}><ArrowLeft />Back to signup</Button></>}
        </form>
        {step === 'register' && <p className="account-switch">Already have an account? <Button variant="link" asChild><Link to={signInPath}>Sign in <ArrowRight size={14} /></Link></Button></p>}
        {step === 'signin' && <><Button variant="link" className="back-link" onClick={() => setError('Mobile password recovery is not available yet. SMS sign-in must be configured before recovery can be enabled securely.')}>Forgot password?</Button><p className="account-switch">Don’t have an account? <Button variant="link" asChild><Link to={registerPath}>Sign up <ArrowRight size={14} /></Link></Button></p></>}
        {isAccount && <Button variant="link" className="signout" onClick={async () => { const result = await supabase.auth.signOut(); if (result.error) { setError('Sign-out failed. Please try again.'); return; } setStep(mode); setSaved(false); setError(''); await navigate({ to: signInPath }); }}>Sign out</Button>}
        <div className="form-footer"><LockKeyhole size={13} /><span>Private. Secure. Always yours.</span></div>
      </div></section>
    </main>
    <footer className="site-footer"><span>© 2026 ZatuHealth</span><span>Your health, connected.</span></footer>
  </div>;
}