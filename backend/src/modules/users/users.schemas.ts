import { z } from 'zod';

export const listUsersSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
  }).optional(),
});

export const createUserSchema = z.object({
  body: z.object({
    fullName: z.string().min(1),
    username: z.string().min(1),
    password: z.string().min(4),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    fullName: z.string().min(1).optional(),
    username: z.string().min(1).optional(),
    password: z.string().min(4).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
