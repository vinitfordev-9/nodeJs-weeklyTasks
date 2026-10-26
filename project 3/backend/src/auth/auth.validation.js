import { z } from 'zod';
const email = z.email().max(254).transform(value => value.toLowerCase());
export const registerSchema = z.strictObject({ name: z.string().trim().min(2).max(80), handle: z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9_]{2,29}$/, 'Use 3–30 lowercase letters, numbers, or underscores, starting with a letter.'), email, password: z.string().min(8).max(128) });
export const loginSchema = z.strictObject({ email, password: z.string().min(1).max(128) });
