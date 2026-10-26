import { z } from "zod";
import { AppError, RESPONSES } from "../common/responses.js";

const status = z.enum(["todo", "in-progress", "done"], {
  error: "Status must be todo, in-progress, or done.",
});
const priority = z.enum(["low", "medium", "high"], {
  error: "Priority must be low, medium, or high.",
});
const fields = {
  title: z
    .string({ error: "Title must be text." })
    .trim()
    .min(1, "Title is required.")
    .max(200, "Title must be 200 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(5000, "Description must be 5,000 characters or fewer.")
    .nullable()
    .optional(),
  dueDate: z.iso
    .datetime({
      offset: true,
      message:
        "Due date must be an ISO 8601 timestamp with a timezone, for example 2026-12-01T10:00:00Z.",
    })
    .nullable()
    .optional(),
  priority: priority.optional(),
  status: status.optional(),
};
export const createSchema = z.strictObject(fields);
export const updateSchema = createSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });
export const idSchema = z.object({
  id: z.uuid({ message: "Task ID must be a valid UUID." }),
});
const positiveInteger = (maximum) =>
  z
    .string()
    .regex(/^[1-9]\d*$/, "Use a positive whole number.")
    .transform(Number)
    .pipe(z.number().int().max(maximum));
export const querySchema = z.strictObject({
  status: status.optional(),
  priority: priority.optional(),
  page: positiveInteger(1000000).default(1),
  limit: positiveInteger(100).default(10),
  sortBy: z.enum(["createdAt", "dueDate", "priority"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export function validate(schema, source) {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      throw new AppError(
        RESPONSES.VALIDATION,
        result.error.issues.map((issue) => ({
          field: issue.path.join(".") || source,
          message: issue.message,
        })),
      );
    }
    req.validated = { ...req.validated, [source]: result.data };
    next();
  };
}

export function requireJson(req, res, next) {
  if (!req.is("application/json")) throw new AppError(RESPONSES.CONTENT_TYPE);
  next();
}
