import { prisma } from '../config/database.js';
import { AppError, RESPONSES } from '../common/responses.js';
import { person } from '../rooms/room.service.js';
export async function list(userId) { return prisma.notification.findMany({ where: { userId }, include: { message: { select: { id: true, roomId: true, content: true, author: { select: person }, room: { select: { name: true } } } } }, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], take: 50 }); }
export async function read(id, userId) { const result = await prisma.notification.updateMany({ where: { id, userId }, data: { read: true } }); if (!result.count) throw new AppError(RESPONSES.NOT_FOUND); return { id }; }
