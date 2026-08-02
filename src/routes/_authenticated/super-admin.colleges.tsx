import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { listColleges, saveCollege } from "@/lib/app.functions";
import { collegeSchema } from "@/lib/schemas";
import type { z } from "zod";

type CollegeInput = z.input<typeof collegeSchema>;
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/super-admin/colleges")({
  head: () => ({
    meta: [
      { title: "Colleges — FeeSync AI" },
      { name: "description", content: "Create and manage colleges on the FeeSync AI platform." },
    ],
  }),
  component: CollegesPage,
});

const EMPTY: CollegeInput = {
  name: "", code: "", email: "", phone: "", whatsapp_number: "",
  address: "", support_contact: "", payment_link: "", reminder_language: "both",
};

function CollegesPage() {
  const qc = useQueryClient();
  const fetchColleges = useServerFn(listColleges);
  const save = useServerFn(saveCollege);
  const [open, setOpen] = useState(false);

  const { data, isPending } = useQuery({ queryKey: ["colleges"], queryFn: () => fetchColleges() });
  const form = useForm<CollegeInput>({ resolver: zodResolver(collegeSchema), defaultValues: EMPTY });

  const mutation = useMutation({
    mutationFn: (v: CollegeInput) => save({ data: collegeSchema.parse(v) }),
    onSuccess: () => {
      toast.success("College saved");
      setOpen(false);
      form.reset(EMPTY);
      qc.invalidateQueries({ queryKey: ["colleges"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell
      title="Colleges"
      description="Each college gets its own students, fees and reminder settings"
      actions={
        <Button className="gap-1.5 rounded-xl" onClick={() => { form.reset(EMPTY); setOpen(true); }}>
          <Plus className="size-4" /> <span className="hidden sm:inline">Add college</span>
        </Button>
      }
    >
      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : (data ?? []).length === 0 ? (
        <Card className="rounded-2xl border-border/70 p-12 text-center shadow-soft">
          <p className="text-sm text-muted-foreground">No colleges yet. Add your first one.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((c) => (
            <Card key={c.id} className="gap-1 rounded-2xl border-border/70 p-5 shadow-soft">
              <p className="font-display text-base font-bold">{c.name}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.code}</p>
              <p className="mt-3 text-sm text-muted-foreground">{c.email ?? "No email"}</p>
              <p className="text-sm text-muted-foreground">{c.phone ?? "No phone"}</p>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>Add college</DialogTitle></DialogHeader>
          <form id="college-form" onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input {...form.register("name")} />
              {form.formState.errors.name ? <p className="text-xs text-destructive">{form.formState.errors.name.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Code</Label>
              <Input {...form.register("code")} />
              {form.formState.errors.code ? <p className="text-xs text-destructive">{form.formState.errors.code.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input type="email" {...form.register("email")} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone</Label>
              <Input {...form.register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">WhatsApp number</Label>
              <Input {...form.register("whatsapp_number")} placeholder="+91…" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Support contact</Label>
              <Input {...form.register("support_contact")} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Payment link</Label>
              <Input {...form.register("payment_link")} placeholder="https://…" />
              {form.formState.errors.payment_link ? <p className="text-xs text-destructive">{form.formState.errors.payment_link.message}</p> : null}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Address</Label>
              <Input {...form.register("address")} />
            </div>
          </form>
          <DialogFooter>
            <Button type="submit" form="college-form" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Save college
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
