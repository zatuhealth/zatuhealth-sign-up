CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  dependent_id uuid REFERENCES public.dependents(id) ON DELETE CASCADE,
  service text NOT NULL,
  clinic text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'booked' CHECK (status IN ('booked','checked_in','completed','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or staff read appointments" ON public.appointments FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "Own appointments insert" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id AND (dependent_id IS NULL OR EXISTS (SELECT 1 FROM public.dependents d WHERE d.id = dependent_id AND d.owner_id = auth.uid())));
CREATE POLICY "Own or staff update appointments" ON public.appointments FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));

CREATE SEQUENCE public.invoice_number_seq START 123000;
GRANT USAGE ON SEQUENCE public.invoice_number_seq TO authenticated, service_role;
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE DEFAULT lpad(nextval('public.invoice_number_seq')::text, 9, '0'),
  owner_id uuid NOT NULL,
  dependent_id uuid REFERENCES public.dependents(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  clinic_name text NOT NULL,
  patient_name text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  amount_ugx numeric NOT NULL CHECK (amount_ugx >= 0),
  due_on date,
  status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid','cancelled')),
  payment_method text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or staff read invoices" ON public.invoices FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "Staff create invoices" ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "Staff update invoices" ON public.invoices FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));

CREATE OR REPLACE FUNCTION public.get_invoice_for_payment(_number text)
RETURNS TABLE (invoice_number text, clinic_name text, patient_name text, items jsonb, amount_ugx numeric, due_on date, status text, paid_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT invoice_number, clinic_name, patient_name, items, amount_ugx, due_on, status, paid_at
  FROM public.invoices WHERE invoices.invoice_number = _number LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.get_invoice_for_payment(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.verify_certificate(_member uuid)
RETURNS TABLE (full_name text, date_of_birth date, vaccine_key text, taken_on date)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(NULLIF(trim(coalesce(d.first_name,'')||' '||coalesce(d.last_name,'')),''), d.name), d.date_of_birth, r.vaccine_key, r.taken_on
  FROM public.dependents d LEFT JOIN public.vaccination_records r ON r.dependent_id = d.id AND r.taken
  WHERE d.id = _member
  UNION ALL
  SELECT p.first_name||' '||p.last_name, p.date_of_birth, r.vaccine_key, r.taken_on
  FROM public.profiles p LEFT JOIN public.vaccination_records r ON r.owner_id = p.id AND r.dependent_id IS NULL AND r.taken
  WHERE p.id = _member
$$;
GRANT EXECUTE ON FUNCTION public.verify_certificate(uuid) TO anon, authenticated;