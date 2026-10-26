import { prisma } from '../config/database.js';
import { requireMember, lockRoom, person } from '../rooms/room.service.js';
import { AppError, RESPONSES, jsonSafe } from '../common/responses.js';
const include = { author: { select: person }, receipts: { select: { user: { select: person }, readAt: true } } };
export async function history(roomId, userId, { before, after, limit }) {
  await requireMember(roomId, userId);
  const rows = await prisma.message.findMany({ where: { roomId, ...(before && { sequence: { lt: BigInt(before) } }), ...(after && { sequence: { gt: BigInt(after) } }) }, include, orderBy: { sequence: after ? 'asc' : 'desc' }, take: limit + 1 });
  const hasMore = rows.length > limit; const selected = rows.slice(0, limit); const data = after ? selected : selected.reverse();
  return { data, meta: { hasMore, nextCursor: selected.length ? (after ? data.at(-1).sequence : data[0].sequence).toString() : null, direction: after ? 'after' : 'before' } };
}
export async function send(roomId, userId, input) {
  return prisma.$transaction(async tx => {
    await lockRoom(tx, roomId); await requireMember(roomId, userId, tx);
    const existing = await tx.message.findUnique({ where: { roomId_authorId_clientMessageId: { roomId, authorId: userId, clientMessageId: input.clientMessageId } }, include });
    if (existing) { if (existing.content !== input.content) throw new AppError(RESPONSES.CONFLICT); return existing; }
    const message = await tx.message.create({ data: { ...input, roomId, authorId: userId }, include });
    await tx.outbox.create({ data: { target: `room:${roomId}`, event: 'message:new', payload: jsonSafe(message) } });
    const handles = [...new Set([...input.content.matchAll(/(?:^|\s)@([a-z][a-z0-9_]{2,29})\b/gi)].map(match => match[1].toLowerCase()))];
    if (handles.length) {
      const mentioned = await tx.user.findMany({ where: { handle: { in: handles }, id: { not: userId }, memberships: { some: { roomId, active: true } } }, select: { id: true } });
      for (const target of mentioned) {
        const notification = await tx.notification.create({ data: { userId: target.id, messageId: message.id } });
        await tx.outbox.create({ data: { target: `user:${target.id}`, event: 'notification:new', payload: jsonSafe({ ...notification, roomId, content: input.content, author: message.author }) } });
      }
    }
    return message;
  });
}
export async function markRead(roomId, userId, { messageIds }) {
  return prisma.$transaction(async tx => {
    await lockRoom(tx, roomId); await requireMember(roomId, userId, tx);
    const messages = await tx.message.findMany({ where: { id: { in: messageIds }, roomId }, select: { id: true } });
    if (messages.length !== messageIds.length) throw new AppError(RESPONSES.NOT_FOUND);
    await tx.readReceipt.createMany({ data: messageIds.map(messageId => ({ messageId, userId })), skipDuplicates: true });
    const receipts = await tx.readReceipt.findMany({ where: { messageId: { in: messageIds }, userId }, include: { user: { select: person } } });
    await tx.outbox.create({ data: { target: `room:${roomId}`, event: 'message:read', payload: jsonSafe({ roomId, receipts }) } });
    return receipts;
  });
}
