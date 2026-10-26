import 'dotenv/config';
import { createServer } from 'node:http';
import { createApp } from './app.js';
import { prisma } from './config/database.js';
import { attachRealtime } from './realtime/socket.js';
const port = Number(process.env.PORT || 3003); const host = process.env.HOST || '127.0.0.1';
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.');
let realtime;
try {
  await prisma.$connect(); const app = createApp(); const server = createServer(app); realtime = await attachRealtime(server); Object.assign(app.locals, realtime);
  server.listen(port, host, () => console.log(`Commonroom: http://${host}:${port}`));
  server.on('error', error => { console.error(error.message); process.exit(1); });
  let stopping = false;
  const stop = async () => { if (stopping) return; stopping = true; const timer = setTimeout(() => process.exit(1), 10000).unref(); await realtime.close(); await prisma.$disconnect(); clearTimeout(timer); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
} catch (error) { console.error('Startup failed. Check PostgreSQL, Redis, and backend/.env.', error.message); if (realtime) await realtime.close(); await prisma.$disconnect(); process.exit(1); }
