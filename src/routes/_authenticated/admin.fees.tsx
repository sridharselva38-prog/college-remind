import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listFeeRecords } from "@/lib/app.functions";
import { DashboardShell } from "@/components/DashboardShell";
import { inr } from "@/components/StatCard";
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
      { name: "description", content: "Track fee totals, payments, balances and due dates." },
    ],
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
  const { data, isPending } = useQuery({ queryKey: ["fees"], queryFn: () => fetchFees() });

  return (
    <DashboardShell title="Fee Records" description="Balances and due dates driving the reminder engine">
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
