DROP POLICY "Read own verified profile" ON public.profiles;
CREATE POLICY "Read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);