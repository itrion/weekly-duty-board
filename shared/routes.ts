
import { z } from 'zod';
import { tasks, completions, updateTaskSchema } from './schema';

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
      responses: {
        200: z.array(z.custom<typeof tasks.$inferSelect>()),
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
