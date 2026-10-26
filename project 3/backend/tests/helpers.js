import dotenv from 'dotenv';
import { createServer } from 'node:http';
import { once } from 'node:events';
dotenv.config({ path: '.env.test', override: true, quiet: true });
if (new URL(process.env.DATABASE_URL).pathname !== '/project_3_test_db' || !process.env.REDIS_CHANNEL_PREFIX.endsWith(':test')) throw new Error('Tests require the isolated project_3_test_db and test Redis namespace.');
export const { prisma } = await import('../src/config/database.js');
const { createApp } = await import('../src/app.js');
const { attachRealtime } = await import('../src/realtime/socket.js');
export async function start() { const app = createApp(); const http = createServer(app); http.listen(0, '127.0.0.1'); await once(http, 'listening'); process.env.ALLOWED_ORIGINS += `,http://127.0.0.1:${http.address().port}`; const realtime = await attachRealtime(http); Object.assign(app.locals, realtime); return { app, http, realtime, url: `http://127.0.0.1:${http.address().port}`, close: realtime.close }; }
export async function clear() { await prisma.outbox.deleteMany(); await prisma.notification.deleteMany(); await prisma.readReceipt.deleteMany(); await prisma.message.deleteMany(); await prisma.membership.deleteMany(); await prisma.room.deleteMany(); await prisma.user.deleteMany(); }
