import { z } from 'zod';
import { bloodTypes, calculateBMI, measurementsSchema } from './registration';

export const ugandaDistricts = ['Kampala Central', 'Nakawa', 'Rubaga', 'Makindye', 'Masaka', 'Bukomansimbi', 'Mpigi', 'Jinja', 'Mbarara', 'Mbale'];
export const genders = ['Female', 'Male', 'Other', 'Prefer not to say'];
export const maritalStatuses = ['Single', 'Married', 'Separated', 'Divorced', 'Widowed', 'Prefer not to say'];
const optionalText = z.string().trim().max(100).transform(value => value || null);
const optionalChoice = (options: readonly string[]) => z.string().refine(value => !value || options.includes(value), 'Select a valid option.').transform(value => value || null);
export function profileSchema(today = new Date().toISOString().slice(0, 10)) {
  return z.object({
    first_name: z.string().trim().min(1, 'Enter your first name.').max(100),
    last_name: z.string().trim().min(1, 'Enter your last names.').max(100),
    gender: optionalChoice(genders),
    date_of_birth: z.string().refine(value => {
      if (!value) return true;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const date = new Date(`${value}T00:00:00Z`);
      return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && value <= today;
    }, 'Enter a valid date of birth, not in the future.').transform(value => value || null),
    marital_status: optionalChoice(maritalStatuses),
    nationality: optionalText,
    country: z.string().trim().min(1, 'Enter your residence country.').max(100),
    state_province: optionalText,
    blood_type: optionalChoice(bloodTypes),
    height_cm: z.union([z.literal('').transform(() => null), measurementsSchema.shape.height_cm]),
    weight_kg: z.union([z.literal('').transform(() => null), measurementsSchema.shape.weight_kg]),
  }).refine(value => (value.height_cm === null) === (value.weight_kg === null), { message: 'Enter both height and weight to calculate BMI.', path: ['weight_kg'] });
}
export function profileBMI(height: string, weight: string) {
  if (!height.trim() || !weight.trim()) return null;
  const parsed = measurementsSchema.safeParse({ height_cm: height, weight_kg: weight });
  return parsed.success ? calculateBMI(parsed.data.height_cm, parsed.data.weight_kg) : null;
}export function ageInYears(dob: string, today = new Date().toISOString().slice(0, 10)) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
  const [y, m, d] = dob.split('-').map(Number) as [number, number, number];
  const [ty, tm, td] = today.split('-').map(Number) as [number, number, number];
  return ty - y - (tm < m || (tm === m && td < d) ? 1 : 0);
}
export function bmiCategory(bmi: number) {
  return bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy weight' : bmi < 30 ? 'Overweight' : 'Obese';
}
