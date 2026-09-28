const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config/auth");
const { corsOptions, getAllowedOrigins } = require("../config/security");
const logger = require("../config/logger");

function attachRealtime(server) {
  const io = new Server(server, {
    cors: corsOptions,
    maxHttpBufferSize: 10000,
    // CORS alone does not protect WebSocket handshakes.
    allowRequest(req, callback) {
      const origin = req.headers.origin;
      callback(null, !origin || getAllowedOrigins().includes(origin));
    },
  });
  io.use((socket, next) => {
    try {
      const claims = jwt.verify(socket.handshake.auth.token, getJwtSecret(), { algorithms: ["HS256"] });
      const userId = Number(claims.sub);
      if (!Number.isSafeInteger(userId) || userId <= 0 ||
          !["ADMIN", "USER"].includes(claims.role) || typeof claims.email !== "string" ||
          !Number.isFinite(claims.exp)) throw new Error("Invalid claims");
      socket.data.userId = userId;
      socket.data.expiresAt = claims.exp * 1000;
      next();
    } catch {
      next(new Error("Session invalid or expired. Please log in again."));
    }
  });
  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.userId}`);
    // Chunk long lifetimes to avoid Node's 32-bit timeout overflow.
    let expiryTimer;
    function checkExpiry() {
      const remaining = socket.data.expiresAt - Date.now();
      if (remaining <= 0) return socket.disconnect(true);
      expiryTimer = setTimeout(checkExpiry, Math.min(remaining, 2147483647));
      expiryTimer.unref();
    }
    checkExpiry();
    logger.info({ userId: socket.data.userId, socketId: socket.id }, "Realtime connected");
    socket.once("disconnect", (reason) => {
      clearTimeout(expiryTimer);
      logger.info({ socketId: socket.id, reason }, "Realtime disconnected");
    });
    socket.emit("session:ready", { userId: socket.data.userId });
  });
  return {
    io,
    publishOrder(action, order) {
      io.to(`user:${order.userId}`).emit("order:changed", {
        action, orderId: order.id, status: order.status,
        totalAmount: order.totalAmount, occurredAt: new Date().toISOString(),
      });
    },
    close() { return new Promise((resolve) => io.close(resolve)); },
  };
}
module.exports = { attachRealtime };
