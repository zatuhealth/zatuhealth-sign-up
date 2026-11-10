// Browser-safe: mobile numbers map to a deterministic account handle used by Cloud Auth.
export function phoneAuthEmail(phone: string) {
  return `${phone.replace(/\D/g, '')}@phone.zatuhealth.com`;
}
