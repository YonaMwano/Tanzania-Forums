-- ============================================================
-- FIX: "Database error saving new user"
-- Paste this into Supabase SQL Editor and RUN it.
-- ============================================================

-- 1) Ensure the function can write without RLS / search_path issues
CREATE OR REPLACE FUNCTION public.generate_unique_handle()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_handle TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    new_handle := 'user_' || lower(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.users WHERE handle = new_handle) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN new_handle;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
  new_role public.user_role;
  new_handle TEXT;
  meta_name TEXT;
  meta_avatar TEXT;
BEGIN
  -- Count existing profiles
  SELECT COUNT(*) INTO user_count FROM public.users;

  IF user_count = 0 THEN
    new_role := 'admin';
  ELSE
    new_role := 'member';
  END IF;

  new_handle := public.generate_unique_handle();

  meta_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'user_name',
    new_handle
  );

  meta_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  INSERT INTO public.users (id, handle, display_name, avatar_url, role)
  VALUES (NEW.id, new_handle, meta_name, meta_avatar, new_role)
  ON CONFLICT (id) DO NOTHING;

  -- Bootstrap admin audit (non-fatal if it fails)
  IF new_role = 'admin' THEN
    BEGIN
      INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id, metadata)
      VALUES (
        NEW.id,
        'bootstrap_admin',
        'user',
        NEW.id,
        '{"note": "First user auto-promoted to admin"}'::jsonb
      );
    EXCEPTION WHEN OTHERS THEN
      -- Do not block signup if audit insert fails
      NULL;
    END;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log to Postgres logs; still fail clearly so you can see the real message in logs
    RAISE LOG 'handle_new_user failed: % %', SQLERRM, SQLSTATE;
    RAISE;
END;
$$;

-- 2) Recreate trigger cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3) Grants so Auth can run the function
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.users TO postgres, service_role;
GRANT ALL ON TABLE public.audit_log TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.generate_unique_handle() TO postgres, service_role;

-- 4) Allow profile insert from the trigger path (belt-and-suspenders)
DROP POLICY IF EXISTS "Allow trigger insert users" ON public.users;
CREATE POLICY "Allow trigger insert users"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow trigger insert audit" ON public.audit_log;
CREATE POLICY "Allow trigger insert audit"
  ON public.audit_log
  FOR INSERT
  WITH CHECK (true);

-- 5) Optional: if a half-created auth user exists from failed attempts,
--    you can clean them in Authentication > Users in the dashboard,
--    then try Google sign-in again.
