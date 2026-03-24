import { promises as fs } from "fs";
import path from "path";
import {
  type BoardCadence,
  type BoardItemKind,
  type BoardItemWithAssignments,
  type Completion,
  type CreateBoardItemRequest,
  type CreateKidRequest,
  type Kid,
  type ReplaceBoardItemAssignmentsRequest,
  type ReorderBoardItemsRequest,
  type Routine,
  type RoutineAssignment,
  type Task,
  type TaskAssignment,
  type ToggleBoardItemRequest,
  type UpdateBoardItemRequest,
  type UpdateKidRequest,
} from "@shared/schema";

const STORE_PATH = path.resolve(
  process.cwd(),
  process.env.DATA_STORE_PATH || "data/store.json",
);

type StoreData = {
  tasks: Task[];
  routines: Routine[];
  completions: Completion[];
  kids: Kid[];
  taskAssignments: TaskAssignment[];
  routineAssignments: RoutineAssignment[];
  counters: {
    task: number;
    routine: number;
    completion: number;
    kid: number;
    taskAssignment: number;
    routineAssignment: number;
  };
};

type StoreFileData = Omit<StoreData, "kids" | "taskAssignments" | "routineAssignments"> & {
  kids: Array<Omit<Kid, "createdAt"> & { createdAt: string }>;
  taskAssignments: Array<Omit<TaskAssignment, "createdAt"> & { createdAt: string }>;
  routineAssignments: Array<Omit<RoutineAssignment, "createdAt"> & { createdAt: string }>;
};

const seedTimestamp = new Date("2026-01-01T00:00:00.000Z");

function createDefaultStore(): StoreData {
  const tasks: Task[] = [
    {
      id: 1,
      title: "Resumen de deberes",
      timeInfo: "Antes de las 16:00",
      type: "daily",
      requiredDays: [1, 2, 3, 4, 5],
      icon: "clipboard-list",
      points: 1,
    },
    {
      id: 2,
      title: "Estudiar / Hacer deberes",
      timeInfo: "Antes de las 20:00",
      type: "daily",
      requiredDays: [1, 2, 3, 4, 5],
      icon: "book-open",
      points: 1,
    },
    {
      id: 3,
      title: "Cocina limpia y despejada",
      timeInfo: "Antes de las 20:00",
      type: "daily",
      requiredDays: [1, 2, 3, 4, 5, 6, 0],
      icon: "utensils",
      points: 1,
    },
    {
      id: 4,
      title: "Mochila preparada",
      timeInfo: "Antes de dormir",
      type: "daily",
      requiredDays: [1, 2, 3, 4, 0],
      icon: "backpack",
      points: 1,
    },
    {
      id: 5,
      title: "Escritorio ordenado",
      timeInfo: "5 min antes de dormir",
      type: "daily",
      requiredDays: [1, 2, 3, 4, 5, 6, 0],
      icon: "monitor",
      points: 1,
    },
    {
      id: 6,
      title: "Doblar y guardar ropa",
      timeInfo: "Antes de las 18:00",
      type: "weekly",
      requiredDays: [1, 3, 0],
      icon: "shirt",
      points: 2,
    },
    {
      id: 7,
      title: "Lavadora/Secadora (Ropa oscura)",
      timeInfo: "Antes de las 16:00",
      type: "weekly",
      requiredDays: [4],
      icon: "washing-machine",
      points: 2,
    },
  ];

  const routines: Routine[] = [
    {
      id: 1,
      title: "Rutina de higiene de noche",
      timeInfo: "Antes de dormir",
      type: "daily",
      requiredDays: [1, 2, 3, 4, 5, 6, 0],
      icon: "bath",
      points: 1,
      completionMode: "all_or_nothing",
    },
  ];

  const kids: Kid[] = [
    {
      id: 1,
      name: "Principal",
      active: true,
      createdAt: seedTimestamp,
    },
  ];

  const taskAssignments: TaskAssignment[] = tasks.map((task, index) => ({
    id: index + 1,
    taskId: task.id,
    kidId: 1,
    sortOrder: index,
    createdAt: seedTimestamp,
  }));

  const routineAssignments: RoutineAssignment[] = [
    {
      id: 1,
      routineId: 1,
      kidId: 1,
      sortOrder: 5,
      createdAt: seedTimestamp,
    },
  ];

  return {
    tasks,
    routines,
    completions: [],
    kids,
    taskAssignments,
    routineAssignments,
    counters: {
      task: 7,
      routine: 1,
      completion: 0,
      kid: 1,
      taskAssignment: taskAssignments.length,
      routineAssignment: 1,
    },
  };
}

