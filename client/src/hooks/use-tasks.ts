import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { Task, Completion, ToggleTaskRequest } from "@shared/schema";

export function useTasks() {
  return useQuery({
    queryKey: [api.tasks.list.path],
    queryFn: async () => {
      const res = await fetch(api.tasks.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return api.tasks.list.responses[200].parse(await res.json());
    },
  });
}

export function useResetTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.tasks.reset.path, {
        method: api.tasks.reset.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reset tasks");
      return api.tasks.reset.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
    },
  });
}

export function useCompletions(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [api.completions.list.path, startDate, endDate],
    queryFn: async () => {
      const url = buildUrl(api.completions.list.path) + `?startDate=${startDate}&endDate=${endDate}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch completions");
      return api.completions.list.responses[200].parse(await res.json());
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useToggleCompletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ToggleTaskRequest) => {
      const validated = api.completions.toggle.input.parse(data);
      const res = await fetch(api.completions.toggle.path, {
        method: api.completions.toggle.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to toggle task");
      return api.completions.toggle.responses[200].parse(await res.json());
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant completion queries
      queryClient.invalidateQueries({ queryKey: [api.completions.list.path] });
    },
  });
}
