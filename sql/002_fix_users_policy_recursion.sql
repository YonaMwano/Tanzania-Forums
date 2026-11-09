BEGIN;

-- Run as the database owner. The role lookup bypasses users RLS to avoid
-- recursively evaluating the policy on the same table.
CREATE OR REPLACE FUNCTION public.is_forum_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_forum_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_forum_admin() TO anon, authenticated;

DROP POLICY IF EXISTS "Admins full access users" ON public.users;
CREATE POLICY "Admins full access users" ON public.users
  FOR ALL USING ((SELECT public.is_forum_admin()))
  WITH CHECK ((SELECT public.is_forum_admin()));

COMMIT;
