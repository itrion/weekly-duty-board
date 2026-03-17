import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type {
  CreateBoardItemRequest,
  CreateKidRequest,
  ReorderBoardItemsRequest,
  ReplaceBoardItemAssignmentsRequest,
  ToggleBoardItemRequest,
  UpdateBoardItemRequest,
  UpdateKidRequest,
  BoardItemKind,
} from "@shared/schema";

async function getErrorMessage(res: Response, fallback: string) {
  try {
    const payload = await res.json();
    if (typeof payload?.message === "string") {
      return payload.message;
    }
  } catch {
    // Ignore malformed error bodies and fall back to a generic message.
  }

  return fallback;
}

export function useTasks(kidId?: number) {
  return useQuery({
    queryKey: [api.board.list.path, kidId ?? "all"],
    queryFn: async () => {
      const search = typeof kidId === "number" ? `?kidId=${kidId}` : "";
      const res = await fetch(`${api.board.list.path}${search}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch board items");
      return api.board.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateBoardItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBoardItemRequest) => {
      const validated = api.board.create.input.parse(data);
      const res = await fetch(api.board.create.path, {
        method: api.board.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await getErrorMessage(res, "No se pudo crear el elemento."));
      }
      return api.board.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.board.list.path] });
    },
  });
}

export function useReorderBoardItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReorderBoardItemsRequest) => {
      const validated = api.board.reorder.input.parse(data);
      const res = await fetch(api.board.reorder.path, {
        method: api.board.reorder.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reorder board items");
      return api.board.reorder.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.board.list.path] });
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

export function useUpdateBoardItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemKind,
      itemId,
      data,
    }: {
      itemKind: BoardItemKind;
      itemId: number;
      data: UpdateBoardItemRequest;
    }) => {
      const validated = api.board.update.input.parse(data);
      const url = buildUrl(api.board.update.path, { kind: itemKind, id: itemId });
      const res = await fetch(url, {
        method: api.board.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await getErrorMessage(res, "No se pudo actualizar el elemento."));
      }
      return api.board.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.board.list.path] });
    },
  });
}

export function useReplaceBoardItemAssignments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemKind,
      itemId,
      data,
    }: {
      itemKind: BoardItemKind;
      itemId: number;
      data: ReplaceBoardItemAssignmentsRequest;
    }) => {
      const validated = api.board.replaceAssignments.input.parse(data);
      const url = buildUrl(api.board.replaceAssignments.path, { kind: itemKind, id: itemId });
      const res = await fetch(url, {
        method: api.board.replaceAssignments.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await getErrorMessage(res, "No se pudieron actualizar las asignaciones."));
      }
      return api.board.replaceAssignments.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.board.list.path] });
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
      queryClient.invalidateQueries({ queryKey: [api.board.list.path] });
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
      queryClient.invalidateQueries({ queryKey: [api.board.list.path] });
    },
  });
}

export function useToggleCompletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ToggleBoardItemRequest) => {
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

export const useUpdateTask = useUpdateBoardItem;
export const useReplaceTaskAssignments = useReplaceBoardItemAssignments;
