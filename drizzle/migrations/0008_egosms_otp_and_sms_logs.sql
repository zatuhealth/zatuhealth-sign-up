CREATE TABLE public.phone_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.phone_otps TO service_role;
ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;
CREATE INDEX phone_otps_phone_idx ON public.phone_otps (phone, created_at DESC);

CREATE TABLE public.sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid,
  phone text NOT NULL,
  kind text NOT NULL,
  dedupe_key text,
  message text NOT NULL,
  status text NOT NULL,
  provider_response text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sms_logs TO authenticated;
GRANT ALL ON public.sms_logs TO service_role;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read sms logs" ON public.sms_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE UNIQUE INDEX sms_logs_dedupe_idx ON public.sms_logs (dedupe_key) WHERE dedupe_key IS NOT NULL AND status = 'sent';