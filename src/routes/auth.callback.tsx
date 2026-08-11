import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({ next: z.string().optional() });

/** Only same-origin relative paths may be used as a post-login redirect. */
function safeNext(next?: string): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Signing you in — FeeSync AI" },
      {
        name: "description",
        content:
          "Completing your FeeSync AI sign-in and redirecting you to your fee reminder dashboard.",
      },
      { property: "og:title", content: "Signing you in — FeeSync AI" },
      {
        property: "og:description",
        content: "Completing sign-in and taking you to your FeeSync AI dashboard.",
      },
      { property: "og:url", content: "/auth/callback" },
    ],
    links: [{ rel: "canonical", href: "/auth/callback" }],
  }),
  component: CallbackPage,
});

function CallbackPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const next = safeNext(search.next);

  useEffect(() => {
    let done = false;
    const go = (session: unknown) => {
      if (done) return;
      done = true;
      if (!session) {
        void navigate({ to: "/auth", replace: true });
        return;
      }
      if (next) window.location.replace(next);
      else void navigate({ to: "/home", replace: true });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) go(session);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) go(data.session);
      else setTimeout(() => go(null), 2500);
    });

    return () => sub.subscription.unsubscribe();
  }, [navigate, next]);

  return (
    <div className="grid min-h-screen place-items-center bg-grid px-4">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Signing you in…
      </div>
    </div>
  );
}
