const app = require("./app");
const logger = require("./config/logger");
const productCache = require("./services/productCache");
const emailQueue = require("./queues/emailQueue");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info({ port: Number(PORT) }, "Server started");
});

async function shutdown(signal) {
  logger.info({ signal }, "Shutting down");
  server.close(async () => {
    await Promise.all([productCache.close(), emailQueue.close()]);
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
