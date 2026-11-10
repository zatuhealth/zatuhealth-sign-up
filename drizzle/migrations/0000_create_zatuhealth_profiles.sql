CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 first_name text NOT NULL CHECK (char_length(first_name) BETWEEN 1 AND 100),
 last_name text NOT NULL CHECK (char_length(last_name) BETWEEN 1 AND 100),
 mobile_number text NOT NULL UNIQUE CHECK (mobile_number ~ '^\+[1-9][0-9]{7,14}$'),
 email text CHECK (email IS NULL OR (char_length(email) <= 255 AND email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$')),
 country text NOT NULL CHECK (char_length(country) BETWEEN 2 AND 100),
 blood_type text CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown')),
 height_cm numeric CHECK (height_cm BETWEEN 30 AND 300),
 weight_kg numeric CHECK (weight_kg BETWEEN 1 AND 500),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (height_cm, weight_kg) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own verified profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id AND EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND phone_confirmed_at IS NOT NULL));
CREATE POLICY "Update own health measurements" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE FUNCTION public.handle_zatuhealth_signup() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NEW.phone IS NOT NULL AND NEW.phone <> '' THEN
 INSERT INTO public.profiles (id, first_name, last_name, mobile_number, email, country, blood_type)
 VALUES (NEW.id, NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name', '+' || ltrim(NEW.phone, '+'), nullif(NEW.raw_user_meta_data->>'contact_email',''), NEW.raw_user_meta_data->>'country', NEW.raw_user_meta_data->>'blood_type');
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER on_zatuhealth_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_zatuhealth_signup();