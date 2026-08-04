import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BellOff, Check } from "lucide-react";
import { listNotifications, markNotification } from "@/lib/app.functions";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — FeeSync AI" },
      { name: "description", content: "Review fee reminders, upcoming due-date alerts and payment confirmations, and mark notifications as read." },
      { property: "og:title", content: "Notifications — FeeSync AI" },
      { property: "og:description", content: "Fee reminders, due-date alerts and payment confirmations in one notification center." },
      { property: "og:url", content: "/notifications" },
    ],
    links: [{ rel: "canonical", href: "/notifications" }],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listNotifications);
  const mark = useServerFn(markNotification);
  const { data, isPending } = useQuery({ queryKey: ["notifications"], queryFn: () => fetchList() });

  const mutation = useMutation({
    mutationFn: (v: { id: string; remove?: boolean }) => mark({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });

  return (
    <DashboardShell title="Notifications" description="Everything FeeSync AI has alerted you about">
      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : (data ?? []).length === 0 ? (
        <Card className="items-center gap-2 rounded-2xl border-border/70 p-12 text-center shadow-soft">
          <BellOff className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">You're all caught up.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((n) => (
            <Card
              key={n.id}
              className={cn(
                "flex-row items-start justify-between gap-4 rounded-2xl border-border/70 p-5 shadow-soft",
                !n.is_read && "bg-primary-soft/50",
              )}
            >
              <div>
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              {!n.is_read ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Mark as read"
                  onClick={() => mutation.mutate({ id: n.id })}
                >
                  <Check className="size-4" />
                </Button>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
