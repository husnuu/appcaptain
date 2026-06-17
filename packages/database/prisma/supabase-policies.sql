-- =====================================================================
-- Supabase-specific setup: applied AFTER `prisma migrate deploy`.
-- Prisma does not manage the `auth` schema or RLS. Idempotent: safe to re-run.
-- =====================================================================

-- 1) Link profiles.id -> auth.users.id and auto-provision a profile row
--    whenever a new auth user is created.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_auth_users_fk;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_auth_users_fk
  FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, "fullName", role, "createdAt", "updatedAt")
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
    'OWNER',
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) Helper: is the current user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN'
  );
$$;

-- 3) Row Level Security (defense-in-depth; the API also enforces ownership).
ALTER TABLE public.boats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS boats_owner_all ON public.boats;
CREATE POLICY boats_owner_all ON public.boats
  FOR ALL USING ("ownerId" = auth.uid() OR public.is_admin())
  WITH CHECK ("ownerId" = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS boats_public_read ON public.boats;
CREATE POLICY boats_public_read ON public.boats
  FOR SELECT USING (status = 'ACTIVE' OR "ownerId" = auth.uid() OR public.is_admin());

-- Child tables inherit access from the parent boat's owner.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'boat_listing_models','boat_feature_values','boat_amenities',
    'boat_photos','boat_pricing','boat_seasonal_prices','boat_extras','boat_documents'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %1$s_owner_all ON public.%1$I;', t);
    EXECUTE format($f$
      CREATE POLICY %1$s_owner_all ON public.%1$I
        FOR ALL USING (
          EXISTS (SELECT 1 FROM public.boats b WHERE b.id = %1$I."boatId"
                  AND (b."ownerId" = auth.uid() OR public.is_admin()))
        )
        WITH CHECK (
          EXISTS (SELECT 1 FROM public.boats b WHERE b.id = %1$I."boatId"
                  AND (b."ownerId" = auth.uid() OR public.is_admin()))
        );
    $f$, t);
  END LOOP;
END $$;

-- Profiles: a user can read/update only their own profile; admins read all.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_self ON public.profiles;
CREATE POLICY profiles_self ON public.profiles
  FOR ALL USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- 4) Storage buckets. Photos public, documents private.
INSERT INTO storage.buckets (id, name, public)
VALUES ('boat-photos', 'boat-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('boat-documents', 'boat-documents', false)
ON CONFLICT (id) DO NOTHING;
