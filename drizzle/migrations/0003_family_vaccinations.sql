CREATE TABLE public.dependents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL,
 kind text NOT NULL DEFAULT 'human' CHECK (kind IN ('human','pet')),
 name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
 relationship text NOT NULL CHECK (char_length(relationship) BETWEEN 1 AND 50),
 species text CHECK (species IS NULL OR species IN ('cat','dog')),
 gender text CHECK (gender IS NULL OR gender IN ('Male','Female')),
 date_of_birth date,
 country text CHECK (country IS NULL OR char_length(country) <= 100),
 state_province text CHECK (state_province IS NULL OR char_length(state_province) <= 100),
 vaccination_center text CHECK (vaccination_center IS NULL OR char_length(vaccination_center) <= 150),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dependents TO authenticated;
GRANT ALL ON public.dependents TO service_role;
ALTER TABLE public.dependents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own dependents select" ON public.dependents FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Own dependents insert" ON public.dependents FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Own dependents update" ON public.dependents FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Own dependents delete" ON public.dependents FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE public.vaccination_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL,
 dependent_id uuid REFERENCES public.dependents(id) ON DELETE CASCADE,
 vaccine_key text NOT NULL CHECK (char_length(vaccine_key) BETWEEN 1 AND 80),
 taken boolean NOT NULL DEFAULT false,
 taken_on date,
 note text CHECK (note IS NULL OR char_length(note) <= 1000),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX vaccination_records_unique ON public.vaccination_records (owner_id, COALESCE(dependent_id, '00000000-0000-0000-0000-000000000000'::uuid), vaccine_key);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vaccination_records TO authenticated;
GRANT ALL ON public.vaccination_records TO service_role;
ALTER TABLE public.vaccination_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own records select" ON public.vaccination_records FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Own records insert" ON public.vaccination_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND (dependent_id IS NULL OR EXISTS (SELECT 1 FROM public.dependents d WHERE d.id = dependent_id AND d.owner_id = auth.uid())));
CREATE POLICY "Own records update" ON public.vaccination_records FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id AND (dependent_id IS NULL OR EXISTS (SELECT 1 FROM public.dependents d WHERE d.id = dependent_id AND d.owner_id = auth.uid())));
CREATE POLICY "Own records delete" ON public.vaccination_records FOR DELETE TO authenticated USING (auth.uid() = owner_id);