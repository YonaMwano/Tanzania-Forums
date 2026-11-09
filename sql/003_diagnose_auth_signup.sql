-- Read-only diagnostics for signup failures after repair 002 succeeded.
-- Run in the same Supabase project used by the deployed application.
-- No accounts, tokens, email addresses, or function bodies are selected.
BEGIN TRANSACTION READ ONLY;

-- Check that all dependencies of this repository's signup trigger exist.
SELECT 'profile table' AS dependency, to_regclass('public.users') IS NOT NULL AS present
UNION ALL SELECT 'audit table', to_regclass('public.audit_log') IS NOT NULL
UNION ALL SELECT 'role enum', to_regtype('public.user_role') IS NOT NULL
UNION ALL SELECT 'handle helper', to_regprocedure('public.generate_unique_handle()') IS NOT NULL
UNION ALL SELECT 'signup function', to_regprocedure('public.handle_new_user()') IS NOT NULL;

-- Additional triggers can fail even if the repaired trigger is correct.
SELECT ns.nspname AS table_schema, tbl.relname AS table_name,
       t.tgname AS trigger_name, t.tgenabled AS enabled,
       fn_ns.nspname AS function_schema, fn.proname AS function_name,
       pg_get_userbyid(fn.proowner) AS function_owner,
       fn.prosecdef AS security_definer,
       owner.rolsuper OR owner.rolbypassrls AS owner_bypasses_rls
FROM pg_trigger t
JOIN pg_class tbl ON tbl.oid = t.tgrelid
JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
JOIN pg_proc fn ON fn.oid = t.tgfoid
JOIN pg_namespace fn_ns ON fn_ns.oid = fn.pronamespace
JOIN pg_roles owner ON owner.oid = fn.proowner
WHERE NOT t.tgisinternal
  AND ((ns.nspname = 'auth' AND tbl.relname IN ('users', 'identities'))
    OR (ns.nspname = 'public' AND tbl.relname IN ('users', 'audit_log')))
ORDER BY table_schema, table_name, trigger_name;

-- Report unexpected mandatory profile/audit columns without exposing row data.
SELECT table_name, column_name, data_type, is_nullable,
       column_default IS NOT NULL AS has_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('users', 'audit_log')
ORDER BY table_name, ordinal_position;

SELECT tbl.relname AS table_name, c.conname AS constraint_name,
       c.contype AS constraint_type, c.convalidated AS validated
FROM pg_constraint c
JOIN pg_class tbl ON tbl.oid = c.conrelid
JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
WHERE ns.nspname = 'public' AND tbl.relname IN ('users', 'audit_log')
ORDER BY table_name, constraint_name;

-- A users policy selecting users again can cause infinite RLS recursion.
-- This normally affects profile reads after login; it does not prove that
-- the privileged signup trigger is the source of the current failure.
SELECT policyname, cmd,
       COALESCE(qual, '') ~* '\musers\M' AS using_references_users,
       COALESCE(with_check, '') ~* '\musers\M' AS check_references_users
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;

COMMIT;
