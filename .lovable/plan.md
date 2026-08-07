# Google login sees the full college data + daily WhatsApp reminders

Two things: any Google sign-in lands as an admin of the demo college with all records visible, and reminders go out automatically every day on WhatsApp plus in-app notifications.

## 1. Google login gives full admin access

Today a brand-new Google account gets only the `student` role and no college, so the dashboards look empty.

Change: on first sign-in, if the account has no college and no admin role, it is automatically given the `college_admin` role and attached to the existing demo college ("Sri Krishna College of Engineering"). Existing accounts keep whatever roles they already have.

Result after Google login: students list (10), fee records with balances/overdue, collection charts, reminder history and notifications are all populated immediately.

## 2. WhatsApp reminder engine (needs Twilio)

Real WhatsApp sending requires a Twilio account with a WhatsApp sender. I will open a Twilio connect card for you — sign in with Twilio there and pick/create the connection. Nothing gets built into the app that can send until that connection exists.

Reminder ladder per unpaid fee record, based on the due date:

| Stage | When |
| --- | --- |
| before_15 / before_7 / before_3 | 15, 7, 3 days before due date |
| due_today | on the due date |
| after_1 / after_7 | 1 and 7 days overdue |

For each due stage, for each student with a balance:
- Send WhatsApp to the student's phone and the parent's phone (when present) with name, register number, balance, due date, and the college payment link.
- Create an in-app notification for the student's linked account and a daily summary notification for college admins.
- Write one `reminder_logs` row per send with channel, recipient, stage, status (sent/failed), the message body, and Twilio's message reference, so the reminder history and success-rate stats stay real.
- Skip a stage already logged for that fee record so the same reminder never repeats.

Message text follows the college's `reminder_language` setting (English / Tamil / both).

## 3. Runs automatically every day

A daily scheduled job at 9:00 AM IST calls the reminder endpoint. The admin fees page also gets a "Send reminders now" button so you can trigger a run and watch the logs fill in.

## Technical notes

- Auto-provisioning happens in `getMe` (`src/lib/app.functions.ts`) via a server-side helper using the admin client, since `user_roles` writes are locked to service-role only.
- New `src/lib/reminders.server.ts`: stage resolution, message templating, Twilio gateway call, log/notification writes.
- New public route `src/routes/api/public/hooks/send-reminders.ts` (POST, validated with the project anon key in the `apikey` header) that runs the engine for all active colleges.
- Twilio is called through the Lovable connector gateway (`/twilio/Messages.json`, form-encoded, `whatsapp:` prefixed numbers). Failures are recorded per-log with the provider status, never crashing the run.
- New server fn `runRemindersNow` (admin/super only) for the manual button.
- `pg_cron` + `pg_net` daily schedule pointing at the stable project URL.
- Also fixing the hydration warning on `/auth` while in there.
