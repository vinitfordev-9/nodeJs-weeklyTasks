import { z } from "zod";
export const applicationSchema = z.strictObject({
  coverLetter: z.string().trim().max(3000).optional(),
});
export const statusSchema = z.strictObject({
  status: z.enum(["submitted", "reviewing", "shortlisted", "rejected"]),
});
