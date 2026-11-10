import { describe, expect, it } from 'vitest';
import { ageLabel, humanCategories, petSchedules } from '@/lib/vaccines';
describe('vaccination rules', () => {
  it('shows age in years and months', () => { expect(ageLabel('2015-11-25', new Date('2019-01-30'))).toBe('3 years, 2 months old'); });
  it('human members get Immunity, Travel, Pregnancy and High Risk tabs', () => { expect(humanCategories).toEqual(['immunity', 'travel', 'pregnancy', 'high_risk']); });
  it('cats start with feline distemper at 2 months', () => { expect(petSchedules.cat[0]!.label).toBe('2 Months'); expect(petSchedules.cat[0]!.vaccines[0]!.short).toBe('Feline Distemper Vaccine'); });
});

import { applyContent as ac, immunitySchedule as sched } from '@/lib/vaccines';
describe('clinic content overrides', () => {
  const base = sched[0]!.vaccines[0]!;
  it('replaces filled fields and keeps sample values for empty ones', () => {
    const v = ac(base, { vaccine_key: base.key, short: 'HepB', name: null, description: '  ', dose: null, route: null, group_label: null, info: [{ title: 'Approved', body: 'Text' }] });
    expect(v.short).toBe('HepB');
    expect(v.name).toBe(base.name);
    expect(v.description).toBe(base.description);
    expect(v.info).toEqual([{ title: 'Approved', body: 'Text' }]);
  });
});
