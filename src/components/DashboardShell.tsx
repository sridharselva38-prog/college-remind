import { type ReactNode, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Building2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useMe } from "@/hooks/useMe";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };

const NAV: Record<string, NavItem[]> = {
  super_admin: [
    { to: "/super-admin/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/super-admin/colleges", label: "Colleges", icon: Building2 },
    { to: "/super-admin/accounts", label: "Accounts & Roles", icon: ShieldCheck },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ],
  college_admin: [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/students", label: "Students", icon: Users },
    { to: "/admin/fees", label: "Fee Records", icon: Wallet },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ],
  student: [
    { to: "/student/dashboard", label: "My Fees", icon: Receipt },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ],
};

export function DashboardShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const items = NAV[me?.role ?? "student"] ?? NAV["student"]!;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-grid opacity-60" />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[264px] border-r border-sidebar-border bg-sidebar px-4 py-5 transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
              <GraduationCap className="size-5" />
            </span>
            <span className="font-display text-[17px] font-bold">FeeSync AI</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="size-4" />
          </Button>
        </div>

        <nav className="mt-7 space-y-1">
          {items.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="size-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-4 bottom-5 space-y-3">
          {me?.college ? (
            <div className="rounded-xl border border-sidebar-border bg-primary-soft/60 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                College
              </p>
              <p className="mt-1 truncate text-sm font-semibold">{me.college.name}</p>
            </div>
          ) : null}
          <Button variant="outline" className="w-full justify-start gap-2" onClick={signOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      {open ? (
        <button
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-30 bg-foreground/20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-20 glass flex items-center gap-3 px-4 py-3 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg font-bold sm:text-xl">{title}</h1>
            {description ? (
              <p className="truncate text-xs text-muted-foreground sm:text-sm">{description}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <Link to="/notifications" className="relative">
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="Notifications">
                <Bell className="size-[18px]" />
              </Button>
              {me && me.unreadCount > 0 ? (
                <Badge className="absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]">
                  {me.unreadCount}
                </Badge>
              ) : null}
            </Link>
            <ThemeToggle />
            <Avatar className="size-9 border border-border">
              <AvatarImage src={me?.profile?.avatar_url ?? undefined} alt="" />
              <AvatarFallback className="text-xs font-semibold">
                {(me?.profile?.full_name ?? me?.email ?? "U").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="relative mx-auto w-full max-w-[1400px] animate-rise px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
