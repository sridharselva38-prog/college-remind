import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, IndianRupee, Wallet } from "lucide-react";
import { getStudentOverview } from "@/lib/app.functions";
import { DashboardShell } from "@/components/DashboardShell";
import { StatCard, inr } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/student/dashboard")({
  head: () => ({
    meta: [
      { title: "My Fees — FeeSync AI" },
      { name: "description", content: "View your student fee balance, upcoming due dates, payment link and a complete history of every fee reminder sent to you." },
      { property: "og:title", content: "My Fees — FeeSync AI" },
      { property: "og:description", content: "Your fee balance, upcoming due dates and full reminder history in one student dashboard." },
      { property: "og:url", content: "/student/dashboard" },
    ],
    links: [{ rel: "canonical", href: "/student/dashboard" }],
  }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const fetchOverview = useServerFn(getStudentOverview);
  const { data, isPending } = useQuery({ queryKey: ["student-overview"], queryFn: () => fetchOverview() });

  if (isPending) {
    return (
      <DashboardShell title="My Fees">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[132px] rounded-2xl" />)}
        </div>
      </DashboardShell>
    );
  }

  if (!data?.student) {
    return (
      <DashboardShell title="My Fees">
        <Card className="rounded-2xl border-border/70 p-12 text-center shadow-soft">
          <p className="text-sm text-muted-foreground">
            Your account isn't linked to a student record yet. Ask your college office to add your
            email to their student list.
          </p>
        </Card>
      </DashboardShell>
    );
  }

  const paymentLink = data.student.colleges?.payment_link ?? null;

  return (
    <DashboardShell title="My Fees" description={data.student.full_name}>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total fee" value={inr(data.summary?.totalFee)} icon={<IndianRupee className="size-[18px]" />} />
        <StatCard label="Paid" value={inr(data.summary?.collected)} tone="success" icon={<Wallet className="size-[18px]" />} />
        <StatCard
          label="Balance"
          value={inr(data.summary?.pending)}
          tone={(data.summary?.pending ?? 0) > 0 ? "warning" : "success"}
          icon={<CalendarClock className="size-[18px]" />}
        />
      </div>

      {paymentLink ? (
        <Button asChild className="mt-4 rounded-xl">
          <a href={paymentLink} target="_blank" rel="noreferrer">Pay fees online</a>
        </Button>
      ) : null}

      <Card className="mt-4 rounded-2xl border-border/70 p-5 shadow-soft">
        <h2 className="text-sm font-semibold">Fee records</h2>
        <div className="mt-3 space-y-3">
          {data.fees.length === 0 ? (
            <p className="text-sm text-muted-foreground">No fee records yet.</p>
          ) : (
            data.fees.map((f) => (
              <div key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 p-4">
                <div>
                  <p className="text-sm font-semibold">{f.term ?? "Fee"} · {f.academic_year ?? ""}</p>
                  <p className="text-xs text-muted-foreground">Due {f.due_date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{inr(f.balance_fee)} balance</p>
                  <Badge variant="secondary" className="mt-1 rounded-full capitalize">{f.status}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="mt-4 rounded-2xl border-border/70 p-5 shadow-soft">
        <h2 className="text-sm font-semibold">Reminder history</h2>
        <div className="mt-3 space-y-2">
          {data.reminders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reminders sent yet.</p>
          ) : (
            data.reminders.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="capitalize text-muted-foreground">{r.channel} · {r.stage}</span>
                <span className="text-xs text-muted-foreground">{new Date(r.sent_at).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </DashboardShell>
  );
}
