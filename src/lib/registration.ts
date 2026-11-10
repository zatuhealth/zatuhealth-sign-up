import { z } from 'zod';

export const countries = [
  { name: 'Uganda', code: 'UG', dial: '+256', flag: '🇺🇬' },
  { name: 'Kenya', code: 'KE', dial: '+254', flag: '🇰🇪' },
  { name: 'Tanzania', code: 'TZ', dial: '+255', flag: '🇹🇿' },
  { name: 'Rwanda', code: 'RW', dial: '+250', flag: '🇷🇼' },
  { name: 'South Sudan', code: 'SS', dial: '+211', flag: '🇸🇸' },
  { name: 'Democratic Republic of the Congo', code: 'CD', dial: '+243', flag: '🇨🇩' },
  { name: 'Burundi', code: 'BI', dial: '+257', flag: '🇧🇮' },
  { name: 'United Kingdom', code: 'GB', dial: '+44', flag: '🇬🇧' },
  { name: 'United States', code: 'US', dial: '+1', flag: '🇺🇸' },
] as const;
export const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'] as const;
export const phoneSchema = z.string().regex(/^\+[1-9]\d{7,14}$/, 'Enter a valid mobile number with its country code.');
export const otpSchema = z.string().regex(/^\d{6}$/, 'Enter the six-digit code sent to your mobile.');
export const passwordSchema = z.string().min(8, 'Use at least 8 characters.').max(128, 'Use no more than 128 characters.');
export const registrationSchema = z.object({
  first_name: z.string().trim().min(1, 'Enter your first name.').max(100),
  last_name: z.string().trim().min(1, 'Enter your last name.').max(100),
  phone: phoneSchema,
  contact_email: z.union([z.string().trim().email('Enter a valid email address.').max(255), z.literal('')]),
  country: z.string().refine(value => countries.some(country => country.name === value), 'Select your country.'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(value => value.password === value.confirmPassword, { message: 'Passwords do not match.', path: ['confirmPassword'] });
export const measurementsSchema = z.object({ height_cm: z.coerce.number().min(30, 'Height must be between 30 and 300 cm.').max(300, 'Height must be between 30 and 300 cm.'), weight_kg: z.coerce.number().min(1, 'Weight must be between 1 and 500 kg.').max(500, 'Weight must be between 1 and 500 kg.') });
export function normalizePhone(value: string, dial: string) {
  const clean = value.replace(/[\s()-]/g, '');
  return clean.startsWith('+') ? clean : dial + clean.replace(/^0/, '');
}
export function calculateBMI(height: number, weight: number) {
  const parsed = measurementsSchema.parse({ height_cm: height, weight_kg: weight });
  return Math.round(parsed.weight_kg / ((parsed.height_cm / 100) ** 2) * 10) / 10;
}