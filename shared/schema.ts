
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

export const cadenceSchema = z.enum(["daily", "weekly"]);
export const boardItemKindSchema = z.enum(["task", "routine"]);

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  timeInfo: text("time_info"), // e.g., "Before 16:00"
  type: text("type").$type<z.infer<typeof cadenceSchema>>().notNull(),
  requiredDays: jsonb("required_days").$type<number[]>().notNull(), // Array of day indices (0=Sun, 1=Mon, etc.)
  icon: text("icon"), // Lucide icon name
  points: integer("points").default(1).notNull(),
});

export const routines = pgTable("routines", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  timeInfo: text("time_info"),
  type: text("type").$type<z.infer<typeof cadenceSchema>>().notNull(),
  requiredDays: jsonb("required_days").$type<number[]>().notNull(),
  icon: text("icon"),
  points: integer("points").default(1).notNull(),
  completionMode: text("completion_mode").$type<"all_or_nothing">().notNull().default("all_or_nothing"),
});

export const completions = pgTable("completions", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id"),
  routineId: integer("routine_id"),
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

export const routineAssignments = pgTable(
  "routine_assignments",
  {
    id: serial("id").primaryKey(),
    routineId: integer("routine_id").notNull(),
    kidId: integer("kid_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("routine_assignments_routine_kid_unique").on(table.routineId, table.kidId),
  ],
);

export const insertTaskSchema = createInsertSchema(tasks);
export const insertRoutineSchema = createInsertSchema(routines);
export const insertCompletionSchema = createInsertSchema(completions);
export const insertKidSchema = createInsertSchema(kids);
export const insertTaskAssignmentSchema = createInsertSchema(taskAssignments);
export const insertRoutineAssignmentSchema = createInsertSchema(routineAssignments);
export const updateBoardItemSchema = z.object({
  title: z.string().trim().min(1).max(120),
  timeInfo: z.string().trim().max(120).nullable(),
  type: cadenceSchema,
  requiredDays: z.array(z.number().int().min(0).max(6)).min(1),
  points: z.number().int().min(1).max(20),
  icon: z.string().trim().min(1).max(64).nullable(),
});
export const updateTaskSchema = updateBoardItemSchema;
export const createKidSchema = z.object({
  name: z.string().trim().min(1).max(60),
});
export const updateKidSchema = z.object({
  name: z.string().trim().min(1).max(60),
  active: z.boolean().optional(),
});
export const replaceBoardItemAssignmentsSchema = z.object({
  kidIds: z.array(z.number().int().positive()).min(1),
});
export const replaceTaskAssignmentsSchema = replaceBoardItemAssignmentsSchema;
export const boardItemWithAssignmentsSchema = z.object({
  id: z.number(),
  itemKind: boardItemKindSchema,
  title: z.string(),
  timeInfo: z.string().nullable(),
  type: cadenceSchema,
  requiredDays: z.array(z.number().int().min(0).max(6)),
  icon: z.string().nullable(),
  points: z.number().int(),
  kidIds: z.array(z.number().int().positive()),
});
export const taskWithAssignmentsSchema = boardItemWithAssignmentsSchema;

export type Task = typeof tasks.$inferSelect;
export type Routine = typeof routines.$inferSelect;
export type Completion = typeof completions.$inferSelect;
export type Kid = typeof kids.$inferSelect;
export type TaskAssignment = typeof taskAssignments.$inferSelect;
export type RoutineAssignment = typeof routineAssignments.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertRoutine = z.infer<typeof insertRoutineSchema>;
export type InsertCompletion = z.infer<typeof insertCompletionSchema>;
export type InsertKid = z.infer<typeof insertKidSchema>;
export type InsertTaskAssignment = z.infer<typeof insertTaskAssignmentSchema>;
export type InsertRoutineAssignment = z.infer<typeof insertRoutineAssignmentSchema>;
export type UpdateBoardItemRequest = z.infer<typeof updateBoardItemSchema>;
export type UpdateTaskRequest = UpdateBoardItemRequest;
export type CreateKidRequest = z.infer<typeof createKidSchema>;
export type UpdateKidRequest = z.infer<typeof updateKidSchema>;
export type ReplaceBoardItemAssignmentsRequest = z.infer<typeof replaceBoardItemAssignmentsSchema>;
export type ReplaceTaskAssignmentsRequest = ReplaceBoardItemAssignmentsRequest;
export type BoardItemWithAssignments = z.infer<typeof boardItemWithAssignmentsSchema>;
export type TaskWithAssignments = BoardItemWithAssignments;
export type BoardItemKind = z.infer<typeof boardItemKindSchema>;
export type BoardCadence = z.infer<typeof cadenceSchema>;

// Request types
export type ToggleBoardItemRequest = {
  itemKind: BoardItemKind;
  itemId: number;
  date: string;
  completed: boolean;
};
export type ToggleTaskRequest = ToggleBoardItemRequest;
