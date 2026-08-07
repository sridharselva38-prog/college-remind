import { createFileRoute } from "@tanstack/react-router";

/**
 * Daily reminder cron endpoint. Called by pg_cron with the project anon key in
 * the `apikey` header; runs the WhatsApp reminder ladder for every college.
 */
export const Route = createFileRoute("/api/public/hooks/send-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected =
          process.env["SUPABASE_ANON_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"];
        const provided =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          "";
        if (!expected || provided !== expected) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
          const { runReminderCycle } = await import("@/lib/reminders.server");
          const summary = await runReminderCycle();
          console.log("Reminder cycle finished:", JSON.stringify(summary));
          return Response.json({ success: true, ...summary });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Reminder run failed";
          console.error("Reminder cycle failed:", message);
          return Response.json({ success: false, error: message }, { status: 500 });
        }
      },
    },
  },
});
