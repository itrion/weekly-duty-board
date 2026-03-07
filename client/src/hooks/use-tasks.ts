import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type {
  CreateKidRequest,
  ReplaceTaskAssignmentsRequest,
  ToggleTaskRequest,
  UpdateKidRequest,
  UpdateTaskRequest,
} from "@shared/schema";

export function useTasks(kidId?: number) {
  return useQuery({
    queryKey: [api.tasks.list.path, kidId ?? "all"],
    queryFn: async () => {
      const search = typeof kidId === "number" ? `?kidId=${kidId}` : "";
      const res = await fetch(`${api.tasks.list.path}${search}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return api.tasks.list.responses[200].parse(await res.json());
    },
  });
}

export function useKids() {
  return useQuery({
    queryKey: [api.kids.list.path],
    queryFn: async () => {
      const res = await fetch(api.kids.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch kids");
      return api.kids.list.responses[200].parse(await res.json());
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

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: number; data: UpdateTaskRequest }) => {
      const validated = api.tasks.update.input.parse(data);
      const url = buildUrl(api.tasks.update.path, { id: taskId });
      const res = await fetch(url, {
        method: api.tasks.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update task");
      return api.tasks.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
    },
  });
}

export function useReplaceTaskAssignments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      data,
    }: {
      taskId: number;
      data: ReplaceTaskAssignmentsRequest;
    }) => {
      const validated = api.tasks.replaceAssignments.input.parse(data);
      const url = buildUrl(api.tasks.replaceAssignments.path, { id: taskId });
      const res = await fetch(url, {
        method: api.tasks.replaceAssignments.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to replace task assignments");
      return api.tasks.replaceAssignments.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
    },
  });
}

export function useCreateKid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateKidRequest) => {
      const validated = api.kids.create.input.parse(data);
      const res = await fetch(api.kids.create.path, {
        method: api.kids.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create kid");
      return api.kids.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.kids.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
    },
  });
}

export function useUpdateKid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ kidId, data }: { kidId: number; data: UpdateKidRequest }) => {
      const validated = api.kids.update.input.parse(data);
      const url = buildUrl(api.kids.update.path, { id: kidId });
      const res = await fetch(url, {
        method: api.kids.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update kid");
      return api.kids.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.kids.list.path] });
    },
  });
}

export function useDeleteKid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (kidId: number) => {
      const url = buildUrl(api.kids.remove.path, { id: kidId });
      const res = await fetch(url, {
        method: api.kids.remove.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete kid");
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.kids.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
    },
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
