import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getScope,
  primaryRole,
  dashboardPathFor,
  linkStudentAccount,
  summarizeFees,
  monthlyCollection,
  reminderStats,
  type FeeRow,
} from "@/lib/app.server";
import {
  studentSchema,
  feeSchema,
  collegeSchema,
  assignRoleSchema,
  type StudentInput,
  type FeeInput,
  type CollegeInput,
} from "@/lib/schemas";

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const email = (claims as { email?: string }).email ?? null;
    await linkStudentAccount(userId, email);

    const scope = await getScope(supabase, userId);
    const [{ data: college }, { data: student }, { data: unread }] = await Promise.all([
      scope.collegeId
        ? supabase.from("colleges").select("*").eq("id", scope.collegeId).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("students").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false),
    ]);

    const role = primaryRole(scope.roles);
    return {
      userId,
      email,
      profile: scope.profile,
      roles: scope.roles,
      role,
      home: dashboardPathFor(role),
      college: college ?? null,
      student: student ?? null,
      unreadCount: (unread as unknown as { count?: number } | null)?.count ?? 0,
    };
  });

/** First signed-in user may claim super admin while the platform has none. */
export const claimSuperAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin");
    if ((count ?? 0) > 0) throw new Error("A platform owner already exists.");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "super_admin" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const platformNeedsOwner = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin");
    return { needsOwner: (count ?? 0) === 0 };
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const scope = await getScope(supabase, userId);

    let students = supabase.from("students").select("id, is_active");
    let fees = supabase
      .from("fee_records")
      .select("id, student_id, total_fee, paid_fee, balance_fee, due_date, status, updated_at");
    let reminders = supabase.from("reminder_logs").select("status, channel, sent_at");

    if (!scope.isSuper && scope.collegeId) {
      students = students.eq("college_id", scope.collegeId);
      fees = fees.eq("college_id", scope.collegeId);
      reminders = reminders.eq("college_id", scope.collegeId);
    }

    const [studentRes, feeRes, reminderRes, collegeRes] = await Promise.all([
      students,
      fees,
      reminders,
      supabase.from("colleges").select("id", { count: "exact", head: true }),
    ]);

    const feeRows = (feeRes.data ?? []) as FeeRow[];
    return {
      role: primaryRole(scope.roles),
      studentCount: studentRes.data?.length ?? 0,
      collegeCount: (collegeRes as unknown as { count?: number }).count ?? 0,
      fees: summarizeFees(feeRows),
      monthly: monthlyCollection(feeRows),
      reminders: reminderStats(reminderRes.data ?? []),
    };
  });

export const listStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { search?: string } | undefined) => data ?? {})
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const scope = await getScope(supabase, userId);
    let query = supabase
      .from("students")
      .select("*, fee_records(*)")
      .order("created_at", { ascending: false })
      .limit(300);
    if (!scope.isSuper && scope.collegeId) query = query.eq("college_id", scope.collegeId);
    const term = data.search?.trim();
    if (term) query = query.or(`full_name.ilike.%${term}%,register_number.ilike.%${term}%`);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const saveStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: StudentInput) => studentSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const scope = await getScope(supabase, userId);
    if (!scope.isSuper && !scope.isAdmin) throw new Error("Forbidden");
    if (!scope.collegeId && !scope.isSuper) throw new Error("No college assigned to your account.");

    const payload = { ...data, college_id: scope.collegeId! };
    const { data: row, error } = data.id
      ? await supabase.from("students").update(payload).eq("id", data.id).select().single()
      : await supabase.from("students").insert(payload).select().single();
    if (error) throw new Error(error.message);
    await supabase.from("audit_logs").insert({
      actor_id: userId,
      college_id: scope.collegeId,
      action: data.id ? "student.update" : "student.create",
      entity: "students",
      entity_id: row.id,
    });
    return row;
  });

export const deleteStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("students").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveFeeRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: FeeInput) => feeSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const scope = await getScope(supabase, userId);
    if (!scope.isSuper && !scope.isAdmin) throw new Error("Forbidden");

    const { data: student, error: sErr } = await supabase
      .from("students")
      .select("id, college_id")
      .eq("id", data.student_id)
      .single();
    if (sErr) throw new Error(sErr.message);

    const payload = { ...data, college_id: student.college_id };
    const { data: row, error } = data.id
      ? await supabase.from("fee_records").update(payload).eq("id", data.id).select().single()
      : await supabase.from("fee_records").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listFeeRecords = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const scope = await getScope(supabase, userId);
    let query = supabase
      .from("fee_records")
      .select("*, students(full_name, register_number, department)")
      .order("due_date", { ascending: true })
      .limit(300);
    if (!scope.isSuper && scope.collegeId) query = query.eq("college_id", scope.collegeId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getStudentOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: student } = await supabase
      .from("students")
      .select("*, colleges(name, logo_url, support_contact, payment_link)")
      .eq("user_id", userId)
      .maybeSingle();
    if (!student) return { student: null, fees: [], reminders: [], summary: null };

    const [{ data: fees }, { data: reminders }] = await Promise.all([
      supabase
        .from("fee_records")
        .select("*")
        .eq("student_id", student.id)
        .order("due_date", { ascending: true }),
      supabase
        .from("reminder_logs")
        .select("*")
        .eq("student_id", student.id)
        .order("sent_at", { ascending: false })
        .limit(50),
    ]);
    return {
      student,
      fees: fees ?? [],
      reminders: reminders ?? [],
      summary: summarizeFees((fees ?? []) as FeeRow[]),
    };
  });

export const listColleges = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("colleges")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveCollege = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CollegeInput) => collegeSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { data: row, error } = data.id
      ? await context.supabase.from("colleges").update(data).eq("id", data.id).select().single()
      : await context.supabase.from("colleges").insert(data).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const assignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => assignRoleSchema.parse(data))
  .handler(async ({ context, data }) => {
    const scope = await getScope(context.supabase, context.userId);
    if (!scope.isSuper) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) throw new Error(listErr.message);
    const user = list.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
    if (!user) throw new Error("No account found with that email. Ask them to sign up first.");

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: user.id, role: data.role }, { onConflict: "user_id,role" });
    if (roleErr) throw new Error(roleErr.message);

    if (data.college_id) {
      await supabaseAdmin
        .from("profiles")
        .update({ college_id: data.college_id })
        .eq("id", user.id);
    }
    return { ok: true, email: data.email };
  });

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const markNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; remove?: boolean }) => data)
  .handler(async ({ context, data }) => {
    if (data.remove) {
      await context.supabase.from("notifications").delete().eq("id", data.id);
    } else {
      await context.supabase.from("notifications").update({ is_read: true }).eq("id", data.id);
    }
    return { ok: true };
  });

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
