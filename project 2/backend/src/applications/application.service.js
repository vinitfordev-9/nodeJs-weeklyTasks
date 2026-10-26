import { prisma } from "../config/database.js";
import { ownedJob, companySelect } from "../jobs/job.service.js";
import { AppError, RESPONSES, pagination } from "../common/responses.js";
const applicationSelect = {
  id: true,
  jobId: true,
  candidateId: true,
  coverLetter: true,
  resumeName: true,
  resumeSize: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};
export async function apply(jobId, candidateId, input, file) {
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM jobs WHERE id = ${jobId}::uuid FOR UPDATE`;
      const job = await tx.job.findUnique({ where: { id: jobId } });
      if (!job) throw new AppError(RESPONSES.NOT_FOUND);
      if (job.status !== "open") throw new AppError(RESPONSES.CLOSED);
      return tx.application.create({
        data: {
          jobId,
          candidateId,
          ...input,
          resumeName: file.originalname
            .replace(/[^a-zA-Z0-9._ -]/g, "_")
            .slice(-200),
          resumeBytes: file.buffer,
          resumeSize: file.size,
        },
        select: applicationSelect,
      });
    });
  } catch (error) {
    if (error.code === "P2002") throw new AppError(RESPONSES.DUPLICATE);
    throw error;
  }
}
export async function applicants(jobId, companyId, { page, limit }) {
  await ownedJob(jobId, companyId);
  const where = { jobId };
  const [total, data] = await prisma.$transaction(
    [
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        select: {
          ...applicationSelect,
          candidate: { select: { id: true, name: true, email: true } },
        },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ],
    { isolationLevel: "RepeatableRead" },
  );
  return { data, meta: pagination(page, limit, total) };
}
export async function myApplications(candidateId, { page, limit }) {
  const where = { candidateId };
  const [total, data] = await prisma.$transaction(
    [
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        select: {
          ...applicationSelect,
          job: { include: { company: { select: companySelect } } },
        },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ],
    { isolationLevel: "RepeatableRead" },
  );
  return { data, meta: pagination(page, limit, total) };
}
export async function updateStatus(id, companyId, status) {
  const application = await prisma.application.findUnique({
    where: { id },
    select: { job: { select: { companyId: true } } },
  });
  if (!application) throw new AppError(RESPONSES.NOT_FOUND);
  if (application.job.companyId !== companyId)
    throw new AppError(RESPONSES.FORBIDDEN);
  return prisma.application.update({
    where: { id },
    data: { status },
    select: applicationSelect,
  });
}
export async function resume(id, user) {
  // Check access before loading the potentially large private PDF.
  const application = await prisma.application.findUnique({
    where: { id },
    select: { candidateId: true, job: { select: { companyId: true } } },
  });
  if (!application) throw new AppError(RESPONSES.NOT_FOUND);
  if (
    application.candidateId !== user.id &&
    application.job.companyId !== user.id
  )
    throw new AppError(RESPONSES.FORBIDDEN);
  return prisma.application.findUniqueOrThrow({
    where: { id },
    select: { resumeBytes: true, resumeName: true },
  });
}
