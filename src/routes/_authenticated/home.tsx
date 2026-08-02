import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useMe } from "@/hooks/useMe";

export const Route = createFileRoute("/_authenticated/home")({
  component: HomeRedirect,
});

function HomeRedirect() {
  const { data: me, isPending, error } = useMe();
  const navigate = useNavigate();

  useEffect(() => {
    if (me?.home) navigate({ to: me.home, replace: true });
  }, [me?.home, navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
      {error ? (
        <p className="text-sm text-destructive">{error.message}</p>
      ) : (
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          {isPending ? <Loader2 className="size-6 animate-spin" /> : null}
          <p className="text-sm">Preparing your workspace…</p>
        </div>
      )}
    </div>
  );
}
