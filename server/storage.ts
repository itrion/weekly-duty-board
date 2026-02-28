
import { db } from "./db";
import {
  tasks,
  completions,
  type Task,
  type Completion,
  type InsertCompletion
} from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  getTasks(): Promise<Task[]>;
  getCompletions(startDate: string, endDate: string): Promise<Completion[]>;
  toggleCompletion(data: InsertCompletion): Promise<Completion>;
}

export class DatabaseStorage implements IStorage {
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(tasks.id);
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
