import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCap, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { signupSchema } from "@/lib/schemas";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  next: z.string().optional(),
});

/** Only same-origin relative paths may be used as a post-login redirect. */
function safeNext(next?: string): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — FeeSync AI" },
      { name: "description", content: "Sign in to FeeSync AI with Google or email to manage college fee records, balances and automated payment reminders." },
      { property: "og:title", content: "Sign in — FeeSync AI" },
      { property: "og:description", content: "Access your FeeSync AI fee reminder dashboard for students, parents and college admins." },
      { property: "og:url", content: "/auth" },
    ],
    links: [{ rel: "canonical", href: "/auth" }],
  }),
  component: AuthPage,
});

type FormValues = z.infer<typeof signupSchema>;

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const next = safeNext(search.next);
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { full_name: "", email: "", password: "" },
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      if (next) window.location.replace(next);
      else navigate({ to: "/home", replace: true });
    });
  }, [navigate, next]);

  async function onSubmit(values: FormValues) {
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            emailRedirectTo: next ? `${window.location.origin}${next}` : window.location.origin,
            data: { full_name: values.full_name },
          },
        });
        if (error) throw error;
        setSent(true);
        toast.success("Check your inbox to confirm your email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (error) throw error;
        if (next) window.location.replace(next);
        else navigate({ to: "/home", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    // Always return to the public /auth/callback route — never straight into a
    // protected path, which can 404/bounce before the session is hydrated.
    const callback = `${window.location.origin}/auth/callback${
      next ? `?next=${encodeURIComponent(next)}` : ""
    }`;
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: callback,
    });
    if (result.error) {
      setBusy(false);
      toast.error(result.error.message ?? "Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    if (next) window.location.replace(next);
    else navigate({ to: "/home", replace: true });
  }

  async function forgotPassword() {
    const email = form.getValues("email");
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <Link to="/" className="mx-auto flex w-fit items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <GraduationCap className="size-5" />
          </span>
          <span className="font-display text-lg font-bold">FeeSync AI</span>
        </Link>

        <Card className="mt-6 rounded-3xl border-border/70 p-6 shadow-lift sm:p-8">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Never miss a fee deadline again.
            </p>
          </div>

          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as "signin" | "signup")}
            className="mt-6"
          >
            <TabsList className="grid w-full grid-cols-2 rounded-xl">
              <TabsTrigger value="signin" className="rounded-lg">
                Sign in
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg">
                Sign up
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            type="button"
            variant="outline"
            className="mt-5 h-11 w-full gap-2 rounded-xl"
            onClick={google}
            disabled={busy}
          >
            <GoogleMark /> Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or use email{" "}
            <span className="h-px flex-1 bg-border" />
          </div>

          {sent ? (
            <div className="rounded-xl bg-success-soft p-4 text-center text-sm text-success">
              <Mail className="mx-auto mb-2 size-5" />
              We sent a confirmation link to your email. Click it to activate your account.
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {mode === "signup" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="full_name">Full name</Label>
                  <Input id="full_name" className="h-11 rounded-xl" {...form.register("full_name")} />
                  <FieldError msg={form.formState.errors.full_name?.message} />
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="h-11 rounded-xl"
                  {...form.register("email")}
                />
                <FieldError msg={form.formState.errors.email?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  className="h-11 rounded-xl"
                  {...form.register("password")}
                />
                <FieldError msg={form.formState.errors.password?.message} />
              </div>

              <Button type="submit" className="h-11 w-full rounded-xl" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                {mode === "signin" ? "Sign in" : "Create account"}
              </Button>

              {mode === "signin" ? (
                <button
                  type="button"
                  onClick={forgotPassword}
                  className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </button>
              ) : null}
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

function FieldError({ msg }: { msg?: string | undefined }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive">{msg}</p>;
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8h-4v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8Z"
      />
    </svg>
  );
}
