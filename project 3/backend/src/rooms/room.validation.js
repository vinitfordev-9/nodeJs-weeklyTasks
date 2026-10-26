import { z } from "zod";
export const roomSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9][a-z0-9-]{1,49}$/,
      "Use 2–50 lowercase letters, numbers, or hyphens.",
    ),
  description: z.string().trim().min(5).max(250),
});
export const roomQuery = z.strictObject({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});
