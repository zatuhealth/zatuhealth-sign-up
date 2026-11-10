export type Category = 'immunity' | 'travel' | 'pregnancy' | 'high_risk' | 'pet';
export type InfoSection = { title: string; body: string };
export type Vaccine = {
  key: string;
  short: string;
  name: string;
  route?: string | undefined;
  dose?: string | undefined;
  description: string;
  info: InfoSection[];
};
export type VaccineGroup = { id: string; label: string; clinicNote?: string; vaccines: Vaccine[] };

export const categoryLabels: Record<Category, string> = {
  immunity: 'Immunity', travel: 'Travel', pregnancy: 'Pregnancy', high_risk: 'High Risk', pet: 'Pet',
};
export const humanCategories: Category[] = ['immunity', 'travel', 'pregnancy', 'high_risk'];

const hbv: Vaccine = {
  key: 'hbv', short: 'HBV', name: 'Hepatitis B vaccine', route: 'I.M (Intramuscular)',
  description: 'HB vaccine protects against infection from the hepatitis B virus.',
  info: [
    { title: 'What is this vaccine?', body: 'A vaccine that protects against hepatitis B, a liver infection caused by the hepatitis B virus.' },
    { title: 'Who should get this vaccine?', body: 'All newborns within 24 hours of birth, unvaccinated children and adults at risk of infection.' },
    { title: 'The benefits of this vaccine', body: 'Prevents chronic liver disease, cirrhosis and liver cancer caused by hepatitis B.' },
    { title: 'Adverse events', body: 'Common reactions may include soreness, swelling or redness where the vaccine was given. Some children may experience fever or fatigue.' },
    { title: 'Associated disease', body: 'Hepatitis B.' },
    { title: 'Spread of the disease', body: 'Through contact with infected blood or body fluids, including from mother to baby at birth.' },
    { title: 'Symptoms of the disease', body: 'Fever, fatigue, loss of appetite, nausea, dark urine, joint pain and yellowing of the skin or eyes.' },
    { title: 'Vaccine(s) to prevent the disease', body: 'Hepatitis B vaccine (HBV).' },
  ],
};
const simple = (key: string, short: string, name: string, description: string, dose?: string, route?: string): Vaccine => ({
  key, short, name, description, dose, route,
  info: [
    { title: 'What is this vaccine?', body: description },
    { title: 'Adverse events', body: 'Mild soreness, redness or swelling at the injection site; occasional low fever.' },
    { title: 'More information', body: 'Ask your vaccination center or doctor for advice about timing and doses.' },
  ],
});

export const immunitySchedule: VaccineGroup[] = [
  { id: 'birth', label: 'Within 24 hrs of birth', vaccines: [hbv, simple('bcg', 'BCG', 'Bacille Calmette-Guérin', 'Protects against severe forms of tuberculosis.', 'Single dose', 'I.D (Intradermal)'), simple('opv0', 'OPV 0', 'Oral polio vaccine', 'Protects against poliomyelitis.', 'Birth dose', 'Oral')] },
  { id: '6w', label: '6 weeks', vaccines: [simple('dtp1', 'DTP-HepB-Hib 1', 'Pentavalent vaccine', 'Protects against diphtheria, tetanus, pertussis, hepatitis B and Hib.', 'Dose 1', 'I.M (Intramuscular)'), simple('pcv1', 'PCV 1', 'Pneumococcal conjugate vaccine', 'Protects against pneumococcal disease.', 'Dose 1', 'I.M (Intramuscular)')] },
  { id: '9m', label: '9 months', vaccines: [simple('mr1', 'MR 1', 'Measles-Rubella vaccine', 'Protects against measles and rubella.', 'Dose 1', 'S.C (Subcutaneous)'), simple('yf', 'Yellow Fever', 'Yellow fever vaccine', 'Protects against yellow fever.', 'Single dose', 'S.C (Subcutaneous)')] },
];

