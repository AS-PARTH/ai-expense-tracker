import { z } from 'zod';

export const categorySchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Category is required')
  .max(40, 'Category is too long')
  .regex(/^[a-z0-9 _-]+$/, 'Use letters, numbers, spaces, dashes, underscores only');

export const registerSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1).max(80).trim(),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

export const expenseInputSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  category: categorySchema,
  date: z.string().min(1),
  note: z.string().max(500).optional().or(z.literal('')),
});

export const expenseUpdateSchema = expenseInputSchema.partial();

export const budgetUpsertSchema = z.object({
  category: categorySchema,
  monthlyLimit: z.coerce.number().min(0),
});

export const aiExtractSchema = z.object({
  text: z.string().min(1).max(2000),
});

export const categoryCreateSchema = z.object({
  name: categorySchema,
});

export const budgetsBulkSchema = z.object({
  items: z
    .array(
      z.object({
        category: categorySchema,
        monthlyLimit: z.coerce.number().min(0),
      })
    )
    .min(1)
    .max(50),
});
