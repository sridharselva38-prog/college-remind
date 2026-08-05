import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_students",
  title: "List students",
  description:
    "List students visible to the signed-in FeeSync AI user, optionally filtered by name, register number or department.",
  inputSchema: {
    search: z.string().optional().describe("Match against student name or register number."),
    department: z.string().optional().describe("Exact department name filter."),
    limit: z.number().int().optional().describe("Maximum rows to return (default 25, max 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, department, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("students")
      .select("id, full_name, register_number, department, course, year, student_phone, parent_phone, student_email, is_active")
      .order("full_name", { ascending: true })
      .limit(Math.min(Math.max(limit ?? 25, 1), 100));
    if (department) query = query.eq("department", department);
    if (search?.trim()) {
      const term = search.trim();
      query = query.or(`full_name.ilike.%${term}%,register_number.ilike.%${term}%`);
    }
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { students: data ?? [] },
    };
  },
});
