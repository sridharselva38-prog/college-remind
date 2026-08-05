import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_reminder_logs",
  title: "List reminder logs",
  description:
    "List recent fee reminder messages (channel, stage, status, sent time) visible to the signed-in user.",
  inputSchema: {
    student_id: z.string().optional().describe("Restrict to one student id."),
    limit: z.number().int().optional().describe("Maximum rows to return (default 25, max 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ student_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("reminder_logs")
      .select("id, student_id, channel, status, sent_at, message")
      .order("sent_at", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 25, 1), 100));
    if (student_id) query = query.eq("student_id", student_id);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { reminders: data ?? [] },
    };
  },
});
