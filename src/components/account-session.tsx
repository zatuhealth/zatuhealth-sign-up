import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type AccountSession = { user: User | null; profile: Profile | null; ready: boolean; error: string; refresh: () => Promise<void> };
const SessionContext = createContext<AccountSession | null>(null);
export function AccountSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  async function refresh() {
    const { data: { user: verified }, error: authError } = await supabase.auth.getUser();
    if (authError || !verified) { setUser(null); setProfile(null); setReady(true); return; }
    setUser(verified);
    const result = await supabase.from('profiles').select('*').eq('id', verified.id).maybeSingle();
    setError(result.error ? 'Your profile could not be loaded. Please try again.' : '');
    setProfile(result.data);
    setReady(true);
  }
  useEffect(() => {
    void refresh();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') { setUser(null); setProfile(null); setError(''); }
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') setTimeout(() => void refresh(), 0);
    });
    return () => subscription.unsubscribe();
  }, []);
  return <SessionContext.Provider value={{ user, profile, ready, error, refresh }}>{children}</SessionContext.Provider>;
}
export function useAccountSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('Account session provider is required');
  return session;
}