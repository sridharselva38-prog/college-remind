import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const inr = (v: number | string | null | undefined) =>
  "₹" + Number(v ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const tones = {
    default: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning-foreground",
    danger: "bg-danger-soft text-destructive",
  } as const;

  return (
    <Card className="gap-0 rounded-2xl border-border/70 p-5 shadow-soft transition-shadow hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        {icon ? (
          <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", tones[tone])}>
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-[28px]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}
