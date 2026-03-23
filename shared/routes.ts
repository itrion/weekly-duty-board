
import { z } from 'zod';
import {
  tasks,
  routines,
  completions,
  kids,
  boardItemKindSchema,
  createBoardItemSchema,
  updateBoardItemSchema,
  createKidSchema,
  updateKidSchema,
  replaceBoardItemAssignmentsSchema,
  boardItemWithAssignmentsSchema,
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
  board: {
    create: {
      method: 'POST' as const,
      path: '/api/board-items' as const,
      input: createBoardItemSchema,
      responses: {
        201: z.union([
          z.custom<typeof tasks.$inferSelect>(),
          z.custom<typeof routines.$inferSelect>(),
        ]),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/board-items' as const,
      input: z.object({
        kidId: z.coerce.number().int().positive().optional(),
      }),
      responses: {
        200: z.array(boardItemWithAssignmentsSchema),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/board-items/:kind/:id' as const,
      input: updateBoardItemSchema,
      responses: {
        200: z.union([
          z.custom<typeof tasks.$inferSelect>(),
          z.custom<typeof routines.$inferSelect>(),
        ]),
      },
    },
    remove: {
      method: 'DELETE' as const,
      path: '/api/board-items/:kind/:id' as const,
      responses: {
        204: z.object({}),
      },
    },
    replaceAssignments: {
      method: 'PUT' as const,
      path: '/api/board-items/:kind/:id/assignments' as const,
      input: replaceBoardItemAssignmentsSchema,
      responses: {
        200: z.object({
          itemKind: boardItemKindSchema,
          itemId: z.number(),
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
        itemKind: boardItemKindSchema,
        itemId: z.number(),
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