export const travelDestinations = ['Afghanistan', 'Kenya', 'Saudi Arabia', 'Uganda', 'United States', 'India'];
export const travelGroups: VaccineGroup[] = [
  { id: 'routine', label: 'Routine Vaccines - All Travelers', vaccines: [simple('t_mmr', 'MMR', 'Measles, Mumps and Rubella', 'Make sure routine vaccines are up to date before every trip.'), simple('t_polio', 'Polio', 'Polio booster', 'Adult booster recommended for some destinations.')] },
  { id: 'most', label: 'Most Travelers', vaccines: [simple('t_hepa', 'Hepatitis A', 'Hepatitis A vaccine', 'Protects against hepatitis A spread through contaminated food and water.'), simple('t_typhoid', 'Typhoid', 'Typhoid vaccine', 'Protects against typhoid fever.')] },
  { id: 'some', label: 'Some Travelers', vaccines: [{ ...hbv, key: 't_hepb', short: 'Hepatitis B' }, simple('t_malaria', 'Malaria', 'Malaria vaccine', 'Malaria vaccine provides sustained protection against severe malaria.'), simple('t_rabies', 'Rabies', 'Rabies vaccine', 'Rabies vaccine provides protection against infection from the virus that causes rabies.')] },
];

export const pregnancyPhases = ['Before pregnancy', 'During pregnancy', 'After delivery'];
const mmr: Vaccine = {
  key: 'p_mmr', short: 'MMR', name: 'Measles, Mumps and Rubella vaccine', description: 'Measles, Mumps and Rubella vaccine',
  info: [
    { title: 'The benefits of this vaccine', body: 'The best protection against rubella is MMR vaccine. Rubella is very dangerous if you get it while pregnant and can cause a miscarriage or serious birth defects.' },
    { title: 'Recommendations', body: 'Have a pre-pregnancy blood test to check immunity. If you need the vaccine, avoid becoming pregnant until one month after receiving it.' },
    { title: 'More information', body: 'MMR is not given during pregnancy. Speak to your doctor.' },
  ],
};
export const pregnancyGroups: Record<string, VaccineGroup[]> = {
  'Before pregnancy': [{ id: 'pre', label: 'Before pregnancy', vaccines: [mmr, simple('p_varicella', 'Varicella', 'Chickenpox vaccine', 'Protects against chickenpox before pregnancy.')] }],
  'During pregnancy': [{ id: 'during', label: 'During pregnancy', vaccines: [simple('p_tdap', 'Tdap', 'Tetanus, diphtheria and pertussis', 'Protects mother and newborn against whooping cough.', '27–36 weeks'), simple('p_flu', 'Influenza', 'Flu vaccine', 'Safe during any trimester.')] }],
  'After delivery': [{ id: 'after', label: 'After delivery', vaccines: [{ ...mmr, key: 'p_mmr_post' }] }],
};

export const highRiskConditions = ['Diabetes Mellitus', 'Chronic heart disease', 'Chronic kidney disease', 'HIV'];
const pcv13 = simple('hr_pcv13', 'Pneumococcal Conjugate (PCV13)', 'Pneumococcal conjugate vaccine', 'Protects against pneumococcal disease.', 'Single Dose');
const ppsv23 = simple('hr_ppsv23', 'Pneumococcal (PPSV23)', 'Pneumococcal polysaccharide vaccine', 'Additional pneumococcal protection.', '1 Dose and revaccination after 5 years');
export const highRiskGroups: Record<string, VaccineGroup[]> = Object.fromEntries(highRiskConditions.map(c => [c, [{ id: c, label: c, vaccines: [pcv13, ppsv23, simple('hr_flu', 'Influenza', 'Yearly flu vaccine', 'Recommended every year for chronic conditions.', 'Annual')] }]]));

