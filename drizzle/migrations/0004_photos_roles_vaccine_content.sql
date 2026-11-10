ALTER TABLE public.dependents ADD COLUMN photo_path text;

CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'patient');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE TABLE public.vaccine_content (
  vaccine_key text PRIMARY KEY,
  short text,
  name text,
  description text,
  dose text,
  route text,
  group_label text,
  info jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.vaccine_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.vaccine_content TO authenticated;
GRANT ALL ON public.vaccine_content TO service_role;
ALTER TABLE public.vaccine_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads vaccine content" ON public.vaccine_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert vaccine content" ON public.vaccine_content FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update vaccine content" ON public.vaccine_content FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete vaccine content" ON public.vaccine_content FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Own member photos read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'member-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own member photos insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'member-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own member photos update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'member-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own member photos delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'member-photos' AND (storage.foldername(name))[1] = auth.uid()::text);