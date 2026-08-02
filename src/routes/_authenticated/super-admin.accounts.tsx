import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { assignRole, listColleges } from "@/lib/app.functions";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/super-admin/accounts")({
  head: () => ({
    meta: [
      { title: "Accounts & Roles — FeeSync AI" },
      { name: "description", content: "Assign college admin and student roles to existing accounts." },
    ],
  }),
  component: AccountsPage,
});

type FormValues = { email: string; role: "super_admin" | "college_admin" | "student"; college_id: string };

function AccountsPage() {
  const fetchColleges = useServerFn(listColleges);
  const assign = useServerFn(assignRole);
  const { data: colleges } = useQuery({ queryKey: ["colleges"], queryFn: () => fetchColleges() });

  const form = useForm<FormValues>({
    defaultValues: { email: "", role: "college_admin", college_id: "" },
  });

  const mutation = useMutation({
    mutationFn: (v: FormValues) => assign({ data: v }),
    onSuccess: (r) => { toast.success(`Role assigned to ${r.email}`); form.reset(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell title="Accounts & Roles" description="Grant access to college admins and students">
      <Card className="max-w-xl rounded-2xl border-border/70 p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Assign a role</h2>
            <p className="text-xs text-muted-foreground">The person must have signed up already.</p>
          </div>
        </div>

        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Account email</Label>
            <Input type="email" required className="h-11 rounded-xl" {...form.register("email")} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Role</Label>
            <select
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              {...form.register("role")}
            >
              <option value="college_admin">College admin</option>
              <option value="student">Student</option>
              <option value="super_admin">Super admin</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">College (for college admins)</Label>
            <select
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              {...form.register("college_id")}
            >
              <option value="">No college</option>
              {(colleges ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <Button type="submit" className="h-11 w-full rounded-xl" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Assign role
          </Button>
        </form>
      </Card>
    </DashboardShell>
  );
}
