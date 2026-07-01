
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS aadhaar_path text,
  ADD COLUMN IF NOT EXISTS license_path text;
