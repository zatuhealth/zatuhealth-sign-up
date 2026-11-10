import { describe, expect, it } from 'vitest';
import { profileBMI, profileSchema, ugandaDistricts } from '@/lib/profile';

const values = { first_name: 'Ali', last_name: 'Jjunju', gender: 'Male', date_of_birth: '1990-01-15', marital_status: 'Married', nationality: 'Ugandan', country: 'Uganda', state_province: 'Nakawa', blood_type: 'O+', height_cm: '170', weight_kg: '65' };
describe('Edit profile data', () => {
  it('retains all supplied personal details', () => {
    expect(profileSchema('2026-10-30').parse(values)).toEqual({ ...values, height_cm: 170, weight_kg: 65 });
  });
  it('supports all blood types and rejects invalid types', () => {
    for (const blood_type of ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']) expect(profileSchema().parse({ ...values, blood_type }).blood_type).toBe(blood_type);
    expect(profileSchema().safeParse({ ...values, blood_type: 'C+' }).success).toBe(false);
  });
  it('calculates BMI from kilograms and centimetres', () => {
    expect(profileBMI('170', '65')).toBe(22.5);
    expect(profileBMI('', '65')).toBeNull();
    expect(profileBMI('0', '65')).toBeNull();
  });
  it('provides the requested Uganda examples without restricting other districts', () => {
    expect(ugandaDistricts).toEqual(['Kampala Central', 'Nakawa', 'Rubaga', 'Makindye', 'Masaka', 'Bukomansimbi', 'Mpigi', 'Jinja', 'Mbarara', 'Mbale']);
    expect(profileSchema().parse({ ...values, state_province: 'Wakiso' }).state_province).toBe('Wakiso');
  });
  it('rejects impossible or future birth dates', () => {
    for (const date_of_birth of ['2026-10-31', '2026-02-30']) expect(profileSchema('2026-10-30').safeParse({ ...values, date_of_birth }).success).toBe(false);
  });
  it('allows missing health details but requires paired measurements', () => {
    expect(profileSchema().parse({ ...values, height_cm: '', weight_kg: '', blood_type: '' }).height_cm).toBeNull();
    expect(profileSchema().safeParse({ ...values, height_cm: '' }).success).toBe(false);
  });
});
import { ageInYears, bmiCategory } from '@/lib/profile';
describe('dependent adult rules', () => {
  it('counts 18 only on or after the birthday', () => {
    expect(ageInYears('2008-10-30', '2026-10-30')).toBe(18);
    expect(ageInYears('2008-10-31', '2026-10-30')).toBe(17);
  });
  it('labels BMI ranges', () => {
    expect(bmiCategory(18.4)).toBe('Underweight');
    expect(bmiCategory(22)).toBe('Healthy weight');
    expect(bmiCategory(27)).toBe('Overweight');
    expect(bmiCategory(31)).toBe('Obese');
  });
});
