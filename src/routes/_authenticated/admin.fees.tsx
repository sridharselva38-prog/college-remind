import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { listFeeRecords, runRemindersNow } from "@/lib/app.functions";
import { DashboardShell } from "@/components/DashboardShell";
import { inr } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin/fees")({
  head: () => ({
    meta: [
      { title: "Fee Records — FeeSync AI" },
      { name: "description", content: "Track every student fee record: total payable, amounts paid, outstanding balance, due dates and payment status in one place." },
      { property: "og:title", content: "Fee Records — FeeSync AI" },
      { property: "og:description", content: "Track fee totals, payments, outstanding balances and due dates for every student." },
      { property: "og:url", content: "/admin/fees" },
    ],
    links: [{ rel: "canonical", href: "/admin/fees" }],
  }),
  component: FeesPage,
});

const TONE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  paid: "default",
  partial: "secondary",
  overdue: "destructive",
  pending: "outline",
};

function FeesPage() {
  const fetchFees = useServerFn(listFeeRecords);
  const runReminders = useServerFn(runRemindersNow);
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({ queryKey: ["fees"], queryFn: () => fetchFees() });

  const send = useMutation({
    mutationFn: () => runReminders(),
    onSuccess: (summary) => {
      toast.success(
        `${summary.sent} reminder${summary.sent === 1 ? "" : "s"} sent` +
          (summary.failed ? `, ${summary.failed} failed` : "") +
          (summary.sent + summary.failed === 0 ? " — nothing is due today" : ""),
      );
      void queryClient.invalidateQueries({ queryKey: ["reminders"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Reminder run failed"),
  });

  return (
    <DashboardShell title="Fee Records" description="Balances and due dates driving the reminder engine">
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => send.mutate()}
          disabled={send.isPending}
          className="gap-2 rounded-xl"
        >
          {send.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Send reminders now
        </Button>
      </div>
      <Card className="rounded-2xl border-border/70 p-4 shadow-soft sm:p-5">

        {isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : (data ?? []).length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No fee records yet. Add students first, then create their fee records.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {row.students?.full_name ?? "—"}
                      <span className="block text-xs text-muted-foreground">
                        {row.students?.register_number ?? ""}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.term ?? "—"}</TableCell>
                    <TableCell>{inr(row.total_fee)}</TableCell>
                    <TableCell>{inr(row.paid_fee)}</TableCell>
                    <TableCell className="font-semibold">{inr(row.balance_fee)}</TableCell>
                    <TableCell className="text-muted-foreground">{row.due_date}</TableCell>
                    <TableCell>
                      <Badge variant={TONE[row.status] ?? "outline"} className="rounded-full capitalize">
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </DashboardShell>
  );
}
