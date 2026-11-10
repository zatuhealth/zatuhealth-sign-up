import { createFileRoute } from '@tanstack/react-router';
import { Building2, CircleQuestionMark, MessageCircleQuestion, ShieldCheck, Syringe } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { PortalPage } from '@/components/portal-shell';

export const Route = createFileRoute('/info')({
  head: () => ({ meta: [
    { title: 'Info | ZatuHealth' },
    { name: 'description', content: 'How ZatuHealth works: vaccines and immunity, adverse events, account security and answers to common questions.' },
    { property: 'og:title', content: 'Info | ZatuHealth' },
    { property: 'og:description', content: 'How ZatuHealth works: vaccines and immunity, adverse events, account security and answers to common questions.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: InfoPage,
});

const sections = [
  {
    icon: Syringe,
    title: 'Vaccines & immunity',
    body: 'A vaccine teaches your immune system to recognise a disease before it ever meets it. After vaccination the body keeps memory cells, so when the real infection arrives it is fought off quickly — often before you feel sick at all. Some vaccines need several doses to build full protection, and a few need boosters years later; the schedule in the Vaccination tab tracks every dose for you.',
  },
  {
    icon: CircleQuestionMark,
    title: 'Side effects (adverse events)',
    body: 'Most side effects are mild and short: a tender arm, slight swelling, a low fever or tiredness for a day or two. These are signs the immune system is responding, not the disease itself. A severe reaction is rare and usually starts within minutes to hours of the injection — the clinic keeps you briefly after vaccination for exactly this reason. If breathing trouble, widespread swelling or a very high fever appears, seek medical care immediately.',
  },
  {
    icon: ShieldCheck,
    title: 'Your records & privacy',
    body: 'Only you and the clinic staff caring for you can see your family\'s vaccination records. Your account is tied to your mobile number, and every vaccination card and certificate carries a verification code so anyone you show it to can confirm it is genuine — without seeing the rest of your record.',
  },
];

const faqs: [string, string][] = [
  ['I lost my paper card. Can I get my records?', 'Yes. Every dose you save here stays in your account, and the Card tab can print a fresh certificate with a verification QR code any time.'],
  ['Can I manage my children and pets in one place?', 'Yes. Add each of them from the Vaccination tab — their schedules, reminders and certificates are kept separately under your account.'],
  ['How do reminders reach me?', 'Reminders and confirmations arrive as text messages on the mobile number registered to your account. No extra setting to switch on.'],
  ['A dose was given at another clinic. Can I record it?', 'Yes. Open the vaccine in the schedule, tick it as taken, enter the date and save. You can also photograph a paper card and let ZatuHealth read the doses into a review list.'],
  ['Why does a family member show a vaccine I did not book?', 'The schedule follows the recommended timeline for each age and situation — travel, pregnancy or a chronic condition. Tick what has been given; the rest shows what is coming.'],
];

function InfoPage() {
  return <PortalPage title="Info">
    <div className="section-kicker">KNOWLEDGE</div>
    <h2 className="mb-1 mt-3 font-heading text-2xl font-extrabold">ZatuHealth Info</h2>
    <p className="mb-6 text-sm text-muted-foreground">What vaccines do, what to expect, and how your records are kept safe.</p>
    <div className="flex flex-col gap-5">
      {sections.map(({ icon: Icon, title, body }) => (
        <section key={title} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon size={20} /></span>
            <h3 className="font-heading text-lg font-bold">{title}</h3>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
        </section>
      ))}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><MessageCircleQuestion size={20} /></span>
          <h3 className="font-heading text-lg font-bold">Common questions</h3>
        </div>
        <div className="divide-y divide-border">
          {faqs.map(([q, a]) => (
            <details key={q} className="group py-3 first:pt-0 last:pb-0">
              <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden">
                <span className="mr-2 inline-block text-primary transition-transform group-open:rotate-90">▸</span>{q}
              </summary>
              <p className="mt-2 pl-5 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <div className="mb-2 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"><Building2 size={20} /></span>
          <h3 className="font-heading text-lg font-bold">Visit a clinic</h3>
        </div>
        <p className="text-sm text-muted-foreground">Ready for a dose, a check-up or a travel consultation? Book a visit and walk in at the appointed time.</p>
        <Link to="/appointments" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-4 hover:underline">Book an appointment →</Link>
      </section>
      <p className="text-xs text-muted-foreground">Health information here is general guidance, not a diagnosis. For advice about a specific illness or treatment, speak to a clinician.</p>
    </div>
  </PortalPage>;
}
