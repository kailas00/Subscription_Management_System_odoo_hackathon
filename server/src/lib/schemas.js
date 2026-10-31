import { z } from 'zod';

// Shared zod building blocks — use these in every module so validation is consistent.
export const id = z.coerce.number().int().positive();
export const idParam = z.object({ id });
export const money = z.coerce.number().min(0).max(99999999);
export const optDate = z.coerce.date().optional().nullable();
export const listQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
}).passthrough();

// Spec: "more than eight characters, with an uppercase letter, a lowercase letter and a special character"
export const password = z.string()
  .min(9, 'Password must be more than 8 characters')
  .max(128, 'Password must be 128 characters or fewer')
  .regex(/[A-Z]/, 'Password needs an uppercase letter')
  .regex(/[a-z]/, 'Password needs a lowercase letter')
  .regex(/[^A-Za-z0-9]/, 'Password needs a special character');

export const email = z.string().trim().toLowerCase().email('Enter a valid email');
