import { z } from "zod";
const email = z
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());
export const loginSchema = z.strictObject({
  email,
  password: z.string().min(1).max(128),
});
export const registerSchema = z
  .strictObject({
    name: z.string().trim().min(2).max(100),
    email,
    password: z
      .string()
      .min(8, "Use at least 8 characters for your password.")
      .max(128),
    role: z.enum(["candidate", "company"]),
    companyName: z.string().trim().min(2).max(100).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.role === "company" && !value.companyName)
      ctx.addIssue({
        code: "custom",
        path: ["companyName"],
        message: "Company name is required for company accounts.",
      });
    if (value.role === "candidate" && value.companyName)
      ctx.addIssue({
        code: "custom",
        path: ["companyName"],
        message: "Company name is only for company accounts.",
      });
  });
