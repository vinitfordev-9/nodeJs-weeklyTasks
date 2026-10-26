import { prisma } from "../config/database.js";
import { AppError, RESPONSES } from "../common/responses.js";

const toPublic = (task) => ({
  ...task,
  status: task.status === "in_progress" ? "in-progress" : task.status,
});
function toDatabase(input) {
  const data = { ...input };
  if (data.status === "in-progress") data.status = "in_progress";
  if (typeof data.dueDate === "string") data.dueDate = new Date(data.dueDate);
  return data;
}

export async function createTask(input) {
  return toPublic(await prisma.task.create({ data: toDatabase(input) }));
}

export async function listTasks({
  status,
  priority,
  page,
  limit,
  sortBy,
  sortOrder,
}) {
  const where = {
    ...(status && {
      status: status === "in-progress" ? "in_progress" : status,
    }),
    ...(priority && { priority }),
  };
  const ordering =
    sortBy === "dueDate"
      ? { dueDate: { sort: sortOrder, nulls: "last" } }
      : { [sortBy]: sortOrder };
  const [total, tasks] = await prisma.$transaction(
    [
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [ordering, { id: "asc" }],
      }),
    ],
    { isolationLevel: "RepeatableRead" },
  );
  return {
    data: tasks.map(toPublic),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getTask(id) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new AppError(RESPONSES.NOT_FOUND);
  return toPublic(task);
}

export async function updateTask(id, input) {
  return toPublic(
    await prisma.task.update({ where: { id }, data: toDatabase(input) }),
  );
}

export async function deleteTask(id) {
  await prisma.task.delete({ where: { id } });
  return { id };
}
