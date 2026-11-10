ALTER TABLE public.appointments ADD COLUMN patient_name text NOT NULL DEFAULT '';
ALTER TABLE public.appointments ADD COLUMN patient_phone text;