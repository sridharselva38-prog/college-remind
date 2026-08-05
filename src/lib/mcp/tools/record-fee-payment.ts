import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "record_fee_payment",
  title: "Record fee payment",
  description:
    "Add a payment amount to an existing fee record. The balance and status are recalculated automatically.",
  inputSchema: {
    fee_record_id: z.string().describe("The fee record id to update."),
    amount: z.number().describe("Payment amount in INR to add to the paid total."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ fee_record_id, amount }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    if (!(amount > 0)) throw new ToolError("amount must be greater than zero");

    const supabase = supabaseForUser(ctx);
    const { data: record, error: readErr } = await supabase
      .from("fee_records")
      .select("id, total_fee, paid_fee")
      .eq("id", fee_record_id)
      .maybeSingle();
    if (readErr) return { content: [{ type: "text", text: readErr.message }], isError: true };
    if (!record) throw new ToolError("Fee record not found or not accessible to you.");

    const paid = Number(record.paid_fee ?? 0) + amount;
    const { data, error } = await supabase
      .from("fee_records")
      .update({ paid_fee: paid })
      .eq("id", fee_record_id)
      .select("id, total_fee, paid_fee, balance_fee, status, due_date")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { fee_record: data },
    };
  },
});
