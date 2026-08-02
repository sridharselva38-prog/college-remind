-- ENUMS
CREATE TYPE public.app_role AS ENUM ('super_admin','college_admin','student');
CREATE TYPE public.fee_status AS ENUM ('pending','partial','paid','overdue');
CREATE TYPE public.reminder_channel AS ENUM ('whatsapp','email','push');
CREATE TYPE public.reminder_stage AS ENUM ('before_15','before_7','before_3','due_today','after_1','after_7');
CREATE TYPE public.reminder_status AS ENUM ('queued','sent','delivered','failed');
CREATE TYPE public.recipient_type AS ENUM ('student','parent');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- COLLEGES
CREATE TABLE public.colleges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  logo_url text,
  email text,
  phone text,
  whatsapp_number text,
  address text,
  support_contact text,
  payment_link text,
  reminder_language text NOT NULL DEFAULT 'both',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.colleges TO authenticated;
GRANT ALL ON public.colleges TO service_role;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  email text,
  avatar_url text,
  phone text,
  college_id uuid REFERENCES public.colleges(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.current_college_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT college_id FROM public.profiles WHERE id = auth.uid();
$$;

-- STUDENTS
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  user_id uuid,
  full_name text NOT NULL,
  register_number text NOT NULL,
  department text,
  course text,
  year integer,
  semester integer,
  section text,
  student_phone text,
  parent_phone text,
  student_email text,
  parent_email text,
  address text,
  photo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (college_id, register_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- FEE RECORDS
CREATE TABLE public.fee_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  academic_year text,
  term text,
  total_fee numeric(12,2) NOT NULL DEFAULT 0,
  paid_fee numeric(12,2) NOT NULL DEFAULT 0,
  scholarship numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  late_fee numeric(12,2) NOT NULL DEFAULT 0,
  balance_fee numeric(12,2) GENERATED ALWAYS AS
    (total_fee + late_fee - paid_fee - scholarship - discount) STORED,
  due_date date NOT NULL,
  status public.fee_status NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_records TO authenticated;
GRANT ALL ON public.fee_records TO service_role;
ALTER TABLE public.fee_records ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.sync_fee_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE bal numeric;
BEGIN
  bal := NEW.total_fee + NEW.late_fee - NEW.paid_fee - NEW.scholarship - NEW.discount;
  IF bal <= 0 THEN NEW.status := 'paid';
  ELSIF NEW.due_date < current_date THEN NEW.status := 'overdue';
  ELSIF NEW.paid_fee > 0 THEN NEW.status := 'partial';
  ELSE NEW.status := 'pending';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END; $$;
CREATE TRIGGER fee_records_sync BEFORE INSERT OR UPDATE ON public.fee_records
FOR EACH ROW EXECUTE FUNCTION public.sync_fee_status();

-- REMINDER LOGS
CREATE TABLE public.reminder_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fee_record_id uuid REFERENCES public.fee_records(id) ON DELETE CASCADE,
  channel public.reminder_channel NOT NULL,
  recipient public.recipient_type NOT NULL,
  recipient_value text,
  stage public.reminder_stage NOT NULL,
  status public.reminder_status NOT NULL DEFAULT 'queued',
  retry_count integer NOT NULL DEFAULT 0,
  error_message text,
  message_body text,
  provider_ref text,
  sent_by uuid,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (fee_record_id, channel, recipient, stage)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminder_logs TO authenticated;
GRANT ALL ON public.reminder_logs TO service_role;
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  college_id uuid REFERENCES public.colleges(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- AUDIT LOGS
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  college_id uuid REFERENCES public.colleges(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text,
  entity_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- SETTINGS
CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid REFERENCES public.colleges(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (college_id, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- TRIGGERS updated_at
CREATE TRIGGER t_colleges_upd BEFORE UPDATE ON public.colleges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_profiles_upd BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_students_upd BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_settings_upd BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PROFILE AUTO-CREATE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- POLICIES
CREATE POLICY "colleges_read" ON public.colleges FOR SELECT TO authenticated USING (true);
CREATE POLICY "colleges_super_write" ON public.colleges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "colleges_admin_update" ON public.colleges FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'college_admin') AND id = public.current_college_id())
  WITH CHECK (public.has_role(auth.uid(),'college_admin') AND id = public.current_college_id());

CREATE POLICY "profiles_self" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_super" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "profiles_college_admin_read" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'college_admin') AND college_id = public.current_college_id());

CREATE POLICY "roles_self_read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "roles_super_read" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "students_super" ON public.students FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "students_college_admin" ON public.students FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'college_admin') AND college_id = public.current_college_id())
  WITH CHECK (public.has_role(auth.uid(),'college_admin') AND college_id = public.current_college_id());
CREATE POLICY "students_self_read" ON public.students FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "fees_super" ON public.fee_records FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "fees_college_admin" ON public.fee_records FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'college_admin') AND college_id = public.current_college_id())
  WITH CHECK (public.has_role(auth.uid(),'college_admin') AND college_id = public.current_college_id());
CREATE POLICY "fees_self_read" ON public.fee_records FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = fee_records.student_id AND s.user_id = auth.uid()));

CREATE POLICY "reminders_super" ON public.reminder_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "reminders_college_admin" ON public.reminder_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'college_admin') AND college_id = public.current_college_id())
  WITH CHECK (public.has_role(auth.uid(),'college_admin') AND college_id = public.current_college_id());
CREATE POLICY "reminders_self_read" ON public.reminder_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = reminder_logs.student_id AND s.user_id = auth.uid()));

CREATE POLICY "notifications_own" ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "audit_super_read" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "audit_college_read" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'college_admin') AND college_id = public.current_college_id());
CREATE POLICY "audit_insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

CREATE POLICY "settings_super" ON public.settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "settings_college_admin" ON public.settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'college_admin') AND college_id = public.current_college_id())
  WITH CHECK (public.has_role(auth.uid(),'college_admin') AND college_id = public.current_college_id());

CREATE INDEX idx_students_college ON public.students(college_id);
CREATE INDEX idx_fees_student ON public.fee_records(student_id);
CREATE INDEX idx_fees_due ON public.fee_records(due_date);
CREATE INDEX idx_reminders_student ON public.reminder_logs(student_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);