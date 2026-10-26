import { prisma } from '../config/database.js';
// Durable broadcast attempts. Consumers deduplicate by message ID and reconcile via history.
export function startOutbox(io, ready) {
  let running = false; let stopped = false;
  const tick = async () => {
    if (running || stopped || !ready()) return;
    running = true;
    try {
      await prisma.$transaction(async tx => {
        const rows = await tx.$queryRaw`SELECT * FROM outbox WHERE "deliveredAt" IS NULL ORDER BY "createdAt", id LIMIT 50 FOR UPDATE SKIP LOCKED`;
        for (const row of rows) {
          if (!ready()) break;
          io.to(row.target).emit(row.event, row.payload);
          await tx.outbox.update({ where: { id: row.id }, data: { deliveredAt: new Date() } });
        }
      });
    } catch (error) { console.error('Outbox will retry:', error.message); } finally { running = false; }
  };
  const timer = setInterval(tick, 200); timer.unref();
  return async () => { stopped = true; clearInterval(timer); while (running) await new Promise(resolve => setTimeout(resolve, 20)); };
}
