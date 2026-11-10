import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ChevronRight, CircleHelp, FolderLock, Info, LogOut, Phone, Receipt, Share2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { PortalPage } from '@/components/portal-shell';
import { useAccountSession } from '@/components/account-session';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/settings')({
  head: () => ({ meta: [
    { title: 'Settings | ZatuHealth' },
    { name: 'description', content: 'Manage your ZatuHealth profile, invoices, support and account.' },
    { property: 'og:title', content: 'Settings | ZatuHealth' },
    { property: 'og:description', content: 'Manage your ZatuHealth profile, invoices, support and account.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: SettingsPage,
});

const row = 'flex w-full items-center gap-4 px-5 py-4 text-left text-lg text-navy-foreground hover:bg-navy-foreground/10';

function SettingsPage() {
  const session = useAccountSession();
  const navigate = useNavigate();
  const name = session.profile ? `${session.profile.first_name} ${session.profile.last_name}` : 'Guest User';
  const share = async () => {
    const url = window.location.origin;
    try { if (navigator.share) await navigator.share({ title: 'ZatuHealth', url }); else { await navigator.clipboard.writeText(url); toast.success('Link copied'); } } catch { /* cancelled */ }
  };
  const signOut = async () => { await supabase.auth.signOut(); await navigate({ to: '/test' }); };
  const Item = ({ to, icon: Icon, label }: { to: '/profile' | '/invoices' | '/info' | '/documents'; icon: typeof Info; label: string }) =>
    <Link to={to} className={row}><Icon className="text-primary" size={22} /><span className="flex-1">{label}</span><ChevronRight size={18} className="opacity-60" /></Link>;

  return <PortalPage title="Settings">
    <div className="overflow-hidden rounded-3xl bg-navy text-navy-foreground">
      <div className="flex flex-col items-center gap-3 bg-navy-foreground/10 py-6">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-navy-foreground text-navy"><UserRound size={36} /></span>
        <p className="text-sm opacity-70">Welcome to ZatuHealth</p>
        <h2 className="font-heading text-2xl font-bold">{name}</h2>
      </div>
      <Item to="/profile" icon={UserRound} label="Profile & Health" />
      <Item to="/invoices" icon={Receipt} label="Invoices" />
      <Item to="/documents" icon={FolderLock} label="Documents & sharing" />
      <hr className="mx-5 border-navy-foreground/20" />
      <Item to="/info" icon={CircleHelp} label="Support" />
      <Item to="/info" icon={Info} label="About us" />
      <Item to="/info" icon={Phone} label="Contact us" />
      <button onClick={share} className={row}><Share2 className="text-primary" size={22} /><span className="flex-1">Share</span><ChevronRight size={18} className="opacity-60" /></button>
      <hr className="mx-5 border-navy-foreground/20" />
      {session.user && <button onClick={signOut} className={row}><LogOut className="text-primary" size={22} /><span className="flex-1">Sign out</span></button>}
    </div>
  </PortalPage>;
}
