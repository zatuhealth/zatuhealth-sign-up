import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAccountSession } from '@/components/account-session';
import type { Tables } from '@/integrations/supabase/types';

export type Member = { id: string | null; name: string; kind: 'human' | 'pet'; dob: string | null };

// Loads the signed-in family (self + dependents) and whether the user is clinic staff.
export function usePortal() {
  const session = useAccountSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [isStaff, setIsStaff] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const user = session.user;
    if (!user) return;
    void (async () => {
      const [d, a, s] = await Promise.all([
        supabase.from('dependents').select('*').eq('owner_id', user.id).order('created_at'),
        supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
        supabase.rpc('has_role', { _user_id: user.id, _role: 'staff' }),
      ]);
      const p = session.profile;
      const self: Member = { id: null, name: p ? `${p.first_name} ${p.last_name}` : 'Me', kind: 'human', dob: p?.date_of_birth ?? null };
      setMembers([self, ...((d.data ?? []) as Tables<'dependents'>[]).map(x => ({ id: x.id, name: [x.first_name, x.last_name].filter(Boolean).join(' ') || x.name, kind: x.kind as 'human' | 'pet', dob: x.date_of_birth }))]);
      setIsStaff(Boolean(a.data || s.data));
      setLoaded(true);
    })();
  }, [session.user, session.profile]);
  return { session, members, isStaff, loaded };
}

export const formatUGX = (n: number | string) => `UGX ${Number(n).toLocaleString('en-US')}`;
