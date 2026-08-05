-- 1. Private schema for internal helpers (not exposed through the Data API)
CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM anon, authenticated;
GRANT USAGE ON SCHEMA app_private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION app_private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role); $$;

CREATE OR REPLACE FUNCTION app_private.current_college_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT college_id FROM public.profiles WHERE id = auth.uid(); $$;

REVOKE ALL ON FUNCTION app_private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.current_college_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION app_private.current_college_id() TO authenticated, service_role;

-- 2. Recreate all policies against the private helpers
-- audit_logs
DROP POLICY IF EXISTS audit_college_read ON public.audit_logs;
DROP POLICY IF EXISTS audit_super_read ON public.audit_logs;
CREATE POLICY audit_college_read ON public.audit_logs FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(), 'college_admin') AND college_id = app_private.current_college_id());
CREATE POLICY audit_super_read ON public.audit_logs FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(), 'super_admin'));

-- colleges: own college only (or super admin)
DROP POLICY IF EXISTS colleges_read ON public.colleges;
DROP POLICY IF EXISTS colleges_admin_update ON public.colleges;
DROP POLICY IF EXISTS colleges_super_write ON public.colleges;
CREATE POLICY colleges_read ON public.colleges FOR SELECT TO authenticated
  USING (
    app_private.has_role(auth.uid(), 'super_admin')
    OR id = app_private.current_college_id()
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.user_id = auth.uid() AND s.college_id = colleges.id)
  );
CREATE POLICY colleges_admin_update ON public.colleges FOR UPDATE TO authenticated
  USING (app_private.has_role(auth.uid(), 'college_admin') AND id = app_private.current_college_id())
  WITH CHECK (app_private.has_role(auth.uid(), 'college_admin') AND id = app_private.current_college_id());
CREATE POLICY colleges_super_write ON public.colleges FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (app_private.has_role(auth.uid(), 'super_admin'));

-- fee_records
DROP POLICY IF EXISTS fees_college_admin ON public.fee_records;
DROP POLICY IF EXISTS fees_super ON public.fee_records;
CREATE POLICY fees_college_admin ON public.fee_records FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(), 'college_admin') AND college_id = app_private.current_college_id())
  WITH CHECK (app_private.has_role(auth.uid(), 'college_admin') AND college_id = app_private.current_college_id());
CREATE POLICY fees_super ON public.fee_records FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (app_private.has_role(auth.uid(), 'super_admin'));

-- profiles
DROP POLICY IF EXISTS profiles_college_admin_read ON public.profiles;
DROP POLICY IF EXISTS profiles_super ON public.profiles;
CREATE POLICY profiles_college_admin_read ON public.profiles FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(), 'college_admin') AND college_id = app_private.current_college_id());
CREATE POLICY profiles_super ON public.profiles FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (app_private.has_role(auth.uid(), 'super_admin'));

-- reminder_logs
DROP POLICY IF EXISTS reminders_college_admin ON public.reminder_logs;
DROP POLICY IF EXISTS reminders_super ON public.reminder_logs;
CREATE POLICY reminders_college_admin ON public.reminder_logs FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(), 'college_admin') AND college_id = app_private.current_college_id())
  WITH CHECK (app_private.has_role(auth.uid(), 'college_admin') AND college_id = app_private.current_college_id());
CREATE POLICY reminders_super ON public.reminder_logs FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (app_private.has_role(auth.uid(), 'super_admin'));

-- settings
DROP POLICY IF EXISTS settings_college_admin ON public.settings;
DROP POLICY IF EXISTS settings_super ON public.settings;
CREATE POLICY settings_college_admin ON public.settings FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(), 'college_admin') AND college_id = app_private.current_college_id())
  WITH CHECK (app_private.has_role(auth.uid(), 'college_admin') AND college_id = app_private.current_college_id());
CREATE POLICY settings_super ON public.settings FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (app_private.has_role(auth.uid(), 'super_admin'));

-- students
DROP POLICY IF EXISTS students_college_admin ON public.students;
DROP POLICY IF EXISTS students_super ON public.students;
CREATE POLICY students_college_admin ON public.students FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(), 'college_admin') AND college_id = app_private.current_college_id())
  WITH CHECK (app_private.has_role(auth.uid(), 'college_admin') AND college_id = app_private.current_college_id());
CREATE POLICY students_super ON public.students FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (app_private.has_role(auth.uid(), 'super_admin'));

-- user_roles: read only, writes locked out entirely for app roles
DROP POLICY IF EXISTS roles_super_read ON public.user_roles;
CREATE POLICY roles_super_read ON public.user_roles FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(), 'super_admin'));
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.user_roles FROM authenticated, anon;
REVOKE ALL ON public.user_roles FROM anon;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- 3. Drop the publicly callable helpers
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.current_college_id();