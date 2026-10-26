import { prisma } from '../config/database.js';
import { AppError, RESPONSES, pagination } from '../common/responses.js';
export const companySelect = { id: true, companyName: true };
const includeCompany = { company: { select: companySelect } };
export async function ownedJob(id, companyId, client = prisma) {
  const job = await client.job.findUnique({ where: { id } });
  if (!job) throw new AppError(RESPONSES.NOT_FOUND);
  if (job.companyId !== companyId) throw new AppError(RESPONSES.FORBIDDEN);
  return job;
}
export async function createJob(companyId, input) {
  return prisma.job.create({ data: { ...input, tags: input.tags || [], companyId }, include: includeCompany });
}
export async function getJob(id) {
  const job = await prisma.job.findUnique({ where: { id }, include: includeCompany });
  if (!job) throw new AppError(RESPONSES.NOT_FOUND);
  return job;
}
export async function listJobs({ page, limit, q, location, tags, type, workMode, sortBy }) {
  const where = {
    status: 'open',
    ...(q && { title: { contains: q, mode: 'insensitive' } }),
    ...(location && { location: { contains: location, mode: 'insensitive' } }),
    ...(tags?.length && { tags: { hasEvery: tags } }), ...(type && { type }), ...(workMode && { workMode }),
  };
  const order = sortBy === 'salary' ? { salaryMax: { sort: 'desc', nulls: 'last' } } : { createdAt: sortBy === 'oldest' ? 'asc' : 'desc' };
  const [total, data] = await prisma.$transaction([
    prisma.job.count({ where }), prisma.job.findMany({ where, include: includeCompany, orderBy: [order, { id: 'asc' }], skip: (page - 1) * limit, take: limit }),
  ], { isolationLevel: 'RepeatableRead' });
  return { data, meta: pagination(page, limit, total) };
}
export async function companyJobs(companyId, { page, limit }) {
  const where = { companyId };
  const [total, data] = await prisma.$transaction([
    prisma.job.count({ where }), prisma.job.findMany({ where, include: { ...includeCompany, _count: { select: { applications: true } } }, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (page - 1) * limit, take: limit }),
  ], { isolationLevel: 'RepeatableRead' });
  return { data, meta: pagination(page, limit, total) };
}
export async function updateJob(id, companyId, input) {
  return prisma.$transaction(async tx => {
    // Lock the row so partial salary edits and applications cannot race a close/delete.
    await tx.$queryRaw`SELECT id FROM jobs WHERE id = ${id}::uuid FOR UPDATE`;
    const existing = await ownedJob(id, companyId, tx);
    const merged = { ...existing, ...input };
    if (merged.salaryMin != null && merged.salaryMax != null && merged.salaryMin > merged.salaryMax) throw new AppError(RESPONSES.VALIDATION, [{ field: 'salaryMax', message: 'Maximum salary must be at least the minimum salary.' }]);
    return tx.job.update({ where: { id }, data: input, include: includeCompany });
  });
}
export async function deleteJob(id, companyId) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM jobs WHERE id = ${id}::uuid FOR UPDATE`;
    await ownedJob(id, companyId, tx);
    await tx.job.delete({ where: { id } });
    return { id };
  });
}
