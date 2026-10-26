import { prisma } from '../config/database.js';
import { publicUserSelect, tokenHash } from '../auth/auth.service.js';
import { AppError, RESPONSES } from '../common/responses.js';
export async function authenticate(req, res, next) {
  const match = /^Bearer ([a-f0-9]{64})$/i.exec(req.headers.authorization || '');
  if (!match) throw new AppError(RESPONSES.UNAUTHORIZED);
  const session = await prisma.session.findUnique({ where: { tokenHash: tokenHash(match[1]) }, include: { user: { select: publicUserSelect } } });
  if (!session || session.expiresAt <= new Date()) throw new AppError(RESPONSES.UNAUTHORIZED);
  req.user = session.user;
  req.sessionId = session.id;
  next();
}
export const allowRole = role => (req, res, next) => {
  if (req.user.role !== role) throw new AppError(RESPONSES.FORBIDDEN);
  next();
};
