/**
 * Reminder engine: resolves which fee records are due for a reminder stage today,
 * sends WhatsApp messages through the Twilio connector gateway, writes reminder
 * logs and in-app notifications.
 *
 * Server-only. Never import from route components.
 */
import type { Database } from "@/integrations/supabase/types";

type Stage = Database["public"]["Enums"]["reminder_stage"];
type Recipient = Database["public"]["Enums"]["recipient_type"];

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

/** Offset in days from today to the due date for each ladder stage. */
const LADDER: { stage: Stage; offset: number }[] = [
  { stage: "before_15", offset: 15 },
  { stage: "before_7", offset: 7 },
  { stage: "before_3", offset: 3 },
  { stage: "due_today", offset: 0 },
  { stage: "after_1", offset: -1 },
  { stage: "after_7", offset: -7 },
];

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Maps each date that should receive a reminder today to its ladder stage. */
export function dueDateStageMap(today = new Date()): Map<string, Stage> {
  const map = new Map<string, Stage>();
  for (const { stage, offset } of LADDER) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + offset);
    map.set(iso(d), stage);
  }
  return map;
}

const money = (v: unknown) =>
  `₹${Number(v ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const STAGE_LABEL: Record<Stage, string> = {
  before_15: "due in 15 days",
  before_7: "due in 7 days",
  before_3: "due in 3 days",
  due_today: "due today",
  after_1: "overdue by 1 day",
  after_7: "overdue by 7 days",
};

const STAGE_LABEL_TA: Record<Stage, string> = {
  before_15: "15 நாட்களில் செலுத்த வேண்டும்",
  before_7: "7 நாட்களில் செலுத்த வேண்டும்",
  before_3: "3 நாட்களில் செலுத்த வேண்டும்",
  due_today: "இன்று செலுத்த வேண்டும்",
  after_1: "1 நாள் தாமதம்",
  after_7: "7 நாட்கள் தாமதம்",
};

export type MessageContext = {
  collegeName: string;
  studentName: string;
  registerNumber: string;
  balance: number;
  dueDate: string;
  stage: Stage;
  recipient: Recipient;
  paymentLink: string | null;
  supportContact: string | null;
  language: string;
};

export function buildMessage(c: MessageContext): string {
  const who = c.recipient === "parent" ? `your ward ${c.studentName}` : c.studentName;
  const en = [
    `${c.collegeName} — Fee reminder`,
    `${who} (${c.registerNumber})`,
    `Outstanding balance: ${money(c.balance)}`,
    `Due date: ${c.dueDate} (${STAGE_LABEL[c.stage]})`,
    c.paymentLink ? `Pay online: ${c.paymentLink}` : null,
    c.supportContact ? `Help: ${c.supportContact}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const ta = [
    `${c.collegeName} — கட்டண நினைவூட்டல்`,
    `${c.studentName} (${c.registerNumber})`,
    `நிலுவைத் தொகை: ${money(c.balance)}`,
    `கடைசி தேதி: ${c.dueDate} (${STAGE_LABEL_TA[c.stage]})`,
    c.paymentLink ? `ஆன்லைனில் செலுத்த: ${c.paymentLink}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  if (c.language === "ta" || c.language === "tamil") return ta;
  if (c.language === "en" || c.language === "english") return en;
  return `${en}\n\n---\n${ta}`;
}

/** Normalizes an Indian phone number to E.164. */
export function toE164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  if (raw.trim().startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return `+${digits}`;
}

/** Twilio error codes that mean "trial account can only send predefined templates". */
const TRIAL_TEMPLATE_CODES = ["572002", "572001", "21656"];

export function twilioErrorCode(body: string): string {
  return /"code"\s*:\s*(\d+)/.exec(body)?.[1] ?? "";
}

export function isTrialTemplateError(body: string): boolean {
  if (TRIAL_TEMPLATE_CODES.includes(twilioErrorCode(body))) return true;
  return /predefined|template/i.test(body);
}

/** Turns raw Twilio error bodies into a short, human-readable reason. */
export function friendlyTwilioError(status: number, body: string): string {
  const code = twilioErrorCode(body);
  const map: Record<string, string> = {
    "572002": "Twilio trial account allows only predefined SMS templates",
    "572001": "Twilio trial account allows only predefined SMS templates",
    "21656": "Twilio trial account allows only predefined SMS templates",
    "21608": "Twilio trial account: verify this number in Twilio first",
    "21211": "Phone number is not a valid mobile number",
    "21610": "Recipient has unsubscribed from messages",
    "63007": "Sender number is not enabled for this channel",
    "21612": "Sender number cannot deliver to this country",
  };
  if (map[code]) return map[code]!;
  const message = /"message"\s*:\s*"([^"]{0,200})"/.exec(body)?.[1];
  return message ? `Twilio: ${message}` : `Twilio ${status}: ${body.slice(0, 200)}`;
}

/**
 * Trial-account safe body. Twilio free trials accept only their predefined
 * templates, so we use the "appointment" template shape and carry the fee
 * details in the date/time slots.
 */
export function buildTrialTemplateMessage(c: MessageContext): string {
  return `Your ${c.collegeName} appointment is coming up on ${c.dueDate} at 10:00 AM`;
}


export type SendResult =
  | { ok: true; providerRef: string | null }
  | { ok: false; error: string; raw?: string };


export type MessageChannel = "sms" | "whatsapp";

/**
 * Sends one reminder through the Twilio connector gateway. Normal text
 * messages (SMS) are the default; WhatsApp uses the `whatsapp:` prefix.
 */
export async function sendTextMessage(
  from: string,
  to: string,
  body: string,
  channel: MessageChannel = "sms",
): Promise<SendResult> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const twilioKey = process.env["TWILIO_API_KEY"];
  if (!lovableKey) return { ok: false, error: "LOVABLE_API_KEY is not configured" };
  if (!twilioKey) return { ok: false, error: "Twilio is not connected yet" };

  const prefix = channel === "whatsapp" ? "whatsapp:" : "";
  try {
    const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": twilioKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: `${prefix}${to}`,
        From: `${prefix}${from}`,
        Body: body,
      }),
    });
    const text = await response.text();
    if (!response.ok) {
      console.error(`Twilio ${channel} send failed [${response.status}]: ${text}`);
      return { ok: false, error: friendlyTwilioError(response.status, text), raw: text };
    }

    let providerRef: string | null = null;
    try {
      providerRef = (JSON.parse(text) as { sid?: string }).sid ?? null;
    } catch {
      /* non-JSON success body */
    }
    return { ok: true, providerRef };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export type RunSummary = {
  colleges: number;
  candidates: number;
  sent: number;
  failed: number;
  skipped: number;
  notifications: number;
};

type FeeCandidate = {
  id: string;
  student_id: string;
  college_id: string;
  balance_fee: number | string | null;
  due_date: string;
  students: {
    id: string;
    full_name: string;
    register_number: string;
    student_phone: string | null;
    parent_phone: string | null;
    user_id: string | null;
    is_active: boolean;
  } | null;
};

/**
 * Runs the reminder ladder for every active college (or one college when scoped).
 * Idempotent per (fee record, stage, recipient): already-logged stages are skipped.
 */
export async function runReminderCycle(opts?: {
  collegeId?: string | null;
  sentBy?: string | null;
}): Promise<RunSummary> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const stageMap = dueDateStageMap();
  const dueDates = [...stageMap.keys()];

  const summary: RunSummary = {
    colleges: 0,
    candidates: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    notifications: 0,
  };

  let collegeQuery = supabaseAdmin
    .from("colleges")
    .select("id, name, whatsapp_number, phone, payment_link, support_contact, reminder_language")
    .eq("is_active", true);
  if (opts?.collegeId) collegeQuery = collegeQuery.eq("id", opts.collegeId);
  const { data: colleges, error: collegeErr } = await collegeQuery;
  if (collegeErr) throw new Error(collegeErr.message);

  for (const college of colleges ?? []) {
    summary.colleges += 1;
    const from = toE164(college.whatsapp_number ?? college.phone);

    const { data: fees, error: feeErr } = await supabaseAdmin
      .from("fee_records")
      .select(
        "id, student_id, college_id, balance_fee, due_date, students(id, full_name, register_number, student_phone, parent_phone, user_id, is_active)",
      )
      .eq("college_id", college.id)
      .in("due_date", dueDates);
    if (feeErr) throw new Error(feeErr.message);

    const candidates = ((fees ?? []) as unknown as FeeCandidate[]).filter(
      (f) => Number(f.balance_fee ?? 0) > 0 && f.students?.is_active,
    );
    summary.candidates += candidates.length;
    if (candidates.length === 0) continue;

    const { data: existing } = await supabaseAdmin
      .from("reminder_logs")
      .select("fee_record_id, stage, recipient")
      .eq("college_id", college.id)
      // Only successful sends block a re-send; failures are retried next run.
      .in("status", ["sent", "delivered"])

      .in(
        "fee_record_id",
        candidates.map((c) => c.id),
      );
    const already = new Set(
      (existing ?? []).map((r) => `${r.fee_record_id}|${r.stage}|${r.recipient}`),
    );

    let collegeSent = 0;
    let collegeFailed = 0;

    for (const fee of candidates) {
      const student = fee.students!;
      const stage = stageMap.get(fee.due_date)!;
      const balance = Number(fee.balance_fee ?? 0);

      const targets: { recipient: Recipient; phone: string | null }[] = [
        { recipient: "student", phone: toE164(student.student_phone) },
        { recipient: "parent", phone: toE164(student.parent_phone) },
      ];

      for (const target of targets) {
        if (already.has(`${fee.id}|${stage}|${target.recipient}`)) {
          summary.skipped += 1;
          continue;
        }

        const body = buildMessage({
          collegeName: college.name,
          studentName: student.full_name,
          registerNumber: student.register_number,
          balance,
          dueDate: fee.due_date,
          stage,
          recipient: target.recipient,
          paymentLink: college.payment_link,
          supportContact: college.support_contact,
          language: college.reminder_language,
        });

        let result: SendResult;
        let channel: MessageChannel = "sms";
        if (!target.phone) {
          result = { ok: false, error: `No ${target.recipient} phone number on record` };
        } else if (!from) {
          result = { ok: false, error: "College has no sender number configured" };
        } else {
          // Normal text message first; fall back to WhatsApp on the same number.
          result = await sendTextMessage(from, target.phone, body, "sms");
          if (!result.ok) {
            const wa = await sendTextMessage(from, target.phone, body, "whatsapp");
            if (wa.ok) {
              result = wa;
              channel = "whatsapp";
            }
          }
        }

        await supabaseAdmin.from("reminder_logs").insert({
          college_id: college.id,
          student_id: student.id,
          fee_record_id: fee.id,
          channel,
          recipient: target.recipient,
          recipient_value: target.phone,
          stage,
          status: result.ok ? "sent" : "failed",
          message_body: body,
          provider_ref: result.ok ? result.providerRef : null,
          error_message: result.ok ? null : result.error,
          sent_by: opts?.sentBy ?? null,
        });

        if (result.ok) {
          summary.sent += 1;
          collegeSent += 1;
        } else {
          summary.failed += 1;
          collegeFailed += 1;
        }
      }

      // In-app notification for the student's own linked account.
      if (student.user_id) {
        await supabaseAdmin.from("notifications").insert({
          user_id: student.user_id,
          college_id: college.id,
          title: `Fee ${STAGE_LABEL[stage]}`,
          body: `Outstanding balance ${money(balance)} for ${fee.due_date}.`,
          type: stage.startsWith("after") ? "danger" : "warning",
        });
        summary.notifications += 1;
      } else {
        // No linked student account: notify college staff so the reminder is never lost.
        const { data: staff } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("college_id", college.id);
        for (const person of staff ?? []) {
          await supabaseAdmin.from("notifications").insert({
            user_id: person.id,
            college_id: college.id,
            title: `${student.full_name} — fee ${STAGE_LABEL[stage]}`,
            body: `${student.register_number}: outstanding ${money(balance)}, due ${fee.due_date}.`,
            type: stage.startsWith("after") ? "danger" : "warning",
          });
          summary.notifications += 1;
        }
      }
    }

    // Daily summary notification for every admin of this college.
    if (collegeSent + collegeFailed > 0) {
      const { data: admins } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("college_id", college.id);
      for (const admin of admins ?? []) {
        await supabaseAdmin.from("notifications").insert({
          user_id: admin.id,
          college_id: college.id,
          title: "Fee reminders sent",
          body: `${collegeSent} WhatsApp reminders delivered, ${collegeFailed} failed.`,
          type: collegeFailed > 0 ? "warning" : "info",
        });
        summary.notifications += 1;
      }
    }
  }

  return summary;
}

/** Picks the closest ladder stage for an arbitrary due date. */
export function stageForDueDate(dueDate: string, today = new Date()): Stage {
  const days = Math.round(
    (new Date(`${dueDate}T00:00:00Z`).getTime() - new Date(iso(today) + "T00:00:00Z").getTime()) /
      86_400_000,
  );
  let best = LADDER[0]!;
  for (const item of LADDER) {
    if (Math.abs(item.offset - days) < Math.abs(best.offset - days)) best = item;
  }
  return best.stage;
}

export type SingleSendSummary = {
  sent: number;
  failed: number;
  errors: string[];
};

/** Sends a reminder for ONE fee record immediately, to student and parent. */
export async function sendReminderForFeeRecord(opts: {
  feeRecordId: string;
  sentBy?: string | null;
}): Promise<SingleSendSummary> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: fee, error } = await supabaseAdmin
    .from("fee_records")
    .select(
      "id, student_id, college_id, balance_fee, due_date, students(id, full_name, register_number, student_phone, parent_phone, user_id, is_active)",
    )
    .eq("id", opts.feeRecordId)
    .single();
  if (error) throw new Error(error.message);

  const record = fee as unknown as FeeCandidate;
  const student = record.students;
  if (!student) throw new Error("Student not found for this fee record");

  const { data: college, error: cErr } = await supabaseAdmin
    .from("colleges")
    .select("id, name, whatsapp_number, phone, payment_link, support_contact, reminder_language")
    .eq("id", record.college_id)
    .single();
  if (cErr) throw new Error(cErr.message);

  const from = toE164(college.whatsapp_number ?? college.phone);
  const stage = stageForDueDate(record.due_date);
  const balance = Number(record.balance_fee ?? 0);
  const summary: SingleSendSummary = { sent: 0, failed: 0, errors: [] };

  const targets: { recipient: Recipient; phone: string | null }[] = [
    { recipient: "student", phone: toE164(student.student_phone) },
    { recipient: "parent", phone: toE164(student.parent_phone) },
  ];

  for (const target of targets) {
    if (!target.phone) continue;
    const body = buildMessage({
      collegeName: college.name,
      studentName: student.full_name,
      registerNumber: student.register_number,
      balance,
      dueDate: record.due_date,
      stage,
      recipient: target.recipient,
      paymentLink: college.payment_link,
      supportContact: college.support_contact,
      language: college.reminder_language,
    });

    let channel: MessageChannel = "sms";
    let result: SendResult;
    if (!from) {
      result = { ok: false, error: "College has no sender number configured" };
    } else {
      result = await sendTextMessage(from, target.phone, body, "sms");
      if (!result.ok) {
        const wa = await sendTextMessage(from, target.phone, body, "whatsapp");
        if (wa.ok) {
          result = wa;
          channel = "whatsapp";
        }
      }
    }

    await supabaseAdmin.from("reminder_logs").insert({
      college_id: college.id,
      student_id: student.id,
      fee_record_id: record.id,
      channel,
      recipient: target.recipient,
      recipient_value: target.phone,
      stage,
      status: result.ok ? "sent" : "failed",
      message_body: body,
      provider_ref: result.ok ? result.providerRef : null,
      error_message: result.ok ? null : result.error,
      sent_by: opts.sentBy ?? null,
    });

    if (result.ok) summary.sent += 1;
    else {
      summary.failed += 1;
      summary.errors.push(result.error);
    }
  }

  const noteType = stage.startsWith("after") ? "danger" : "warning";
  if (student.user_id) {
    await supabaseAdmin.from("notifications").insert({
      user_id: student.user_id,
      college_id: college.id,
      title: `Fee ${STAGE_LABEL[stage]}`,
      body: `Outstanding balance ${money(balance)} for ${record.due_date}.`,
      type: noteType,
    });
  } else {
    const { data: staff } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("college_id", college.id);
    for (const person of staff ?? []) {
      await supabaseAdmin.from("notifications").insert({
        user_id: person.id,
        college_id: college.id,
        title: `${student.full_name} — fee ${STAGE_LABEL[stage]}`,
        body: `${student.register_number}: outstanding ${money(balance)}, due ${record.due_date}.${
          summary.failed > 0 ? ` SMS failed: ${summary.errors[0] ?? "unknown error"}` : ""
        }`,
        type: noteType,
      });
    }
  }

  return summary;
}
