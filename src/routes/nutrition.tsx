import { createFileRoute } from '@tanstack/react-router';
import { Apple, Baby, Milk, Salad, Sun } from 'lucide-react';
import { PortalPage } from '@/components/portal-shell';

export const Route = createFileRoute('/nutrition')({
  head: () => ({ meta: [
    { title: 'Nutrition | ZatuHealth' },
    { name: 'description', content: 'Nutrition guidance to support immunity at every stage of life, for people and pets.' },
    { property: 'og:title', content: 'Nutrition | ZatuHealth' },
    { property: 'og:description', content: 'Nutrition guidance to support immunity at every stage of life, for people and pets.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: NutritionPage,
});

type Guide = { icon: typeof Salad; title: string; intro: string; points: string[] };

const guides: Guide[] = [
  {
    icon: Baby,
    title: 'Babies & young children',
    intro: 'Good feeding helps vaccines work well and protects against illness while immunity is still developing.',
    points: [
      'Breastfeed exclusively for the first 6 months — breast milk carries antibodies that protect against infection.',
      'From 6 months, add iron- and zinc-rich foods: mashed beans, lentils, eggs, fish, groundnuts and dark leafy greens.',
      'Vitamin A (orange-fleshed fruits and vegetables such as mango, papaya, pumpkin and sweet potato) supports immunity and eye health.',
      'Continue breastfeeding up to 2 years and beyond, alongside family foods.',
    ],
  },
  {
    icon: Salad,
    title: 'Children & teens',
    intro: 'Growing bodies need steady fuel to stay healthy and get the full benefit of each vaccine dose.',
    points: [
      'Build meals around a mix of carbohydrate, protein and vegetables rather than one heavy food.',
      'Protein every day — beans, fish, eggs, chicken or groundnuts — for growth and antibody production.',
      'Choose fruit or roasted nuts instead of sweets and sugary drinks between meals.',
      'Drink clean, safe water; dehydration makes fatigue and illness worse.',
    ],
  },
  {
    icon: Apple,
    title: 'Adults & older people',
    intro: 'A balanced diet in adulthood lowers the risk of the chronic conditions that make infections more dangerous.',
    points: [
      'Fill half the plate with vegetables and fruit at the main meals of the day.',
      'Keep salt low and limit fried and heavily processed foods to protect blood pressure and the heart.',
      'People with diabetes, kidney or heart conditions should follow the eating plan their clinic gives them — it matters as much as their vaccines.',
      'Stay active and drink water regularly; both support the immune system as you age.',
    ],
  },
  {
    icon: Milk,
    title: 'Pregnancy & breastfeeding',
    intro: 'What a mother eats protects her and helps her baby build defences before and after birth.',
    points: [
      'Eat an extra meal or substantial snack each day during pregnancy and while breastfeeding.',
      'Iron-rich foods (beans, dark greens, liver, small dried fish) with a source of vitamin C help prevent anaemia.',
      'Use iodised salt and take the supplements your antenatal clinic gives you, including folic acid.',
      'Avoid alcohol, raw or undercooked meat and eggs, and unpasteurised milk during pregnancy.',
    ],
  },
  {
    icon: Sun,
    title: 'Before & after vaccination',
    intro: 'Simple habits around a vaccine appointment help the body respond and recover comfortably.',
    points: [
      'Eat a normal meal before the appointment — arriving hungry is unnecessary and can make dizziness more likely.',
      'Keep feeding as usual on vaccination day, including breastfeeding babies.',
      'A mild fever or sore arm for a day or two is normal; offer extra fluids and light foods.',
      'If fever lasts more than 48 hours or the child refuses all feeds, contact the clinic.',
    ],
  },
];

function NutritionPage() {
  return <PortalPage title="Nutrition">
    <div className="section-kicker">HEALTHY EVERY DAY</div>
    <h2 className="mb-1 mt-3 font-heading text-2xl font-extrabold">Food that supports immunity</h2>
    <p className="mb-6 text-sm text-muted-foreground">Vaccines protect best in a well-nourished body. Simple everyday choices strengthen the defence each dose builds.</p>
    <div className="flex flex-col gap-5">
      {guides.map(({ icon: Icon, title, intro, points }) => (
        <section key={title} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon size={20} /></span>
            <h3 className="font-heading text-lg font-bold">{title}</h3>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">{intro}</p>
          <ul className="flex flex-col gap-2 text-sm">
            {points.map(point => <li key={point} className="flex gap-2"><span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{point}</li>)}
          </ul>
        </section>
      ))}
    </div>
    <p className="mt-6 text-xs text-muted-foreground">General guidance only. For a plan suited to a specific condition, ask at your clinic visit or book an appointment.</p>
  </PortalPage>;
}
