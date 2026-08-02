import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2, IndianRupee, Users, Wallet } from "lucide-react";
import { getDashboard } from "@/lib/app.functions";
import { DashboardShell } from "@/components/DashboardShell";
import { StatCard, inr } from "@/components/StatCard";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/super-admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Platform Overview — FeeSync AI" },
      { name: "description", content: "Platform-wide colleges, students and collection metrics." },
    ],
  }),
  component: SuperDashboard,
});

function SuperDashboard() {
  const fetchDashboard = useServerFn(getDashboard);
  const { data, isPending } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDashboard() });

  if (isPending) {
    return (
      <DashboardShell title="Platform Overview">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[132px] rounded-2xl" />
          ))}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Platform Overview" description="Every college on FeeSync AI">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Colleges" value={data?.collegeCount ?? 0} icon={<Building2 className="size-[18px]" />} />
        <StatCard label="Students" value={data?.studentCount ?? 0} icon={<Users className="size-[18px]" />} />
        <StatCard
          label="Collected"
          value={inr(data?.fees.collected)}
          hint={`of ${inr(data?.fees.totalFee)} billed`}
          tone="success"
          icon={<IndianRupee className="size-[18px]" />}
        />
        <StatCard
          label="Pending"
          value={inr(data?.fees.pending)}
          hint={`${data?.fees.overdueCount ?? 0} overdue records`}
          tone="warning"
          icon={<Wallet className="size-[18px]" />}
        />
      </div>
    </DashboardShell>
  );
}
