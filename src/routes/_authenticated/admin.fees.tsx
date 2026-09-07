import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BellRing, Loader2, Pencil, Send } from "lucide-react";
import { toast } from "sonner";
import {
  listFeeRecords,
  runRemindersNow,
  saveFeeRecord,
  sendReminderForFee,
} from "@/lib/app.functions";
import { feeSchema, type FeeInput } from "@/lib/schemas";
import { DashboardShell } from "@/components/DashboardShell";
import { inr } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

type Row = Awaited<ReturnType<typeof listFeeRecords>>[number];

function FeesPage() {
  const fetchFees = useServerFn(listFeeRecords);
  const runReminders = useServerFn(runRemindersNow);
  const saveFee = useServerFn(saveFeeRecord);
  const sendOne = useServerFn(sendReminderForFee);
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({ queryKey: ["fees"], queryFn: () => fetchFees() });

  const [open, setOpen] = useState(false);
  const [editingName, setEditingName] = useState("");

  const form = useForm<FeeInput>({
    resolver: zodResolver(feeSchema),
  });

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

  const sendRow = useMutation({
    mutationFn: (id: string) => sendOne({ data: { fee_record_id: id } }),
    onSuccess: (result) => {
      if (result.sent > 0) {
        toast.success(`Reminder sent (${result.sent} message${result.sent === 1 ? "" : "s"})`);
      } else {
        toast.error(result.errors[0] ?? "No phone number on record for this student");
      }
      void queryClient.invalidateQueries({ queryKey: ["reminders"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not send reminder"),
  });

  const saveMutation = useMutation({
    mutationFn: (values: FeeInput) => saveFee({ data: values }),
    onSuccess: () => {
      toast.success("Fee record updated");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["fees"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save"),
  });

  function edit(row: Row) {
    form.reset({
      id: row.id,
      student_id: row.student_id,
      academic_year: row.academic_year ?? "",
      term: row.term ?? "",
      total_fee: Number(row.total_fee ?? 0),
      paid_fee: Number(row.paid_fee ?? 0),
      scholarship: Number(row.scholarship ?? 0),
      discount: Number(row.discount ?? 0),
      late_fee: Number(row.late_fee ?? 0),
      due_date: row.due_date,
      notes: row.notes ?? "",
    });
    setEditingName(row.students?.full_name ?? "student");
    setOpen(true);
  }

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
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Send reminder to this student"
                        title="Send reminder to this student"
                        disabled={sendRow.isPending && sendRow.variables === row.id}
                        onClick={() => sendRow.mutate(row.id)}
                      >
                        {sendRow.isPending && sendRow.variables === row.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <BellRing className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit fee record"
                        title="Edit fee record"
                        onClick={() => edit(row)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit fee record — {editingName}</DialogTitle>
          </DialogHeader>
          <form
            id="fee-form"
            onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
            className="grid gap-4 sm:grid-cols-2"
          >
            <Field label="Academic year">
              <Input {...form.register("academic_year")} placeholder="2025-26" />
            </Field>
            <Field label="Term">
              <Input {...form.register("term")} placeholder="Semester 1" />
            </Field>
            <Field label="Total fee" error={form.formState.errors.total_fee?.message}>
              <Input type="number" step="1" {...form.register("total_fee")} />
            </Field>
            <Field label="Paid fee" error={form.formState.errors.paid_fee?.message}>
              <Input type="number" step="1" {...form.register("paid_fee")} />
            </Field>
            <Field label="Scholarship">
              <Input type="number" step="1" {...form.register("scholarship")} />
            </Field>
            <Field label="Discount">
              <Input type="number" step="1" {...form.register("discount")} />
            </Field>
            <Field label="Late fee">
              <Input type="number" step="1" {...form.register("late_fee")} />
            </Field>
            <Field label="Due date" error={form.formState.errors.due_date?.message}>
              <Input type="date" {...form.register("due_date")} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes">
                <Input {...form.register("notes")} />
              </Field>
            </div>
          </form>
          <DialogFooter>
            <Button type="submit" form="fee-form" disabled={saveMutation.isPending} className="gap-2">
              {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
