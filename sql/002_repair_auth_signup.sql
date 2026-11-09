-- Targeted repair for the existing Supabase Auth signup trigger.
-- Run against the existing Supabase project, not the Netlify application database.
-- This preserves accounts and forum data; do not rerun the initial schema.
BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
  new_role public.user_role;
  new_handle TEXT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.users;
  
  IF user_count = 0 THEN
    new_role := 'admin';
  ELSE
    new_role := 'member';
  END IF;
  
  new_handle := public.generate_unique_handle();
  
  INSERT INTO public.users (id, handle, display_name, avatar_url, role)
  VALUES (
    NEW.id,
    new_handle,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', new_handle),
    NEW.raw_user_meta_data->>'avatar_url',
    new_role
  );
  
  -- Audit log for bootstrap admin
  IF new_role = 'admin' THEN
    INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id, metadata)
    VALUES (NEW.id, 'bootstrap_admin', 'user', NEW.id, '{"note": "First user auto-promoted to admin"}'::jsonb);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;
