
-- Roles enum + user_roles table
CREATE TYPE public.app_role AS ENUM ('ops', 'driver');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "Users can read their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Ops can read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'ops'));

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id text UNIQUE,
  full_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Ops read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'ops'));
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Vehicles
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  plate text NOT NULL,
  km_rate numeric(10,2) NOT NULL CHECK (km_rate >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can read vehicles" ON public.vehicles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Ops manage vehicles - insert" ON public.vehicles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'ops'));
CREATE POLICY "Ops manage vehicles - update" ON public.vehicles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'ops')) WITH CHECK (public.has_role(auth.uid(), 'ops'));
CREATE POLICY "Ops manage vehicles - delete" ON public.vehicles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'ops'));

-- Trips
CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  start_km numeric(12,2) NOT NULL CHECK (start_km >= 0),
  end_km numeric(12,2) NOT NULL CHECK (end_km >= 0),
  petrol_cost numeric(12,2) NOT NULL CHECK (petrol_cost >= 0),
  toll_paid numeric(12,2) NOT NULL DEFAULT 0 CHECK (toll_paid >= 0),
  km_rate_snapshot numeric(10,2) NOT NULL CHECK (km_rate_snapshot >= 0),
  receipt_path text NOT NULL,
  destination text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_km > start_km)
);
CREATE INDEX trips_driver_created_idx ON public.trips (driver_user_id, created_at DESC);
CREATE INDEX trips_created_idx ON public.trips (created_at DESC);

GRANT SELECT, INSERT ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Driver inserts own trip" ON public.trips
  FOR INSERT TO authenticated
  WITH CHECK (driver_user_id = auth.uid() AND public.has_role(auth.uid(), 'driver'));
CREATE POLICY "Driver reads own trips" ON public.trips
  FOR SELECT TO authenticated USING (driver_user_id = auth.uid());
CREATE POLICY "Ops reads all trips" ON public.trips
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'ops'));

-- Trip rules trigger
CREATE OR REPLACE FUNCTION public.enforce_trip_rules()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  recent_count int;
  dup_count int;
BEGIN
  SELECT COUNT(*) INTO recent_count FROM public.trips
    WHERE driver_user_id = NEW.driver_user_id
      AND created_at > now() - interval '1 hour';
  IF recent_count >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded: max 10 trips per hour' USING ERRCODE = 'P0001';
  END IF;

  SELECT COUNT(*) INTO dup_count FROM public.trips
    WHERE driver_user_id = NEW.driver_user_id
      AND vehicle_id = NEW.vehicle_id
      AND start_km = NEW.start_km
      AND end_km = NEW.end_km
      AND created_at > now() - interval '2 minutes';
  IF dup_count > 0 THEN
    RAISE EXCEPTION 'Duplicate trip detected within 2 minutes' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER trips_enforce_rules BEFORE INSERT ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.enforce_trip_rules();

-- New user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_account_type text;
  v_driver_id text;
  v_full_name text;
  v_ops_count int;
BEGIN
  v_account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'ops');
  v_driver_id := NEW.raw_user_meta_data->>'driver_id';
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  IF v_account_type = 'driver' THEN
    INSERT INTO public.profiles (id, driver_id, full_name) VALUES (NEW.id, v_driver_id, v_full_name);
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'driver');
  ELSE
    SELECT COUNT(*) INTO v_ops_count FROM public.user_roles WHERE role = 'ops';
    IF v_ops_count = 0 OR COALESCE((NEW.raw_user_meta_data->>'invited')::boolean, false) THEN
      INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, v_full_name);
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'ops');
    ELSE
      RAISE EXCEPTION 'Ops signup is invite-only after the first account' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_trip_rules() FROM PUBLIC, anon, authenticated;

-- Storage policies for receipts bucket (bucket created via tool)
CREATE POLICY "Drivers upload own receipts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.has_role(auth.uid(), 'driver')
  );
CREATE POLICY "Drivers read own receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Ops read all receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts'
    AND public.has_role(auth.uid(), 'ops')
  );
