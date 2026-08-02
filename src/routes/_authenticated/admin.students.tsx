import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteStudent, listStudents, saveStudent } from "@/lib/app.functions";
import { studentSchema, type StudentInput } from "@/lib/schemas";
import { DashboardShell } from "@/components/DashboardShell";
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

export const Route = createFileRoute("/_authenticated/admin/students")({
  head: () => ({
    meta: [
      { title: "Students — FeeSync AI" },
      { name: "description", content: "Add, edit and search student records for fee reminders." },
    ],
  }),
  component: StudentsPage,
});

const EMPTY: StudentInput = {
  full_name: "",
  register_number: "",
  department: "",
  course: "",
  section: "",
  student_phone: "",
  parent_phone: "",
  student_email: "",
  parent_email: "",
  address: "",
};

type Row = Awaited<ReturnType<typeof listStudents>>[number];

function StudentsPage() {
  const qc = useQueryClient();
  const fetchStudents = useServerFn(listStudents);
  const save = useServerFn(saveStudent);
  const remove = useServerFn(deleteStudent);

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const { data, isPending } = useQuery({
    queryKey: ["students"],
    queryFn: () => fetchStudents({ data: {} }),
  });

  const form = useForm<StudentInput>({
    resolver: zodResolver(studentSchema),
    defaultValues: EMPTY,
  });

  const saveMutation = useMutation({
    mutationFn: (values: StudentInput) => save({ data: values }),
    onSuccess: () => {
      toast.success("Student saved");
      setOpen(false);
      form.reset(EMPTY);
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Student removed");
      qc.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = (data ?? []) as Row[];
    if (!term) return list;
    return list.filter(
      (r) =>
        r.full_name.toLowerCase().includes(term) ||
        r.register_number.toLowerCase().includes(term) ||
        (r.department ?? "").toLowerCase().includes(term),
    );
  }, [data, search]);

  function edit(row: Row) {
    form.reset({
      id: row.id,
      full_name: row.full_name,
      register_number: row.register_number,
      department: row.department ?? "",
      course: row.course ?? "",
      section: row.section ?? "",
      student_phone: row.student_phone ?? "",
      parent_phone: row.parent_phone ?? "",
      student_email: row.student_email ?? "",
      parent_email: row.parent_email ?? "",
      address: row.address ?? "",
      ...(row.year ? { year: row.year } : {}),
      ...(row.semester ? { semester: row.semester } : {}),
    });
    setOpen(true);
  }

  return (
    <DashboardShell
      title="Students"
      description="Contact details drive every reminder that gets sent"
      actions={
        <Button
          className="gap-1.5 rounded-xl"
          onClick={() => {
            form.reset(EMPTY);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> <span className="hidden sm:inline">Add student</span>
        </Button>
      }
    >
      <Card className="rounded-2xl border-border/70 p-4 shadow-soft sm:p-5">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, register number, department"
            className="h-11 rounded-xl pl-9"
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          {isPending ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No students yet. Add your first student to start sending reminders.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Register no.</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {row.full_name}
                      {row.year ? (
                        <Badge variant="secondary" className="ml-2 rounded-full text-[10px]">
                          Year {row.year}
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.register_number}</TableCell>
                    <TableCell className="text-muted-foreground">{row.department ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>{row.student_phone ?? "—"}</div>
                      <div>{row.parent_phone ?? "—"}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => edit(row)} aria-label="Edit">
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        onClick={() => deleteMutation.mutate(row.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.getValues("id") ? "Edit student" : "Add student"}</DialogTitle>
          </DialogHeader>
          <form
            id="student-form"
            onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
            className="grid gap-4 sm:grid-cols-2"
          >
            <Field label="Full name" error={form.formState.errors.full_name?.message}>
              <Input {...form.register("full_name")} />
            </Field>
            <Field label="Register number" error={form.formState.errors.register_number?.message}>
              <Input {...form.register("register_number")} />
            </Field>
            <Field label="Department">
              <Input {...form.register("department")} />
            </Field>
            <Field label="Course">
              <Input {...form.register("course")} />
            </Field>
            <Field label="Year">
              <Input type="number" min={1} max={6} {...form.register("year")} />
            </Field>
            <Field label="Semester">
              <Input type="number" min={1} max={12} {...form.register("semester")} />
            </Field>
            <Field label="Student phone (WhatsApp)">
              <Input {...form.register("student_phone")} placeholder="+91…" />
            </Field>
            <Field label="Parent phone (WhatsApp)">
              <Input {...form.register("parent_phone")} placeholder="+91…" />
            </Field>
            <Field label="Student email" error={form.formState.errors.student_email?.message}>
              <Input type="email" {...form.register("student_email")} />
            </Field>
            <Field label="Parent email" error={form.formState.errors.parent_email?.message}>
              <Input type="email" {...form.register("parent_email")} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <Input {...form.register("address")} />
              </Field>
            </div>
          </form>
          <DialogFooter>
            <Button type="submit" form="student-form" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Save student
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
