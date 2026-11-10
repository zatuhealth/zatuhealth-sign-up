import { describe, expect, it } from 'vitest';
import { calculateBMI, normalizePhone, otpSchema, registrationSchema } from '@/lib/registration';
const details = { first_name:'Ali', last_name:'Jjunju', phone:'+256776886279', contact_email:'', country:'Uganda', password:'securepass123', confirmPassword:'securepass123' };
describe('ZatuHealth registration rules', () => {
  it('uses mobile numbers as the identifier', () => { expect(normalizePhone('0776 886 279','+256')).toBe('+256776886279'); expect(registrationSchema.safeParse({ ...details, phone:'ali@example.com' }).success).toBe(false); });
  it('requires exactly six numeric OTP digits', () => { expect(otpSchema.safeParse('123456').success).toBe(true); for (const value of ['12345','1234567','abcdef']) expect(otpSchema.safeParse(value).success).toBe(false); });
  it('requires matching passwords', () => { expect(registrationSchema.safeParse({ ...details, confirmPassword:'different123' }).success).toBe(false); });
  it('stores the country without asking for blood type at sign up', () => { const value = registrationSchema.parse(details); expect(value.country).toBe('Uganda'); expect('blood_type' in value).toBe(false); });
  it('calculates BMI from height and weight after registration', () => { expect(calculateBMI(170,65)).toBe(22.5); expect(() => calculateBMI(0,65)).toThrow(); });
});
