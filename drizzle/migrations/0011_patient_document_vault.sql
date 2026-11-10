CREATE TABLE public.patient_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  dependent_id uuid REFERENCES public.dependents(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  storage_path text NOT NULL UNIQUE,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_documents TO authenticated;
GRANT ALL ON public.patient_documents TO service_role;
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.document_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.patient_documents(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  clinic_name text NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.document_shares TO authenticated;
GRANT ALL ON public.document_shares TO service_role;
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.document_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.patient_documents(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  action text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.document_access_log TO authenticated;
GRANT ALL ON public.document_access_log TO service_role;
ALTER TABLE public.document_access_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.document_shared_with_staff(_doc uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (public.has_role(auth.uid(),'staff') OR public.has_role(auth.uid(),'admin'))
    AND EXISTS (SELECT 1 FROM public.document_shares s WHERE s.document_id = _doc AND s.revoked_at IS NULL AND s.expires_at > now())
$$;

CREATE POLICY "Own documents all" ON public.patient_documents FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id AND storage_path LIKE auth.uid()::text || '/documents/%'
    AND (dependent_id IS NULL OR EXISTS (SELECT 1 FROM public.dependents d WHERE d.id = dependent_id AND d.owner_id = auth.uid())));
CREATE POLICY "Staff read actively shared documents" ON public.patient_documents FOR SELECT TO authenticated
  USING (public.document_shared_with_staff(id));

CREATE POLICY "Own shares read" ON public.document_shares FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR ((public.has_role(auth.uid(),'staff') OR public.has_role(auth.uid(),'admin')) AND revoked_at IS NULL AND expires_at > now()));
CREATE POLICY "Own shares insert" ON public.document_shares FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.patient_documents p WHERE p.id = document_id AND p.owner_id = auth.uid()));
CREATE POLICY "Own shares update" ON public.document_shares FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner reads access log" ON public.document_access_log FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);
CREATE POLICY "Actors write own log" ON public.document_access_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = actor_id AND (auth.uid() = owner_id OR public.document_shared_with_staff(document_id))
    AND EXISTS (SELECT 1 FROM public.patient_documents p WHERE p.id = document_id AND p.owner_id = document_access_log.owner_id));

CREATE POLICY "Staff read shared document files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'member-photos' AND EXISTS (SELECT 1 FROM public.patient_documents p WHERE p.storage_path = storage.objects.name AND public.document_shared_with_staff(p.id)));