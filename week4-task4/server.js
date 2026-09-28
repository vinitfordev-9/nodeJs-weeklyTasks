const { createServer } = require("http");
const app = require("./app");
const logger = require("./config/logger");
const productCache = require("./services/productCache");
const emailQueue = require("./queues/emailQueue");
const prisma = require("./config/prisma");
const { attachRealtime } = require("./realtime/orderEvents");
const server = createServer(app);
const realtime = attachRealtime(server);
app.set("realtime", realtime);
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => logger.info({ port: Number(PORT) }, "Server started"));
let stopping = false;
async function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  logger.info({ signal }, "Shutting down");
  const deadline = setTimeout(() => process.exit(1), 10000);
  deadline.unref();
  try {
    await realtime.close();
    await Promise.all([productCache.close(), emailQueue.close(), prisma.$disconnect()]);
    clearTimeout(deadline);
  } catch (error) {
    logger.error({ err: error }, "Shutdown failed");
    process.exitCode = 1;
  }
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
