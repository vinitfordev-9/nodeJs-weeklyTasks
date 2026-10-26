import { prisma } from "../config/database.js";
import { AppError, RESPONSES } from "../common/responses.js";
export const person = { id: true, name: true, handle: true };
export async function lockRoom(tx, roomId) {
  const rows =
    await tx.$queryRaw`SELECT id FROM rooms WHERE id = ${roomId}::uuid FOR UPDATE`;
  if (!rows.length) throw new AppError(RESPONSES.NOT_FOUND);
}
export async function requireMember(roomId, userId, tx = prisma) {
  const member = await tx.membership.findUnique({
    where: { userId_roomId: { userId, roomId } },
  });
  if (!member?.active) throw new AppError(RESPONSES.FORBIDDEN);
  return member;
}
export async function list(userId, { page, limit }) {
  const [total, rooms] = await prisma.$transaction(
    [
      prisma.room.count(),
      prisma.room.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ name: "asc" }, { id: "asc" }],
        include: {
          memberships: {
            where: { userId, active: true },
            select: { userId: true },
          },
          _count: {
            select: {
              memberships: { where: { active: true } },
              messages: true,
            },
          },
        },
      }),
    ],
    { isolationLevel: "RepeatableRead" },
  );
  return {
    data: rooms.map(({ memberships, ...room }) => ({
      ...room,
      joined: memberships.length > 0,
    })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
export async function create(userId, input) {
  return prisma.room.create({
    data: { ...input, memberships: { create: { userId } } },
  });
}
export async function join(roomId, userId) {
  return prisma.$transaction(async (tx) => {
    await lockRoom(tx, roomId);
    await tx.membership.upsert({
      where: { userId_roomId: { userId, roomId } },
      update: { active: true, joinedAt: new Date() },
      create: { userId, roomId },
    });
    return { roomId };
  });
}
export async function leave(roomId, userId, io) {
  return prisma.$transaction(async (tx) => {
    await lockRoom(tx, roomId);
    await requireMember(roomId, userId, tx);
    await tx.membership.update({
      where: { userId_roomId: { userId, roomId } },
      data: { active: false },
    });
    // All tabs lose live access before the membership mutation commits.
    io.in(`user:${userId}`).socketsLeave(`room:${roomId}`);
    io.to(`user:${userId}`).emit("room:left", { roomId });
    return { roomId };
  });
}
export async function members(roomId, userId) {
  await requireMember(roomId, userId);
  return prisma.membership.findMany({
    where: { roomId, active: true },
    select: { user: { select: person }, joinedAt: true },
    orderBy: { joinedAt: "asc" },
    take: 100,
  });
}
