import { z } from "zod";
import { AppError, RESPONSES } from "./responses.js";
export const idSchema = z.object({
  id: z.uuid({ message: "ID must be a valid UUID." }),
});
export const pageFields = {
  page: z
    .string()
    .regex(/^[1-9]\d*$/, "Page must be a positive whole number.")
    .transform(Number)
    .pipe(z.number().int().max(100000))
    .default(1),
  limit: z
    .string()
    .regex(/^[1-9]\d*$/, "Limit must be a positive whole number.")
    .transform(Number)
    .pipe(z.number().int().max(50))
    .default(9),
};
export const pageSchema = z.strictObject(pageFields);
export function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success)
      throw new AppError(
        RESPONSES.VALIDATION,
        result.error.issues.map((issue) => ({
          field: issue.path.join(".") || source,
          message: issue.message,
        })),
      );
    req.validated = { ...req.validated, [source]: result.data };
    next();
  };
}
export function requireJson(req, res, next) {
  if (!req.is("application/json")) throw new AppError(RESPONSES.CONTENT);
  next();
}
