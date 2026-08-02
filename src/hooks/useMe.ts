import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMe } from "@/lib/app.functions";

export type Me = Awaited<ReturnType<typeof getMe>>;

export function useMe() {
  const fetchMe = useServerFn(getMe);
  return useQuery({
    queryKey: ["me"],
    queryFn: () => fetchMe(),
    staleTime: 30_000,
  });
}

export function useRefreshMe() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["me"] });
}
