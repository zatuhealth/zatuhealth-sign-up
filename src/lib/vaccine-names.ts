import { catalogFor } from '@/lib/vaccines';

const all = [...catalogFor('human'), ...catalogFor('pet', 'cat'), ...catalogFor('pet', 'dog')];
const names = new Map(all.map(v => [v.key, v.name || v.short]));
export const vaccineName = (key: string) => names.get(key) ?? key;
