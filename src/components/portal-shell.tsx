import { Link, useRouterState } from '@tanstack/react-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Apple, CalendarDays, FileBadge, FolderLock, IdCard, Info, Menu, Receipt, Settings, Syringe, X } from 'lucide-react';
import logo from '@/assets/zatuhealth-logo.png.asset.json';

const navItems = [
  { to: '/vaccinations', label: 'Vaccines', icon: Syringe },
  { to: '/appointments', label: 'Book', icon: CalendarDays },
  { to: '/invoices', label: 'Invoices', icon: Receipt },
  { to: '/certificate', label: 'Card', icon: FileBadge },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

const menuItems = [
  { to: '/vaccinations', label: 'Vaccination', icon: Syringe },
  { to: '/appointments', label: 'Appointment', icon: CalendarDays },
  { to: '/certificate', label: 'Cards', icon: IdCard },
  { to: '/invoices', label: 'Invoice', icon: Receipt },
  { to: '/documents', label: 'Documents', icon: FolderLock },
  { to: '/nutrition', label: 'Nutrition', icon: Apple },
  { to: '/info', label: 'Info', icon: Info },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

export function PortalNav() {
  return <nav className="print:hidden fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card">
    <div className="mx-auto flex max-w-xl justify-around py-2">
      {navItems.map(({ to, label, icon: Icon }) => <Link key={to} to={to} className="flex flex-col items-center gap-0.5 px-2 text-xs text-muted-foreground" activeProps={{ className: 'text-primary font-semibold' }}><Icon size={20} />{label}</Link>)}
    </div>
  </nav>;
}

function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = useRouterState({ select: s => s.location.pathname });
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return <>
    <div aria-hidden onClick={onClose} className={`print:hidden fixed inset-0 z-30 bg-black/50 transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />
    <aside aria-label="Main menu" className={`print:hidden fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col bg-navy text-navy-foreground shadow-xl transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between px-6 pt-6">
        <img src={logo.url} alt="ZatuHealth" className="h-9 w-auto" />
        <button aria-label="Close menu" onClick={onClose} className="rounded-md p-1.5 text-navy-foreground/70 hover:text-navy-foreground"><X size={22} /></button>
      </div>
      <nav className="mt-8 flex flex-col gap-1 px-4">
        {menuItems.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return <Link key={to} to={to} onClick={onClose} className={`flex items-center gap-4 rounded-2xl px-4 py-3.5 text-lg font-medium transition-colors ${active ? 'bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_var(--primary)]' : 'text-navy-foreground hover:bg-navy-foreground/10'}`}>
            <Icon size={22} strokeWidth={1.8} />{label}
          </Link>;
        })}
      </nav>
    </aside>
  </>;
}

export function MenuButton() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <>
    <button aria-label="Open menu" onClick={() => setMenuOpen(true)} className="rounded-md p-1.5 text-foreground hover:bg-muted"><Menu size={22} /></button>
    <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
  </>;
}

export function PortalPage({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="min-h-screen bg-background pb-24">
    <main className="mx-auto max-w-xl px-5 py-6">
      <header className="print:hidden mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MenuButton />
          <h1 className="font-heading text-2xl font-extrabold">{title}</h1>
        </div>
        {action}
      </header>
      {children}
    </main>
    <PortalNav />
  </div>;
}
