import { z } from 'zod';

const paymentStatusSchema = z.enum(['PAID', 'PENDING']);

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
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    paymentStatus: paymentStatusSchema.default('PENDING'),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    fullName: z.string().min(1).optional(),
    username: z.string().min(1).optional(),
    password: z.string().min(4).optional(),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable().or(z.literal('')),
    paymentStatus: paymentStatusSchema.optional(),
    isActive: z.boolean().optional(),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
