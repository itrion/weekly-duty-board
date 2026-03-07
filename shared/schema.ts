
import {
  pgTable,
  text,
  serial,
  boolean,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  timeInfo: text("time_info"), // e.g., "Before 16:00"
  type: text("type").$type<"daily" | "weekly">().notNull(),
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

export const kids = pgTable(
  "kids",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("kids_name_unique").on(table.name)],
);

export const taskAssignments = pgTable(
  "task_assignments",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id").notNull(),
    kidId: integer("kid_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("task_assignments_task_kid_unique").on(table.taskId, table.kidId),
  ],
);

export const insertTaskSchema = createInsertSchema(tasks);
export const insertCompletionSchema = createInsertSchema(completions);
export const insertKidSchema = createInsertSchema(kids);
export const insertTaskAssignmentSchema = createInsertSchema(taskAssignments);
export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(120),
  timeInfo: z.string().trim().max(120).nullable(),
  type: z.enum(["daily", "weekly"]),
  requiredDays: z.array(z.number().int().min(0).max(6)).min(1),
  points: z.number().int().min(1).max(20),
  icon: z.string().trim().min(1).max(64).nullable(),
});
export const createKidSchema = z.object({
  name: z.string().trim().min(1).max(60),
});
export const updateKidSchema = z.object({
  name: z.string().trim().min(1).max(60),
  active: z.boolean().optional(),
});
export const replaceTaskAssignmentsSchema = z.object({
  kidIds: z.array(z.number().int().positive()).min(1),
});
export const taskWithAssignmentsSchema = z.object({
  id: z.number(),
  title: z.string(),
  timeInfo: z.string().nullable(),
  type: z.enum(["daily", "weekly"]),
  requiredDays: z.array(z.number().int().min(0).max(6)),
  icon: z.string().nullable(),
  points: z.number().int(),
  kidIds: z.array(z.number().int().positive()),
});

export type Task = typeof tasks.$inferSelect;
export type Completion = typeof completions.$inferSelect;
export type Kid = typeof kids.$inferSelect;
export type TaskAssignment = typeof taskAssignments.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertCompletion = z.infer<typeof insertCompletionSchema>;
export type InsertKid = z.infer<typeof insertKidSchema>;
export type InsertTaskAssignment = z.infer<typeof insertTaskAssignmentSchema>;
export type UpdateTaskRequest = z.infer<typeof updateTaskSchema>;
export type CreateKidRequest = z.infer<typeof createKidSchema>;
export type UpdateKidRequest = z.infer<typeof updateKidSchema>;
export type ReplaceTaskAssignmentsRequest = z.infer<typeof replaceTaskAssignmentsSchema>;
export type TaskWithAssignments = z.infer<typeof taskWithAssignmentsSchema>;

// Request types
export type ToggleTaskRequest = {
  taskId: number;
  date: string;
  completed: boolean;
};
