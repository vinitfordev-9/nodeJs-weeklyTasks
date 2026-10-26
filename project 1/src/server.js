import 'dotenv/config';
import { app } from './app.js';
import { prisma } from './config/database.js';

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.');

try {
  await prisma.$connect();
  const server = app.listen(port, host, () => console.log(`Task Manager API: http://${host}:${port}`));
  server.on('error', async error => {
    console.error('Could not start the HTTP server:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  });
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    const timeout = setTimeout(() => process.exit(1), 10000).unref();
    server.close(async () => {
      await prisma.$disconnect();
      clearTimeout(timeout);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (error) {
  console.error('Could not connect to PostgreSQL. Check DATABASE_URL and that PostgreSQL is running.', error.message);
  await prisma.$disconnect();
  process.exit(1);
}
