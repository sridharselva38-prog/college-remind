import { auth, defineMcp } from "@lovable.dev/mcp-js";


type AnyTool = Parameters<typeof defineMcp>[0]["tools"][number];
import listStudents from "./tools/list-students";
import listFeeRecords from "./tools/list-fee-records";
import feeCollectionSummary from "./tools/fee-collection-summary";
import recordFeePayment from "./tools/record-fee-payment";
import listReminderLogs from "./tools/list-reminder-logs";

// The OAuth issuer must be the direct Supabase host; the project ref is the only
// value that survives publish unchanged.
const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "feesync-ai",
  title: "FeeSync AI",
  version: "0.1.0",
  instructions:
    "Tools for FeeSync AI, a college fee reminder platform. Use `list_students` and `list_fee_records` to look up students and their fee balances, `fee_collection_summary` for collection totals and overdue counts, `list_reminder_logs` to review reminder history, and `record_fee_payment` to log a payment against a fee record. All data is scoped to the signed-in user's college and role.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listStudents, listFeeRecords, feeCollectionSummary, listReminderLogs, recordFeePayment] as unknown as AnyTool[],
});
