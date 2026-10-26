import { z } from 'zod';
import { pageFields } from '../common/validation.js';
const type = z.enum(['full_time', 'part_time', 'contract', 'internship']);
const workMode = z.enum(['onsite', 'hybrid', 'remote']);
const salary = z.number().int().min(0).max(1000000000).nullable().optional();
const tags = z.array(z.string().trim().min(1).max(30).transform(value => value.toLowerCase())).max(8).transform(value => [...new Set(value)]);
const fields = {
  title: z.string().trim().min(3).max(150), location: z.string().trim().min(2).max(150),
  description: z.string().trim().min(30).max(15000), requirements: z.string().trim().min(10).max(10000),
  tags: tags.optional(), type: type.optional(), workMode: workMode.optional(),
  salaryMin: salary, salaryMax: salary, currency: z.enum(['INR', 'USD', 'EUR', 'GBP']).optional(),
  status: z.enum(['open', 'closed']).optional(),
};
const checkSalary = value => value.salaryMin == null || value.salaryMax == null || value.salaryMin <= value.salaryMax;
export const createJobSchema = z.strictObject(fields).refine(checkSalary, { path: ['salaryMax'], message: 'Maximum salary must be at least the minimum salary.' });
export const updateJobSchema = z.strictObject(fields).partial().refine(value => Object.keys(value).length > 0, 'Provide at least one field to update.').refine(checkSalary, { path: ['salaryMax'], message: 'Maximum salary must be at least the minimum salary.' });
export const jobQuerySchema = z.strictObject({
  ...pageFields,
  q: z.string().trim().max(100).optional(), location: z.string().trim().max(100).optional(),
  tags: z.string().max(250).transform(value => [...new Set(value.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean))]).pipe(z.array(z.string().max(30)).max(8)).optional(),
  type: type.optional(), workMode: workMode.optional(),
  sortBy: z.enum(['newest', 'oldest', 'salary']).default('newest'),
});
