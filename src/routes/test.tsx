import { useState, type FormEvent } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { prepareTestAccount } from '@/lib/test-access.functions';

export const Route = createFileRoute('/test')({
  head: () => ({ meta: [
    { title: 'Test access | ZatuHealth' },
    { name: 'description', content: 'Private ZatuHealth test environment sign-in for the team.' },
    { property: 'og:title', content: 'Test access | ZatuHealth' },
    { property: 'og:description', content: 'Private ZatuHealth test environment.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: TestAccess,
});

function TestAccess() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(''); setBusy(true);
    const f = new FormData(e.currentTarget);
    const username = String(f.get('username') || ''); const password = String(f.get('password') || '');
    try {
      const res = await prepareTestAccount({ data: { username, password } });
      if (!res.ok) { setError(res.error); return; }
      const { error: err } = await supabase.auth.setSession({ access_token: res.access_token, refresh_token: res.refresh_token });
      if (err) { setError(err.message); return; }
      navigate({ to: '/vaccinations' });
    } catch { setError('Sign-in failed. Please try again.'); } finally { setBusy(false); }
  }
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-xl border bg-card p-6 shadow-sm">
        <div><h1 className="text-2xl font-semibold">ZatuHealth test access</h1><p className="text-sm text-muted-foreground">Team testing environment</p></div>
        <label className="block space-y-1"><span className="text-sm">Username</span><input name="username" autoComplete="username" required className="w-full border-b bg-transparent py-2 outline-none" /></label>
        <label className="block space-y-1"><span className="text-sm">Password</span><input name="password" type="password" autoComplete="current-password" required className="w-full border-b bg-transparent py-2 outline-none" /></label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
        <p className="text-center text-sm"><Link to="/test/register" className="text-primary underline">Test phone sign-up</Link> · <Link to="/test/sign-in" className="text-primary underline">Mobile sign-in</Link></p>
      </form>
    </main>
  );
}
