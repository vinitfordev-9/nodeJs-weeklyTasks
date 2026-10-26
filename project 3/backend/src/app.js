import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { fileURLToPath } from 'node:url';
import { prisma } from './config/database.js';
import { RESPONSES, sendResponse } from './common/responses.js';
import { errorHandler } from './middleware/errors.js';
import { authRouter } from './auth/auth.routes.js';
import { roomRouter } from './rooms/room.routes.js';
import { notificationRouter } from './notifications/notification.routes.js';
export function createApp() {
  const app = express(); app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: { directives: { upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null, connectSrc: ["'self'", 'ws://127.0.0.1:*', 'ws://localhost:*'] } }, strictTransportSecurity: process.env.NODE_ENV === 'production' ? undefined : false }));
  app.use(express.json({ limit: '32kb' }));
  app.get('/health', async (req, res) => { await prisma.$queryRaw`SELECT 1`; const ready = app.locals.ready?.(); return sendResponse(res, ready ? RESPONSES.HEALTHY : RESPONSES.UNAVAILABLE, { data: { database: 'connected', redis: ready ? 'connected' : 'disconnected' } }); });
  app.use('/api', rateLimit({ windowMs: 60000, limit: 240, skip: () => process.env.NODE_ENV === 'test', handler: (req, res) => sendResponse(res, RESPONSES.RATE) }), (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.use('/api/auth', authRouter); app.use('/api/rooms', roomRouter); app.use('/api/notifications', notificationRouter);
  app.use(express.static(fileURLToPath(new URL('../../frontend/dist', import.meta.url))));
  app.use((req, res) => sendResponse(res, RESPONSES.ROUTE)); app.use(errorHandler);
  return app;
}
