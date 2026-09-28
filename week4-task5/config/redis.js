const { createClient } = require("redis");
const logger = require("./logger");

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  disableOfflineQueue: true,
  socket: {
    connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS) || 1000,
    reconnectStrategy: false,
  },
});

redisClient.on("error", (err) => {
  logger.warn({ err }, "Redis client error; requests will use the database");
});

module.exports = redisClient;
