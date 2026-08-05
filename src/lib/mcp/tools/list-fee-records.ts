import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_fee_records",
  title: "List fee records",
  description:
    "List fee records visible to the signed-in user, with student details. Filter by status or only outstanding/overdue balances.",
  inputSchema: {
    status: z
      .enum(["pending", "partial", "paid", "overdue"])
      .optional()
      .describe("Filter by fee status."),
    only_outstanding: z.boolean().optional().describe("Return only records with a balance above zero."),
    overdue_only: z.boolean().optional().describe("Return only records past their due date with a balance."),
    limit: z.number().int().optional().describe("Maximum rows to return (default 25, max 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, only_outstanding, overdue_only, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("fee_records")
      .select(
        "id, academic_year, semester, total_fee, paid_fee, balance_fee, due_date, status, students(full_name, register_number, department)",
      )
      .order("due_date", { ascending: true })
      .limit(Math.min(Math.max(limit ?? 25, 1), 100));
    if (status) query = query.eq("status", status);
    if (only_outstanding || overdue_only) query = query.gt("balance_fee", 0);
    if (overdue_only) query = query.lt("due_date", new Date().toISOString().slice(0, 10));
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { fee_records: data ?? [] },
    };
  },
});
