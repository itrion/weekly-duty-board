import { db } from "./db";
import {
  tasks,
  routines,
  completions,
  kids,
  taskAssignments,
  routineAssignments,
  type Task,
  type Routine,
  type Completion,
  type Kid,
  type CreateKidRequest,
  type UpdateKidRequest,
  type BoardItemWithAssignments,
  type UpdateBoardItemRequest,
  type CreateBoardItemRequest,
  type ReplaceBoardItemAssignmentsRequest,
  type BoardItemKind,
  type BoardCadence,
  type ToggleBoardItemRequest,
} from "@shared/schema";
import { and, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";

class AssignmentLimitError extends Error {
  constructor(
    public readonly kidId: number,
    public readonly cadence: BoardCadence,
    public readonly limit: number,
  ) {
    super(`Kid ${kidId} already has the ${cadence} slot limit (${limit}).`);
    this.name = "AssignmentLimitError";
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
  getCompletions(startDate: string, endDate: string): Promise<Completion[]>;
  toggleCompletion(data: ToggleBoardItemRequest): Promise<Completion>;
}

export class DatabaseStorage implements IStorage {
  async createBoardItem(data: CreateBoardItemRequest): Promise<Task | Routine> {
    const uniqueKidIds = Array.from(new Set(data.kidIds));

    await this.assertKidSlotCapacity({
      cadence: data.type,
      itemKind: data.itemKind,
      itemId: -1,
      nextKidIds: uniqueKidIds,
      existingKidIds: new Set<number>(),
    });

    if (data.itemKind === "task") {
      const [createdTask] = await db
        .insert(tasks)
        .values({
          title: data.title,
          timeInfo: data.timeInfo,
          type: data.type,
          requiredDays: data.requiredDays,
          points: data.points,
          icon: data.icon,
        })
        .returning();

      if (uniqueKidIds.length > 0) {
        await db.insert(taskAssignments).values(
          uniqueKidIds.map((kidId) => ({
            taskId: createdTask.id,
            kidId,
          })),
        );
      }
      return createdTask;
    }

    const [createdRoutine] = await db
      .insert(routines)
      .values({
        title: data.title,
        timeInfo: data.timeInfo,
        type: data.type,
        requiredDays: data.requiredDays,
        points: data.points,
        icon: data.icon,
      })
      .returning();

    if (uniqueKidIds.length > 0) {
      await db.insert(routineAssignments).values(
        uniqueKidIds.map((kidId) => ({
          routineId: createdRoutine.id,
          kidId,
        })),
      );
    }

    return createdRoutine;
  }

  async getBoardItems(kidId?: number): Promise<BoardItemWithAssignments[]> {
    const [taskAssignmentRows, routineAssignmentRows] = await Promise.all([
      db
        .select({
          taskId: taskAssignments.taskId,
          kidId: taskAssignments.kidId,
        })
        .from(taskAssignments),
      db
        .select({
          routineId: routineAssignments.routineId,
          kidId: routineAssignments.kidId,
        })
        .from(routineAssignments),
    ]);

    const taskAssignmentMap = new Map<number, number[]>();
    for (const row of taskAssignmentRows) {
      const current = taskAssignmentMap.get(row.taskId) ?? [];
      current.push(row.kidId);
      taskAssignmentMap.set(row.taskId, current);
    }

    const routineAssignmentMap = new Map<number, number[]>();
    for (const row of routineAssignmentRows) {
      const current = routineAssignmentMap.get(row.routineId) ?? [];
      current.push(row.kidId);
      routineAssignmentMap.set(row.routineId, current);
    }

    const filterTaskIds =
      typeof kidId === "number"
        ? new Set(taskAssignmentRows.filter((row) => row.kidId === kidId).map((row) => row.taskId))
        : null;
    const filterRoutineIds =
      typeof kidId === "number"
        ? new Set(routineAssignmentRows.filter((row) => row.kidId === kidId).map((row) => row.routineId))
        : null;

    const [baseTasks, baseRoutines] = await Promise.all([
      filterTaskIds === null
        ? db.select().from(tasks).orderBy(tasks.id)
        : filterTaskIds.size === 0
          ? Promise.resolve([])
          : db.select().from(tasks).where(inArray(tasks.id, Array.from(filterTaskIds))).orderBy(tasks.id),
      filterRoutineIds === null
        ? db.select().from(routines).orderBy(routines.id)
        : filterRoutineIds.size === 0
          ? Promise.resolve([])
          : db
              .select()
              .from(routines)
              .where(inArray(routines.id, Array.from(filterRoutineIds)))
              .orderBy(routines.id),
    ]);

    const boardItems: BoardItemWithAssignments[] = [
      ...baseTasks.map((task) => ({
        id: task.id,
        itemKind: "task" as const,
        title: task.title,
        timeInfo: task.timeInfo ?? null,
        type: task.type,
        requiredDays: task.requiredDays,
        icon: task.icon ?? null,
        points: task.points,
        kidIds: taskAssignmentMap.get(task.id) ?? [],
      })),
      ...baseRoutines.map((routine) => ({
        id: routine.id,
        itemKind: "routine" as const,
        title: routine.title,
        timeInfo: routine.timeInfo ?? null,
        type: routine.type,
        requiredDays: routine.requiredDays,
        icon: routine.icon ?? null,
        points: routine.points,
        kidIds: routineAssignmentMap.get(routine.id) ?? [],
      })),
    ];

    const cadenceOrder: Record<BoardCadence, number> = {
      daily: 0,
      weekly: 1,
    };
    const kindOrder: Record<BoardItemKind, number> = {
      task: 0,
      routine: 1,
    };

    return boardItems.sort((a, b) => {
      const cadenceDiff = cadenceOrder[a.type] - cadenceOrder[b.type];
      if (cadenceDiff !== 0) return cadenceDiff;
      const kindDiff = kindOrder[a.itemKind] - kindOrder[b.itemKind];
      if (kindDiff !== 0) return kindDiff;
      return a.id - b.id;
    });
  }

  async updateBoardItem(
    itemKind: BoardItemKind,
    itemId: number,
    data: UpdateBoardItemRequest,
  ): Promise<Task | Routine | null> {
    if (itemKind === "task") {
      const [updated] = await db.update(tasks).set(data).where(eq(tasks.id, itemId)).returning();
      return updated ?? null;
    }

    const [updated] = await db.update(routines).set(data).where(eq(routines.id, itemId)).returning();
    return updated ?? null;
  }

  async deleteBoardItem(itemKind: BoardItemKind, itemId: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      if (itemKind === "task") {
        await tx.delete(taskAssignments).where(eq(taskAssignments.taskId, itemId));
        await tx.delete(completions).where(eq(completions.taskId, itemId));
        const deleted = await tx.delete(tasks).where(eq(tasks.id, itemId)).returning({ id: tasks.id });
        return deleted.length > 0;
      }

      await tx.delete(routineAssignments).where(eq(routineAssignments.routineId, itemId));
      await tx.delete(completions).where(eq(completions.routineId, itemId));
      const deleted = await tx.delete(routines).where(eq(routines.id, itemId)).returning({ id: routines.id });
      return deleted.length > 0;
    });
  }

  async getKids(): Promise<Kid[]> {
    return await db.select().from(kids).orderBy(kids.name);
  }

  async createKid(data: CreateKidRequest): Promise<Kid> {
    const [created] = await db
      .insert(kids)
      .values({
        name: data.name.trim(),
        active: true,
      })
      .returning();
    return created;
  }

  async updateKid(kidId: number, data: UpdateKidRequest): Promise<Kid | null> {
    const updates: { name: string; active?: boolean } = {
      name: data.name.trim(),
    };
    if (typeof data.active === "boolean") {
      updates.active = data.active;
    }

    const [updated] = await db.update(kids).set(updates).where(eq(kids.id, kidId)).returning();
    return updated ?? null;
  }

  async deleteKid(kidId: number): Promise<boolean> {
    await db.delete(taskAssignments).where(eq(taskAssignments.kidId, kidId));
    await db.delete(routineAssignments).where(eq(routineAssignments.kidId, kidId));
    const deleted = await db.delete(kids).where(eq(kids.id, kidId)).returning();
    return deleted.length > 0;
  }

  async replaceBoardItemAssignments(
    itemKind: BoardItemKind,
    itemId: number,
    data: ReplaceBoardItemAssignmentsRequest,
  ): Promise<{ itemKind: BoardItemKind; itemId: number; kidIds: number[] } | null> {
    const uniqueKidIds = Array.from(new Set(data.kidIds));

    if (itemKind === "task") {
      const [task] = await db.select({ id: tasks.id, type: tasks.type }).from(tasks).where(eq(tasks.id, itemId));
      if (!task) return null;

      const existingRows = await db
        .select({ kidId: taskAssignments.kidId })
        .from(taskAssignments)
        .where(eq(taskAssignments.taskId, itemId));

      await this.assertKidSlotCapacity({
        cadence: task.type,
        itemKind,
        itemId,
        nextKidIds: uniqueKidIds,
        existingKidIds: new Set(existingRows.map((row) => row.kidId)),
      });

      await db.delete(taskAssignments).where(eq(taskAssignments.taskId, itemId));
      if (uniqueKidIds.length > 0) {
        await db.insert(taskAssignments).values(
          uniqueKidIds.map((kidId) => ({
            taskId: itemId,
            kidId,
          })),
        );
      }

      return { itemKind, itemId, kidIds: uniqueKidIds };
    }

    const [routine] = await db
      .select({ id: routines.id, type: routines.type })
      .from(routines)
      .where(eq(routines.id, itemId));
    if (!routine) return null;

    const existingRows = await db
      .select({ kidId: routineAssignments.kidId })
      .from(routineAssignments)
      .where(eq(routineAssignments.routineId, itemId));

    await this.assertKidSlotCapacity({
      cadence: routine.type,
      itemKind,
      itemId,
      nextKidIds: uniqueKidIds,
      existingKidIds: new Set(existingRows.map((row) => row.kidId)),
    });

    await db.delete(routineAssignments).where(eq(routineAssignments.routineId, itemId));
    if (uniqueKidIds.length > 0) {
      await db.insert(routineAssignments).values(
        uniqueKidIds.map((kidId) => ({
          routineId: itemId,
          kidId,
        })),
      );
    }

    return { itemKind, itemId, kidIds: uniqueKidIds };
  }

  async getCompletions(startDate: string, endDate: string): Promise<Completion[]> {
    return await db
      .select()
      .from(completions)
      .where(and(gte(completions.date, startDate), lte(completions.date, endDate)));
  }

  async toggleCompletion(data: ToggleBoardItemRequest): Promise<Completion> {
    if (data.itemKind === "task") {
      const existing = await db
        .select()
        .from(completions)
        .where(and(eq(completions.taskId, data.itemId), eq(completions.date, data.date)));

      if (existing.length > 0) {
        const [updated] = await db
          .update(completions)
          .set({ completed: data.completed })
          .where(eq(completions.id, existing[0].id))
          .returning();
        return updated;
      }

      const [created] = await db
        .insert(completions)
        .values({
          taskId: data.itemId,
          routineId: null,
          date: data.date,
          completed: data.completed,
        })
        .returning();
      return created;
    }

    const existing = await db
      .select()
      .from(completions)
      .where(and(eq(completions.routineId, data.itemId), eq(completions.date, data.date)));

    if (existing.length > 0) {
      const [updated] = await db
        .update(completions)
        .set({ completed: data.completed })
        .where(eq(completions.id, existing[0].id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(completions)
      .values({
        taskId: null,
        routineId: data.itemId,
        date: data.date,
        completed: data.completed,
      })
      .returning();
    return created;
  }

  private async assertKidSlotCapacity(params: {
    cadence: BoardCadence;
    itemKind: BoardItemKind;
    itemId: number;
    nextKidIds: number[];
    existingKidIds: Set<number>;
  }) {
    const limit = params.cadence === "daily" ? 6 : 2;
    const newKidIds = params.nextKidIds.filter((kidId) => !params.existingKidIds.has(kidId));

    for (const kidId of newKidIds) {
      const assignedCount = await this.getKidCadenceAssignmentCount(
        kidId,
        params.cadence,
        params.itemKind,
        params.itemId,
      );
      if (assignedCount >= limit) {
        throw new AssignmentLimitError(kidId, params.cadence, limit);
      }
    }
  }

  private async getKidCadenceAssignmentCount(
    kidId: number,
    cadence: BoardCadence,
    excludeKind: BoardItemKind,
    excludeItemId: number,
  ): Promise<number> {
    const [taskCountRow, routineCountRow] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(taskAssignments)
        .innerJoin(tasks, eq(taskAssignments.taskId, tasks.id))
        .where(
          and(
            eq(taskAssignments.kidId, kidId),
            eq(tasks.type, cadence),
            excludeKind === "task" ? ne(taskAssignments.taskId, excludeItemId) : sql`true`,
          ),
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(routineAssignments)
        .innerJoin(routines, eq(routineAssignments.routineId, routines.id))
        .where(
          and(
            eq(routineAssignments.kidId, kidId),
            eq(routines.type, cadence),
            excludeKind === "routine" ? ne(routineAssignments.routineId, excludeItemId) : sql`true`,
          ),
        ),
    ]);

    return (taskCountRow[0]?.count ?? 0) + (routineCountRow[0]?.count ?? 0);
  }
}

export const storage = new DatabaseStorage();
export { AssignmentLimitError };
