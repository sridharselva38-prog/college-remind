import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  IndianRupee,
  MessageCircle,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getDashboard } from "@/lib/app.functions";
import { DashboardShell } from "@/components/DashboardShell";
import { StatCard, inr } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "College Dashboard — FeeSync AI" },
      { name: "description", content: "Fee collection, pending balances and reminder performance." },
    ],
  }),
  component: AdminDashboard,
});

const PIE = ["var(--success)", "var(--warning)", "var(--destructive)", "var(--primary)"];

function AdminDashboard() {
  const fetchDashboard = useServerFn(getDashboard);
  const { data, isPending } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchDashboard(),
  });

  const f = data?.fees;
  const rate = f && f.totalExpected > 0 ? Math.round((f.totalCollected / f.totalExpected) * 100) : 0;

  const statusData = f
    ? [
        { name: "Paid", value: f.paidCount },
        { name: "Partial", value: f.partialCount },
        { name: "Overdue", value: f.overdueCount },
        { name: "Pending", value: f.pendingCount },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <DashboardShell
      title="College Dashboard"
      description="Live fee collection and reminder performance"
    >
      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[132px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total collected"
              value={inr(f?.totalCollected)}
              hint={`of ${inr(f?.totalExpected)} expected`}
              icon={<IndianRupee className="size-[18px]" />}
              tone="success"
            />
            <StatCard
              label="Pending balance"
              value={inr(f?.totalPending)}
              hint={`${f?.pendingCount ?? 0} records awaiting payment`}
              icon={<Clock className="size-[18px]" />}
              tone="warning"
            />
            <StatCard
              label="Overdue records"
              value={f?.overdueCount ?? 0}
              hint={inr(f?.overdueAmount) + " past due date"}
              icon={<AlertTriangle className="size-[18px]" />}
              tone="danger"
            />
            <StatCard
              label="Students"
              value={data?.studentCount ?? 0}
              hint="Active in your college"
              icon={<Users className="size-[18px]" />}
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="rounded-2xl border-border/70 p-6 shadow-soft lg:col-span-2">
              <h2 className="text-sm font-semibold">Collections by month</h2>
              <div className="mt-4 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.monthly ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} width={64} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        color: "var(--card-foreground)",
                      }}
                      formatter={(v: number) => inr(v)}
                    />
                    <Bar dataKey="collected" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="rounded-2xl border-border/70 p-6 shadow-soft">
              <h2 className="text-sm font-semibold">Fee status split</h2>
              <div className="mt-2 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {statusData.map((_, i) => (
                        <Cell key={i} fill={PIE[i % PIE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Collection rate</span>
                  <span className="font-semibold">{rate}%</span>
                </div>
                <Progress value={rate} className="h-2" />
              </div>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Reminders sent"
              value={data?.reminders.total ?? 0}
              hint="All channels"
              icon={<MessageCircle className="size-[18px]" />}
            />
            <StatCard
              label="Delivered"
              value={data?.reminders.delivered ?? 0}
              hint={`${data?.reminders.successRate ?? 0}% success rate`}
              icon={<CheckCircle2 className="size-[18px]" />}
              tone="success"
            />
            <StatCard
              label="Failed"
              value={data?.reminders.failed ?? 0}
              hint="Needs a retry or number fix"
              icon={<AlertTriangle className="size-[18px]" />}
              tone="danger"
            />
          </div>
        </>
      )}
    </DashboardShell>
  );
}
