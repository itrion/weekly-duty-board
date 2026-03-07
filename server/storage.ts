
import { db } from "./db";
import {
  tasks,
  completions,
  kids,
  taskAssignments,
  type Task,
  type Completion,
  type Kid,
  type InsertCompletion,
  type CreateKidRequest,
  type UpdateKidRequest,
  type ReplaceTaskAssignmentsRequest,
  type TaskWithAssignments,
  type UpdateTaskRequest,
} from "@shared/schema";
import { eq, and, gte, lte, inArray } from "drizzle-orm";

export interface IStorage {
  getTasks(kidId?: number): Promise<TaskWithAssignments[]>;
  updateTask(taskId: number, data: UpdateTaskRequest): Promise<Task | null>;
  getKids(): Promise<Kid[]>;
  createKid(data: CreateKidRequest): Promise<Kid>;
  updateKid(kidId: number, data: UpdateKidRequest): Promise<Kid | null>;
  deleteKid(kidId: number): Promise<boolean>;
  replaceTaskAssignments(taskId: number, data: ReplaceTaskAssignmentsRequest): Promise<{ taskId: number; kidIds: number[] } | null>;
  getCompletions(startDate: string, endDate: string): Promise<Completion[]>;
  toggleCompletion(data: InsertCompletion): Promise<Completion>;
}

export class DatabaseStorage implements IStorage {
  async getTasks(kidId?: number): Promise<TaskWithAssignments[]> {
    const assignmentRows = await db
      .select({
        taskId: taskAssignments.taskId,
        kidId: taskAssignments.kidId,
      })
      .from(taskAssignments);

    const assignmentMap = new Map<number, number[]>();
    for (const row of assignmentRows) {
      const current = assignmentMap.get(row.taskId) ?? [];
      current.push(row.kidId);
      assignmentMap.set(row.taskId, current);
    }

    const filterTaskIds =
      typeof kidId === "number"
        ? new Set(
            assignmentRows
              .filter((row) => row.kidId === kidId)
              .map((row) => row.taskId),
          )
        : null;

    const baseTasks =
      filterTaskIds === null
        ? await db.select().from(tasks).orderBy(tasks.id)
        : filterTaskIds.size === 0
          ? []
          : await db
              .select()
              .from(tasks)
              .where(inArray(tasks.id, Array.from(filterTaskIds)))
              .orderBy(tasks.id);

    return baseTasks.map((task) => ({
      ...task,
      kidIds: assignmentMap.get(task.id) ?? [],
    }));
  }

  async updateTask(taskId: number, data: UpdateTaskRequest): Promise<Task | null> {
    const [updated] = await db.update(tasks)
      .set(data)
      .where(eq(tasks.id, taskId))
      .returning();

    return updated ?? null;
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

    const [updated] = await db
      .update(kids)
      .set(updates)
      .where(eq(kids.id, kidId))
      .returning();
    return updated ?? null;
  }

  async deleteKid(kidId: number): Promise<boolean> {
    await db.delete(taskAssignments).where(eq(taskAssignments.kidId, kidId));
    const deleted = await db.delete(kids).where(eq(kids.id, kidId)).returning();
    return deleted.length > 0;
  }

  async replaceTaskAssignments(
    taskId: number,
    data: ReplaceTaskAssignmentsRequest,
  ): Promise<{ taskId: number; kidIds: number[] } | null> {
    const taskExists = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, taskId));
    if (taskExists.length === 0) return null;

    const uniqueKidIds = Array.from(new Set(data.kidIds));
    await db.delete(taskAssignments).where(eq(taskAssignments.taskId, taskId));
    await db.insert(taskAssignments).values(
      uniqueKidIds.map((kidId) => ({
        taskId,
        kidId,
      })),
    );

    return { taskId, kidIds: uniqueKidIds };
  }

  async getCompletions(startDate: string, endDate: string): Promise<Completion[]> {
    return await db.select().from(completions)
      .where(and(
        gte(completions.date, startDate),
        lte(completions.date, endDate)
      ));
  }

  async toggleCompletion(data: InsertCompletion): Promise<Completion> {
    const existing = await db.select().from(completions)
      .where(and(
        eq(completions.taskId, data.taskId),
        eq(completions.date, data.date)
      ));

    if (existing.length > 0) {
      const [updated] = await db.update(completions)
        .set({ completed: data.completed })
        .where(eq(completions.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(completions)
        .values(data)
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