function toFileData(data: StoreData): StoreFileData {
  return {
    ...data,
    kids: data.kids.map((kid) => ({
      ...kid,
      createdAt: kid.createdAt.toISOString(),
    })),
    taskAssignments: data.taskAssignments.map((assignment) => ({
      ...assignment,
      createdAt: assignment.createdAt.toISOString(),
    })),
    routineAssignments: data.routineAssignments.map((assignment) => ({
      ...assignment,
      createdAt: assignment.createdAt.toISOString(),
    })),
  };
}

function fromFileData(data: StoreFileData): StoreData {
  return {
    ...data,
    kids: data.kids.map((kid) => ({
      ...kid,
      createdAt: new Date(kid.createdAt),
    })),
    taskAssignments: data.taskAssignments.map((assignment) => ({
      ...assignment,
      createdAt: new Date(assignment.createdAt),
    })),
    routineAssignments: data.routineAssignments.map((assignment) => ({
      ...assignment,
      createdAt: new Date(assignment.createdAt),
    })),
  };
}

function normalizeStore(store: StoreData): StoreData {
  const normalizedTaskAssignments = store.taskAssignments.map((assignment) => ({
    ...assignment,
    sortOrder:
      typeof (assignment as TaskAssignment & { sortOrder?: number }).sortOrder === "number"
        ? assignment.sortOrder
        : 0,
  }));

  const normalizedRoutineAssignments = store.routineAssignments.map((assignment) => ({
    ...assignment,
    sortOrder:
      typeof (assignment as RoutineAssignment & { sortOrder?: number }).sortOrder === "number"
        ? assignment.sortOrder
        : 0,
  }));

  const taskCadenceById = new Map(store.tasks.map((task) => [task.id, task.type]));
  const routineCadenceById = new Map(store.routines.map((routine) => [routine.id, routine.type]));

  const seenTaskGroups = new Set<string>();
  for (const assignment of normalizedTaskAssignments) {
    const cadence = taskCadenceById.get(assignment.taskId);
    if (!cadence) continue;
    const groupKey = `${assignment.kidId}:${cadence}`;
    if (seenTaskGroups.has(groupKey)) continue;
    seenTaskGroups.add(groupKey);

    const grouped = normalizedTaskAssignments
      .filter((row) => row.kidId === assignment.kidId && taskCadenceById.get(row.taskId) === cadence)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

    grouped.forEach((row, index) => {
      row.sortOrder = index;
    });
  }

  const seenRoutineGroups = new Set<string>();
  for (const assignment of normalizedRoutineAssignments) {
    const cadence = routineCadenceById.get(assignment.routineId);
    if (!cadence) continue;
    const groupKey = `${assignment.kidId}:${cadence}`;
    if (seenRoutineGroups.has(groupKey)) continue;
    seenRoutineGroups.add(groupKey);

    const grouped = normalizedRoutineAssignments
      .filter((row) => row.kidId === assignment.kidId && routineCadenceById.get(row.routineId) === cadence)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

    grouped.forEach((row, index) => {
      const taskCount = normalizedTaskAssignments.filter(
        (taskRow) => taskRow.kidId === row.kidId && taskCadenceById.get(taskRow.taskId) === cadence,
      ).length;
      row.sortOrder = taskCount + index;
    });
  }

  return {
    ...store,
    taskAssignments: normalizedTaskAssignments,
    routineAssignments: normalizedRoutineAssignments,
  };
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export interface IStorage {
  createBoardItem(data: CreateBoardItemRequest): Promise<Task | Routine>;
  getBoardItems(kidId?: number): Promise<BoardItemWithAssignments[]>;
  updateBoardItem(itemKind: BoardItemKind, itemId: number, data: UpdateBoardItemRequest): Promise<Task | Routine | null>;
  deleteBoardItem(itemKind: BoardItemKind, itemId: number): Promise<boolean>;
  getKids(): Promise<Kid[]>;
  createKid(data: CreateKidRequest): Promise<Kid>;
  updateKid(kidId: number, data: UpdateKidRequest): Promise<Kid | null>;
  deleteKid(kidId: number): Promise<boolean>;
  replaceBoardItemAssignments(
    itemKind: BoardItemKind,
    itemId: number,
    data: ReplaceBoardItemAssignmentsRequest,
  ): Promise<{ itemKind: BoardItemKind; itemId: number; kidIds: number[] } | null>;
  reorderBoardItems(data: ReorderBoardItemsRequest): Promise<void>;
  getCompletions(startDate: string, endDate: string): Promise<Completion[]>;
  toggleCompletion(data: ToggleBoardItemRequest): Promise<Completion>;
}

export class JsonFileStorage implements IStorage {
  private store: StoreData | null = null;
  private opQueue: Promise<void> = Promise.resolve();

  private async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.opQueue.then(fn, fn);
    this.opQueue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  private async ensureStoreLoaded() {
    if (this.store) return;
    this.store = await this.readStoreFromDisk();
  }

  private async readStoreFromDisk(): Promise<StoreData> {
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });

    if (!(await fileExists(STORE_PATH))) {
      const seeded = normalizeStore(createDefaultStore());
      await this.writeStoreToDisk(seeded);
      return seeded;
    }

    try {
      const raw = await fs.readFile(STORE_PATH, "utf-8");
      const parsed = JSON.parse(raw) as StoreFileData;
      return normalizeStore(fromFileData(parsed));
    } catch {
      const backupPath = `${STORE_PATH}.broken-${Date.now()}.json`;
      await fs.rename(STORE_PATH, backupPath).catch(() => undefined);
      const seeded = normalizeStore(createDefaultStore());
      await this.writeStoreToDisk(seeded);
      return seeded;
    }
  }

  private async writeStoreToDisk(store: StoreData) {
    const fileData = toFileData(store);
    const tmpPath = `${STORE_PATH}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(fileData, null, 2), "utf-8");
    await fs.rename(tmpPath, STORE_PATH);
  }

  private nextId(counter: keyof StoreData["counters"]) {
    if (!this.store) throw new Error("Store not loaded");
    this.store.counters[counter] += 1;
    return this.store.counters[counter];
  }

  async createBoardItem(data: CreateBoardItemRequest): Promise<Task | Routine> {
    return this.runExclusive(async () => {
      await this.ensureStoreLoaded();
      const store = this.store!;
      const uniqueKidIds = Array.from(new Set(data.kidIds));

      const createdAt = new Date();
      if (data.itemKind === "task") {
        const createdTask: Task = {
          id: this.nextId("task"),
          title: data.title,
          timeInfo: data.timeInfo,
          type: data.type,
          requiredDays: data.requiredDays,
          points: data.points,
          icon: data.icon,
        };
        store.tasks.push(createdTask);

        for (const kidId of uniqueKidIds) {
          store.taskAssignments.push({
            id: this.nextId("taskAssignment"),
            taskId: createdTask.id,
            kidId,
            sortOrder: this.getNextSortOrder(store, kidId, createdTask.type),
            createdAt,
          });
        }

        await this.writeStoreToDisk(store);
        return structuredClone(createdTask);
      }

      const createdRoutine: Routine = {
        id: this.nextId("routine"),
        title: data.title,
        timeInfo: data.timeInfo,
        type: data.type,
        requiredDays: data.requiredDays,
        points: data.points,
        icon: data.icon,
        completionMode: "all_or_nothing",
      };
      store.routines.push(createdRoutine);

      for (const kidId of uniqueKidIds) {
        store.routineAssignments.push({
          id: this.nextId("routineAssignment"),
          routineId: createdRoutine.id,
          kidId,
          sortOrder: this.getNextSortOrder(store, kidId, createdRoutine.type),
          createdAt,
        });
      }

      await this.writeStoreToDisk(store);
      return structuredClone(createdRoutine);
    });
  }

  async getBoardItems(kidId?: number): Promise<BoardItemWithAssignments[]> {
    return this.runExclusive(async () => {
      await this.ensureStoreLoaded();
      const store = this.store!;

      const taskAssignmentMap = new Map<number, number[]>();
      for (const row of store.taskAssignments) {
        const current = taskAssignmentMap.get(row.taskId) ?? [];
        current.push(row.kidId);
        taskAssignmentMap.set(row.taskId, current);
      }

      const routineAssignmentMap = new Map<number, number[]>();
      for (const row of store.routineAssignments) {
        const current = routineAssignmentMap.get(row.routineId) ?? [];
        current.push(row.kidId);
        routineAssignmentMap.set(row.routineId, current);
      }

      const filteredTasks =
        typeof kidId === "number"
          ? store.tasks.filter((task) => (taskAssignmentMap.get(task.id) ?? []).includes(kidId))
          : store.tasks;

      const filteredRoutines =
        typeof kidId === "number"
          ? store.routines.filter((routine) => (routineAssignmentMap.get(routine.id) ?? []).includes(kidId))
          : store.routines;

      const boardItems: BoardItemWithAssignments[] = [
        ...filteredTasks.map((task) => ({
          id: task.id,
          itemKind: "task" as const,
          title: task.title,
          timeInfo: task.timeInfo ?? null,
          type: task.type,
          requiredDays: task.requiredDays,
          icon: task.icon ?? null,
          points: task.points,
          kidIds: taskAssignmentMap.get(task.id) ?? [],
          sortOrder:
            kidId === undefined
              ? 0
              : (store.taskAssignments.find((row) => row.taskId === task.id && row.kidId === kidId)?.sortOrder ?? 0),
        })),
        ...filteredRoutines.map((routine) => ({
          id: routine.id,
          itemKind: "routine" as const,
          title: routine.title,
          timeInfo: routine.timeInfo ?? null,
          type: routine.type,
          requiredDays: routine.requiredDays,
          icon: routine.icon ?? null,
          points: routine.points,
          kidIds: routineAssignmentMap.get(routine.id) ?? [],
          sortOrder:
            kidId === undefined
              ? 0
              : (store.routineAssignments.find((row) => row.routineId === routine.id && row.kidId === kidId)?.sortOrder ?? 0),
        })),
      ];

      const cadenceOrder: Record<BoardCadence, number> = { daily: 0, weekly: 1 };

      return boardItems
        .sort((a, b) => {
          const cadenceDiff = cadenceOrder[a.type] - cadenceOrder[b.type];
          if (cadenceDiff !== 0) return cadenceDiff;
          const orderDiff = a.sortOrder - b.sortOrder;
          if (orderDiff !== 0) return orderDiff;
          return a.id - b.id;
        })
        .map((item) => structuredClone(item));
    });
  }

  async updateBoardItem(
    itemKind: BoardItemKind,
    itemId: number,
    data: UpdateBoardItemRequest,
  ): Promise<Task | Routine | null> {
    return this.runExclusive(async () => {
      await this.ensureStoreLoaded();
      const store = this.store!;

      if (itemKind === "task") {
        const task = store.tasks.find((entry) => entry.id === itemId);
        if (!task) return null;
        const previousType = task.type;
        Object.assign(task, data);
        if (previousType !== task.type) {
          store.taskAssignments
            .filter((assignment) => assignment.taskId === task.id)
            .forEach((assignment) => {
              assignment.sortOrder = this.getKidCadenceAssignmentCount(
                store,
                assignment.kidId,
                task.type,
                "task",
                task.id,
              );
            });
        }
        await this.writeStoreToDisk(store);
        return structuredClone(task);
      }

      const routine = store.routines.find((entry) => entry.id === itemId);
      if (!routine) return null;
      const previousType = routine.type;
      Object.assign(routine, data);
      if (previousType !== routine.type) {
        store.routineAssignments
          .filter((assignment) => assignment.routineId === routine.id)
          .forEach((assignment) => {
            assignment.sortOrder = this.getKidCadenceAssignmentCount(
              store,
              assignment.kidId,
              routine.type,
              "routine",
              routine.id,
            );
          });
      }
      await this.writeStoreToDisk(store);
      return structuredClone(routine);
    });
  }

  async deleteBoardItem(itemKind: BoardItemKind, itemId: number): Promise<boolean> {
    return this.runExclusive(async () => {
      await this.ensureStoreLoaded();
      const store = this.store!;

      if (itemKind === "task") {
        const originalLength = store.tasks.length;
        store.tasks = store.tasks.filter((task) => task.id !== itemId);
        if (store.tasks.length === originalLength) return false;

        store.taskAssignments = store.taskAssignments.filter((assignment) => assignment.taskId !== itemId);
        store.completions = store.completions.filter((completion) => completion.taskId !== itemId);
      } else {
        const originalLength = store.routines.length;
        store.routines = store.routines.filter((routine) => routine.id !== itemId);
        if (store.routines.length === originalLength) return false;

        store.routineAssignments = store.routineAssignments.filter((assignment) => assignment.routineId !== itemId);
        store.completions = store.completions.filter((completion) => completion.routineId !== itemId);
      }

      const normalized = normalizeStore(store);
      this.store = normalized;
      await this.writeStoreToDisk(normalized);
      return true;
    });
  }

  async getKids(): Promise<Kid[]> {
    return this.runExclusive(async () => {
      await this.ensureStoreLoaded();
      return this.store!.kids
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((kid) => structuredClone(kid));
    });
  }

  async createKid(data: CreateKidRequest): Promise<Kid> {
    return this.runExclusive(async () => {
      await this.ensureStoreLoaded();
      const store = this.store!;
      const trimmedName = data.name.trim();

      if (store.kids.some((kid) => kid.name.toLowerCase() === trimmedName.toLowerCase())) {
        throw new Error("Kid name must be unique");
      }

      const createdKid: Kid = {
        id: this.nextId("kid"),
        name: trimmedName,
        active: true,
        createdAt: new Date(),
      };

      store.kids.push(createdKid);
      await this.writeStoreToDisk(store);
      return structuredClone(createdKid);
    });
  }

  async updateKid(kidId: number, data: UpdateKidRequest): Promise<Kid | null> {
    return this.runExclusive(async () => {
      await this.ensureStoreLoaded();
      const store = this.store!;
      const kid = store.kids.find((entry) => entry.id === kidId);
      if (!kid) return null;

      const trimmedName = data.name.trim();
      if (
        store.kids.some(
          (entry) => entry.id !== kidId && entry.name.toLowerCase() === trimmedName.toLowerCase(),
        )
      ) {
        throw new Error("Kid name must be unique");
      }

      kid.name = trimmedName;
      if (typeof data.active === "boolean") {
        kid.active = data.active;
      }

      await this.writeStoreToDisk(store);
      return structuredClone(kid);
    });
  }

  async deleteKid(kidId: number): Promise<boolean> {
    return this.runExclusive(async () => {
      await this.ensureStoreLoaded();
      const store = this.store!;
      const originalLength = store.kids.length;

      store.kids = store.kids.filter((kid) => kid.id !== kidId);
      if (store.kids.length === originalLength) return false;

      store.taskAssignments = store.taskAssignments.filter((assignment) => assignment.kidId !== kidId);
      store.routineAssignments = store.routineAssignments.filter((assignment) => assignment.kidId !== kidId);

      await this.writeStoreToDisk(store);
      return true;
    });
  }

  async replaceBoardItemAssignments(
    itemKind: BoardItemKind,
    itemId: number,
    data: ReplaceBoardItemAssignmentsRequest,
  ): Promise<{ itemKind: BoardItemKind; itemId: number; kidIds: number[] } | null> {
    return this.runExclusive(async () => {
      await this.ensureStoreLoaded();
      const store = this.store!;
      const uniqueKidIds = Array.from(new Set(data.kidIds));

      if (itemKind === "task") {
        const task = store.tasks.find((entry) => entry.id === itemId);
        if (!task) return null;

        const existingRows = store.taskAssignments.filter((assignment) => assignment.taskId === itemId);
        const existingSortByKid = new Map(existingRows.map((row) => [row.kidId, row.sortOrder]));
        store.taskAssignments = store.taskAssignments.filter((assignment) => assignment.taskId !== itemId);
        const createdAt = new Date();
        for (const kidId of uniqueKidIds) {
          store.taskAssignments.push({
            id: this.nextId("taskAssignment"),
            taskId: itemId,
            kidId,
            sortOrder: existingSortByKid.get(kidId) ?? this.getNextSortOrder(store, kidId, task.type),
            createdAt,
          });
        }

        await this.writeStoreToDisk(store);
        return { itemKind, itemId, kidIds: uniqueKidIds };
      }

      const routine = store.routines.find((entry) => entry.id === itemId);
      if (!routine) return null;

      const existingRows = store.routineAssignments.filter((assignment) => assignment.routineId === itemId);
      const existingSortByKid = new Map(existingRows.map((row) => [row.kidId, row.sortOrder]));
      store.routineAssignments = store.routineAssignments.filter((assignment) => assignment.routineId !== itemId);
      const createdAt = new Date();
      for (const kidId of uniqueKidIds) {
        store.routineAssignments.push({
          id: this.nextId("routineAssignment"),
          routineId: itemId,
          kidId,
          sortOrder: existingSortByKid.get(kidId) ?? this.getNextSortOrder(store, kidId, routine.type),
          createdAt,
        });
      }

      await this.writeStoreToDisk(store);
      return { itemKind, itemId, kidIds: uniqueKidIds };
    });
  }

  async reorderBoardItems(data: ReorderBoardItemsRequest): Promise<void> {
    return this.runExclusive(async () => {
      await this.ensureStoreLoaded();
      const store = this.store!;

      const taskIdsForCadence = new Set(
        store.tasks.filter((task) => task.type === data.type).map((task) => task.id),
      );
      const routineIdsForCadence = new Set(
        store.routines.filter((routine) => routine.type === data.type).map((routine) => routine.id),
      );

      const currentKeys = [
        ...store.taskAssignments
          .filter((assignment) => assignment.kidId === data.kidId && taskIdsForCadence.has(assignment.taskId))
          .map((assignment) => `task:${assignment.taskId}`),
        ...store.routineAssignments
          .filter((assignment) => assignment.kidId === data.kidId && routineIdsForCadence.has(assignment.routineId))
          .map((assignment) => `routine:${assignment.routineId}`),
      ].sort();

      const requestedKeys = data.orderedItems
        .map((item) => `${item.itemKind}:${item.itemId}`)
        .sort();

      if (
        currentKeys.length !== requestedKeys.length ||
        currentKeys.some((key, index) => key !== requestedKeys[index])
      ) {
        throw new Error("Invalid reorder payload");
      }

      data.orderedItems.forEach((item, index) => {
        if (item.itemKind === "task") {
          const assignment = store.taskAssignments.find(
            (row) => row.kidId === data.kidId && row.taskId === item.itemId,
          );
          if (assignment) {
            assignment.sortOrder = index;
          }
          return;
        }

        const assignment = store.routineAssignments.find(
          (row) => row.kidId === data.kidId && row.routineId === item.itemId,
        );
        if (assignment) {
          assignment.sortOrder = index;
        }
      });

      await this.writeStoreToDisk(store);
    });
  }

  async getCompletions(startDate: string, endDate: string): Promise<Completion[]> {
    return this.runExclusive(async () => {
      await this.ensureStoreLoaded();
      return this.store!.completions
        .filter((completion) => completion.date >= startDate && completion.date <= endDate)
        .map((completion) => structuredClone(completion));
    });
  }

  async toggleCompletion(data: ToggleBoardItemRequest): Promise<Completion> {
    return this.runExclusive(async () => {
      await this.ensureStoreLoaded();
      const store = this.store!;

      const existing =
        data.itemKind === "task"
          ? store.completions.find((entry) => entry.taskId === data.itemId && entry.date === data.date)
          : store.completions.find((entry) => entry.routineId === data.itemId && entry.date === data.date);

      if (existing) {
        existing.completed = data.completed;
        await this.writeStoreToDisk(store);
        return structuredClone(existing);
      }

      const created: Completion = {
        id: this.nextId("completion"),
        taskId: data.itemKind === "task" ? data.itemId : null,
        routineId: data.itemKind === "routine" ? data.itemId : null,
        date: data.date,
        completed: data.completed,
      };

      store.completions.push(created);
      await this.writeStoreToDisk(store);
      return structuredClone(created);
    });
  }

  private getKidCadenceAssignmentCount(
    store: StoreData,
    kidId: number,
    cadence: BoardCadence,
    excludeKind: BoardItemKind,
    excludeItemId: number,
  ): number {
    const taskIdsForCadence = new Set(
      store.tasks
        .filter((task) => task.type === cadence)
        .filter((task) => !(excludeKind === "task" && task.id === excludeItemId))
        .map((task) => task.id),
    );

    const routineIdsForCadence = new Set(
      store.routines
        .filter((routine) => routine.type === cadence)
        .filter((routine) => !(excludeKind === "routine" && routine.id === excludeItemId))
        .map((routine) => routine.id),
    );

    const taskCount = store.taskAssignments.filter(
      (assignment) => assignment.kidId === kidId && taskIdsForCadence.has(assignment.taskId),
    ).length;
    const routineCount = store.routineAssignments.filter(
      (assignment) => assignment.kidId === kidId && routineIdsForCadence.has(assignment.routineId),
    ).length;

    return taskCount + routineCount;
  }

  private getNextSortOrder(store: StoreData, kidId: number, cadence: BoardCadence): number {
    const taskIdsForCadence = new Set(
      store.tasks.filter((task) => task.type === cadence).map((task) => task.id),
    );
    const routineIdsForCadence = new Set(
      store.routines.filter((routine) => routine.type === cadence).map((routine) => routine.id),
    );

    const taskOrders = store.taskAssignments
      .filter((assignment) => assignment.kidId === kidId && taskIdsForCadence.has(assignment.taskId))
      .map((assignment) => assignment.sortOrder);

    const routineOrders = store.routineAssignments
      .filter((assignment) => assignment.kidId === kidId && routineIdsForCadence.has(assignment.routineId))
      .map((assignment) => assignment.sortOrder);

    const maxOrder = Math.max(-1, ...taskOrders, ...routineOrders);
    return maxOrder + 1;
  }
}

export const storage = new JsonFileStorage();
