import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type Client = SupabaseClient<Database>;
export type AppRole = Database["public"]["Enums"]["app_role"];

export type Scope = {
  userId: string;
  roles: AppRole[];
  isSuper: boolean;
  isAdmin: boolean;
  collegeId: string | null;
  profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
};

export async function getScope(supabase: Client, userId: string): Promise<Scope> {
  const [{ data: roleRows }, { data: profile }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
  ]);
  const roles = (roleRows ?? []).map((r) => r.role);
  return {
    userId,
    roles,
    isSuper: roles.includes("super_admin"),
    isAdmin: roles.includes("college_admin"),
    collegeId: profile?.college_id ?? null,
    profile: profile ?? null,
  };
}

export function primaryRole(roles: AppRole[]): AppRole {
  if (roles.includes("super_admin")) return "super_admin";
  if (roles.includes("college_admin")) return "college_admin";
  return "student";
}

export function dashboardPathFor(role: AppRole): string {
  if (role === "super_admin") return "/super-admin/dashboard";
  if (role === "college_admin") return "/admin/dashboard";
  return "/student/dashboard";
}

/** Links a signed-in user to a student record that shares their email. */
export async function linkStudentAccount(userId: string, email: string | null) {
  if (!email) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("students")
    .update({ user_id: userId })
    .is("user_id", null)
    .eq("student_email", email);
}

const num = (v: unknown) => Number(v ?? 0);

export type FeeRow = {
  id: string;
  student_id: string;
  total_fee: number | string;
  paid_fee: number | string;
  balance_fee: number | string | null;
  due_date: string;
  status: string;
  updated_at: string;
};

export function summarizeFees(fees: FeeRow[]) {
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);

  const totalFee = fees.reduce((a, f) => a + num(f.total_fee), 0);
  const collected = fees.reduce((a, f) => a + num(f.paid_fee), 0);
  const pending = fees.reduce((a, f) => a + Math.max(0, num(f.balance_fee)), 0);
  const overdue = fees.filter((f) => num(f.balance_fee) > 0 && f.due_date < today);
  const upcoming = fees.filter(
    (f) => num(f.balance_fee) > 0 && f.due_date >= today && f.due_date <= in30,
  );
  const paidCount = fees.filter((f) => num(f.balance_fee) <= 0).length;

  return {
    totalFee,
    collected,
    pending,
    overdueCount: overdue.length,
    upcomingCount: upcoming.length,
    paidCount,
    recordCount: fees.length,
    collectionRate: totalFee > 0 ? Math.round((collected / totalFee) * 100) : 0,
  };
}

/** Groups paid amounts into the last 6 calendar months for the collection chart. */
export function monthlyCollection(fees: FeeRow[]) {
  const buckets: { month: string; collected: number; pending: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      month: d.toLocaleString("en-US", { month: "short" }),
      collected: 0,
      pending: 0,
    });
  }
  for (const f of fees) {
    const d = new Date(f.due_date);
    const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    const idx = 5 - diff;
    if (idx < 0 || idx > 5) continue;
    buckets[idx]!.collected += num(f.paid_fee);
    buckets[idx]!.pending += Math.max(0, num(f.balance_fee));
  }
  return buckets;
}

export function reminderStats(rows: { status: string; channel: string; sent_at: string }[]) {
  const today = new Date().toISOString().slice(0, 10);
  const sent = rows.filter((r) => r.status === "sent" || r.status === "delivered").length;
  const failed = rows.filter((r) => r.status === "failed").length;
  const total = rows.length;
  return {
    total,
    sent,
    failed,
    today: rows.filter((r) => r.sent_at.slice(0, 10) === today).length,
    successRate: total ? Math.round((sent / total) * 100) : 0,
    failureRate: total ? Math.round((failed / total) * 100) : 0,
    byChannel: (["whatsapp", "email", "push"] as const).map((channel) => ({
      channel,
      count: rows.filter((r) => r.channel === channel).length,
    })),
  };
}

/** Normalizes form payloads for Postgres: undefined and "" become null. */
export function nn<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = v === undefined || v === "" ? null : v;
  }
  return out;
}

/**
 * Makes a freshly signed-in account usable: accounts with no college and no
 * admin role are attached to the first active college as a college admin.
 * Existing roles and college assignments are never overwritten.
 */
export async function ensureWorkspaceAccess(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [{ data: roleRows }, { data: profile }] = await Promise.all([
    supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
    supabaseAdmin.from("profiles").select("id, college_id").eq("id", userId).maybeSingle(),
  ]);
  const roles = (roleRows ?? []).map((r) => r.role);
  const isPrivileged = roles.includes("super_admin") || roles.includes("college_admin");
  if (isPrivileged && profile?.college_id) return;

  // A student record linked to this account means the user belongs in the student view.
  const { data: linkedStudent } = await supabaseAdmin
    .from("students")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (linkedStudent) return;

  const { data: college } = await supabaseAdmin
    .from("colleges")
    .select("id")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!college) return;

  if (!isPrivileged) {
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "college_admin" }, { onConflict: "user_id,role" });
  }
  if (!profile?.college_id) {
    await supabaseAdmin.from("profiles").update({ college_id: college.id }).eq("id", userId);
  }
}
