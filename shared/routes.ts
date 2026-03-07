
import { z } from 'zod';
import {
  tasks,
  completions,
  kids,
  updateTaskSchema,
  createKidSchema,
  updateKidSchema,
  replaceTaskAssignmentsSchema,
  taskWithAssignmentsSchema,
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  tasks: {
    list: {
      method: 'GET' as const,
      path: '/api/tasks' as const,
      input: z.object({
        kidId: z.coerce.number().int().positive().optional(),
      }),
      responses: {
        200: z.array(taskWithAssignmentsSchema),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/tasks/:id' as const,
      input: updateTaskSchema,
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
      },
    },
    replaceAssignments: {
      method: 'PUT' as const,
      path: '/api/tasks/:id/assignments' as const,
      input: replaceTaskAssignmentsSchema,
      responses: {
        200: z.object({
          taskId: z.number(),
          kidIds: z.array(z.number()),
        }),
      },
    },
  },
  kids: {
    list: {
      method: 'GET' as const,
      path: '/api/kids' as const,
      responses: {
        200: z.array(z.custom<typeof kids.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/kids' as const,
      input: createKidSchema,
      responses: {
        201: z.custom<typeof kids.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/kids/:id' as const,
      input: updateKidSchema,
      responses: {
        200: z.custom<typeof kids.$inferSelect>(),
      },
    },
    remove: {
      method: 'DELETE' as const,
      path: '/api/kids/:id' as const,
      responses: {
        204: z.object({}),
      },
    },
  },
  completions: {
    list: {
      method: 'GET' as const,
      path: '/api/completions' as const,
      input: z.object({
        startDate: z.string(),
        endDate: z.string(),
      }),
      responses: {
        200: z.array(z.custom<typeof completions.$inferSelect>()),
      },
    },
    toggle: {
      method: 'POST' as const,
      path: '/api/completions' as const,
      input: z.object({
        taskId: z.number(),
        date: z.string(),
        completed: z.boolean(),
      }),
      responses: {
        200: z.custom<typeof completions.$inferSelect>(),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
