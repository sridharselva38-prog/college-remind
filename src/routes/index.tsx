import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BellRing,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  LineChart,
  MessageCircle,
  Mail,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FeeSync AI — Never Miss a Fee Deadline Again" },
      { name: "description", content: "Smart college fee reminder bot: track student fee balances and auto-send WhatsApp, email and push reminders to students and parents." },
      { property: "og:title", content: "FeeSync AI — Never Miss a Fee Deadline Again" },
      { property: "og:description", content: "Automate college fee tracking and multilingual WhatsApp, email and push reminders for students and parents." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: CalendarClock,
    title: "AI reminder schedule",
    body: "Automatic checks at 15, 7 and 3 days before due date, on the due date, and follow-ups until the balance clears.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp in English & Tamil",
    body: "Bilingual templates sent to students and parents, with delivery status and retry tracking on every message.",
  },
  {
    icon: Mail,
    title: "Rich email receipts",
    body: "Responsive HTML emails with the fee breakdown, due date, support contact and a payment link button.",
  },
  {
    icon: Smartphone,
    title: "Push notifications",
    body: "Upcoming, due-today, overdue and payment-confirmation alerts straight to the student's device.",
  },
  {
    icon: LineChart,
    title: "Live collection analytics",
    body: "Collection rate, pending balance, overdue students and reminder success rates on one dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based security",
    body: "Super admin, college admin and student roles with row-level database policies and audit logging.",
  },
];

const ROLES = [
  {
    title: "Super Admin",
    points: ["Manage colleges", "Assign admin accounts", "Platform-wide analytics", "Audit logs"],
  },
  {
    title: "College Admin",
    points: ["Student management", "Fee records & balances", "Reminder controls", "Reports & exports"],
  },
  {
    title: "Student",
    points: ["Fee status & balance", "Upcoming due dates", "Reminder history", "Notifications"],
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 glass">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
              <GraduationCap className="size-5" />
            </span>
            <span className="font-display text-[17px] font-bold">FeeSync AI</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-grid">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold">
            Smart College Fee Reminder Bot
          </Badge>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            Never Miss a <span className="text-gradient">Fee Deadline</span> Again.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            FeeSync AI watches every student's balance and due date, then reaches students and
            parents on WhatsApp, email and push — automatically, in English and Tamil.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-xl px-6">
              <Link to="/auth">Get started</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl px-6">
              <Link to="/auth" search={{ mode: "signup" }}>
                Create an account
              </Link>
            </Button>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[
              { k: "6-stage", v: "reminder ladder" },
              { k: "3 channels", v: "WhatsApp · Email · Push" },
              { k: "2 languages", v: "English & Tamil" },
            ].map((s) => (
              <Card key={s.k} className="gap-1 rounded-2xl border-border/70 p-5 shadow-soft">
                <p className="font-display text-xl font-bold">{s.k}</p>
                <p className="text-sm text-muted-foreground">{s.v}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold sm:text-4xl">Everything a fee office repeats, automated</h2>
          <p className="mt-3 text-muted-foreground">
            One dashboard for balances, reminders and delivery outcomes — no spreadsheets, no manual
            follow-up calls.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card
              key={f.title}
              className="gap-2 rounded-2xl border-border/70 p-6 shadow-soft transition-shadow hover:shadow-lift"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-3 text-base font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-3xl font-bold sm:text-4xl">Built for three kinds of users</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {ROLES.map((r) => (
              <Card key={r.title} className="rounded-2xl border-border/70 p-6 shadow-soft">
                <h3 className="font-display text-lg font-bold">{r.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {r.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                      {p}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <Card className="items-center gap-4 rounded-3xl border-border/70 p-10 text-center shadow-lift">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <BellRing className="size-6" />
          </span>
          <h2 className="text-2xl font-bold sm:text-3xl">Start reminding, stop chasing</h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Sign in with Google or email to set up your college, import students and let the reminder
            engine handle the rest.
          </p>
          <Button asChild size="lg" className="mt-2 rounded-xl px-6">
            <Link to="/auth">Open FeeSync AI</Link>
          </Button>
        </Card>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        FeeSync AI — Smart College Fee Reminder Bot
      </footer>
    </div>
  );
}