export const petSchedules: Record<'cat' | 'dog', VaccineGroup[]> = {
  cat: [{ id: 'c2m', label: '2 Months', vaccines: [simple('cat_fvrcp', 'Feline Distemper Vaccine', 'FVRCP', 'Protects against feline panleukopenia, rhinotracheitis and calicivirus.')] }, { id: 'c4m', label: '4 Months', vaccines: [simple('cat_rabies', 'Rabies', 'Rabies vaccine', 'Required by law in many countries.')] }],
  dog: [{ id: 'd2m', label: '2 Months', vaccines: [simple('dog_dhpp', 'DHPP', 'Canine distemper combination', 'Protects against distemper, hepatitis, parvovirus and parainfluenza.')] }, { id: 'd4m', label: '4 Months', vaccines: [simple('dog_rabies', 'Rabies', 'Rabies vaccine', 'Required by law in many countries.')] }],
};
export const petDiseases: Record<'cat' | 'dog', { title: string; diseases: string[]; more: string }> = {
  cat: { title: 'Diseases That Can Be Spread By Cats', diseases: ['Campylobacteriosis', 'Cat Scratch Disease', 'Cat Tapeworm', 'Toxoplasmosis'], more: 'Campylobacter are bacteria that can make people and animals sick. Cats may appear healthy and show no signs of infection, or they can have diarrhea.' },
  dog: { title: 'Diseases That Can Be Spread By Dogs', diseases: ['Rabies', 'Campylobacteriosis', 'Dog Tapeworm', 'Leptospirosis'], more: 'Rabies is spread through bites and saliva of infected animals. Keep your dog vaccinated and see a doctor after any bite.' },
};

export function ageLabel(dob: string | null, now = new Date()) {
  if (!dob) return '';
  const d = new Date(dob);
  let months = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
  if (now.getDate() < d.getDate()) months -= 1;
  if (months < 0) return '';
  const y = Math.floor(months / 12), m = months % 12;
  return `${y} year${y === 1 ? '' : 's'}, ${m} month${m === 1 ? '' : 's'} old`;
}

export function catalogFor(kind: 'human' | 'pet', species?: string | null): Vaccine[] {
  const groups = kind === 'pet'
    ? petSchedules[(species as 'cat' | 'dog') ?? 'cat'] ?? petSchedules.cat
    : [...immunitySchedule, ...travelGroups, ...Object.values(pregnancyGroups).flat(), ...(highRiskGroups[highRiskConditions[0]!] ?? [])];
  const seen = new Map<string, Vaccine>();
  for (const g of groups) for (const v of g.vaccines) if (!seen.has(v.key)) seen.set(v.key, v);
  return [...seen.values()];
}

export type VaccineContent = { vaccine_key: string; short: string | null; name: string | null; description: string | null; dose: string | null; route: string | null; group_label: string | null; info: unknown };
/** Clinic-approved content overrides sample text; empty fields keep the sample value. */
export function applyContent(v: Vaccine, c?: VaccineContent): Vaccine {
  if (!c) return v;
  const info = Array.isArray(c.info) ? (c.info as InfoSection[]).filter(s => s && s.title?.trim() && s.body?.trim()) : [];
  return { ...v, short: c.short?.trim() || v.short, name: c.name?.trim() || v.name, description: c.description?.trim() || v.description,
    dose: c.dose?.trim() || v.dose, route: c.route?.trim() || v.route, info: info.length ? info : v.info };
}
export const groupContentKey = (groupId: string) => `group:${groupId}`;
export function allScheduleGroups(): VaccineGroup[] {
  const seen = new Map<string, VaccineGroup>();
  for (const g of [...immunitySchedule, ...travelGroups, ...Object.values(pregnancyGroups).flat(), ...(highRiskGroups[highRiskConditions[0]!] ?? []), ...petSchedules.cat, ...petSchedules.dog]) if (!seen.has(g.id)) seen.set(g.id, g);
  return [...seen.values()];
}
