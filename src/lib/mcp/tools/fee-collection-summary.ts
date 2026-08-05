import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "fee_collection_summary",
  title: "Fee collection summary",
  description:
    "Summarise total fees, collected amount, pending balance, overdue count and status split for the fee records the signed-in user can see.",
  inputSchema: {
    academic_year: z.string().optional().describe("Restrict the summary to one academic year, e.g. 2024-2025."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ academic_year }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase.from("fee_records").select("total_fee, paid_fee, balance_fee, due_date, status");
    if (academic_year) query = query.eq("academic_year", academic_year);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const rows = data ?? [];
    const num = (v: unknown) => Number(v ?? 0);
    const today = new Date().toISOString().slice(0, 10);
    const summary = {
      records: rows.length,
      total_fee: rows.reduce((a, r) => a + num(r.total_fee), 0),
      collected: rows.reduce((a, r) => a + num(r.paid_fee), 0),
      pending: rows.reduce((a, r) => a + Math.max(0, num(r.balance_fee)), 0),
      overdue_records: rows.filter((r) => num(r.balance_fee) > 0 && r.due_date < today).length,
      status_split: rows.reduce<Record<string, number>>((acc, r) => {
        acc[r.status] = (acc[r.status] ?? 0) + 1;
        return acc;
      }, {}),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
