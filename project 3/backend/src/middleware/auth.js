import { prisma } from '../config/database.js';
import { tokenHash, publicUserSelect } from '../auth/auth.service.js';
import { AppError, RESPONSES } from '../common/responses.js';
export async function sessionFor(token) {
  if (!/^[a-f0-9]{64}$/i.test(token || '')) throw new AppError(RESPONSES.UNAUTHORIZED);
  const session = await prisma.session.findUnique({ where: { tokenHash: tokenHash(token) }, include: { user: { select: publicUserSelect } } });
  if (!session || session.expiresAt <= new Date()) throw new AppError(RESPONSES.UNAUTHORIZED);
  return session;
}
export async function authenticate(req, res, next) { const session = await sessionFor(/^Bearer (.+)$/i.exec(req.headers.authorization || '')?.[1]); req.user = session.user; req.sessionId = session.id; next(); }
