
import { pgTable, text, serial, boolean, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  timeInfo: text("time_info"), // e.g., "Before 16:00"
  type: text("type").notNull(), // 'daily' or 'weekly'
  requiredDays: jsonb("required_days").$type<number[]>().notNull(), // Array of day indices (0=Sun, 1=Mon, etc.)
  icon: text("icon"), // Lucide icon name
  points: integer("points").default(1).notNull(),
});

export const completions = pgTable("completions", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  date: text("date").notNull(), // ISO Date string YYYY-MM-DD
  completed: boolean("completed").default(false).notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks);
export const insertCompletionSchema = createInsertSchema(completions);

export type Task = typeof tasks.$inferSelect;
export type Completion = typeof completions.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertCompletion = z.infer<typeof insertCompletionSchema>;

// Request types
export type ToggleTaskRequest = {
  taskId: number;
  date: string;
  completed: boolean;
};
