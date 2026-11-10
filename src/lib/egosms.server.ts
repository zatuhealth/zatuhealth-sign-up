// EgoSMS gateway (Uganda). Server-only: reads EGOSMS_* secrets.
export async function sendEgoSms(phone: string, message: string): Promise<{ ok: boolean; response: string }> {
  const username = process.env['EGOSMS_USERNAME'];
  const password = process.env['EGOSMS_PASSWORD'];
  const senderid = process.env['EGOSMS_SENDER_ID'];
  if (!username || !password || !senderid) return { ok: false, response: 'EgoSMS is not configured' };
  const number = phone.replace(/\D/g, '');
  const res = await fetch('https://comms.egosms.co/api/v1/json/', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ method: 'SendSms', userdata: { username, password }, msgdata: [{ number, message, senderid, priority: '0' }] }),
  });
  const text = await res.text();
  let ok = res.ok;
  try { const json = JSON.parse(text) as { Status?: string }; ok = ok && String(json.Status).toUpperCase() === 'OK'; } catch { ok = false; }
  return { ok, response: text.slice(0, 500) };
}

export async function logSms(row: { owner_id?: string | null; phone: string; kind: string; dedupe_key?: string | null; message: string; status: string; provider_response?: string }) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  await supabaseAdmin.from('sms_logs').insert(row);
}
