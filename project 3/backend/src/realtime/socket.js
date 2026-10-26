import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { prisma } from "../config/database.js";
import { sessionFor } from "../middleware/auth.js";
import { requireMember, lockRoom } from "../rooms/room.service.js";
import * as messages from "../messages/message.service.js";
import {
  roomEventSchema,
  sendEventSchema,
  readEventSchema,
  typingSchema,
} from "../messages/message.validation.js";
import {
  AppError,
  RESPONSES,
  envelope,
  errorResponse,
} from "../common/responses.js";
import { startOutbox } from "./outbox.js";
export async function attachRealtime(server) {
  const pub = createClient({
    url: process.env.REDIS_URL,
    socket: { connectTimeout: 5000 },
    disableOfflineQueue: true,
  });
  const sub = pub.duplicate();
  for (const client of [pub, sub])
    client.on("error", (error) =>
      console.error("Redis connection:", error.message),
    );
  try {
    await Promise.all([pub.connect(), sub.connect()]);
  } catch (error) {
    for (const client of [pub, sub]) if (client.isOpen) client.destroy();
    throw error;
  }
  const origins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .filter(Boolean);
  const io = new Server(server, {
    maxHttpBufferSize: 20000,
    transports: ["websocket"],
    cors: { origin: origins },
    allowRequest: (req, callback) =>
      callback(
        null,
        !req.headers.origin || origins.includes(req.headers.origin),
      ),
  });
  io.adapter(
    createAdapter(pub, sub, {
      key: process.env.REDIS_CHANNEL_PREFIX || "project3",
      requestsTimeout: 3000,
    }),
  );
  let closing = false;
  const ready = () => !closing && pub.isReady && sub.isReady;
  async function presence(roomId) {
    if (!ready()) return;
    const sockets = await io.in(`room:${roomId}`).fetchSockets();
    const users = [
      ...new Map(
        sockets.map((socket) => [socket.data.user.id, socket.data.user]),
      ).values(),
    ];
    io.to(`room:${roomId}`).emit("room:presence", { roomId, users });
    return { roomId, users };
  }
  io.use(async (socket, next) => {
    try {
      const session = await sessionFor(
        socket.handshake.auth?.token ||
          /^Bearer (.+)$/i.exec(
            socket.handshake.headers.authorization || "",
          )?.[1],
      );
      socket.data.user = {
        id: session.user.id,
        name: session.user.name,
        handle: session.user.handle,
      };
      socket.data.sessionId = session.id;
      socket.data.expiresAt = session.expiresAt.getTime();
      next();
    } catch (error) {
      const { response, errors } = errorResponse(error);
      const failure = new Error(response.message);
      failure.data = envelope(response, { errors });
      next(failure);
    }
  });
  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.user.id}`);
    socket.join(`session:${socket.data.sessionId}`);
    const expiry = setTimeout(
      () => socket.disconnect(true),
      Math.max(1, socket.data.expiresAt - Date.now()),
    );
    expiry.unref();
    let count = 0,
      windowStart = Date.now();
    function on(event, schema, handler, response) {
      socket.on(event, async (input, ack) => {
        const reply = typeof ack === "function" ? ack : () => {};
        try {
          if (Date.now() - windowStart > 10000) {
            windowStart = Date.now();
            count = 0;
          }
          if (++count > 100) throw new AppError(RESPONSES.RATE);
          if (!ready()) throw new AppError(RESPONSES.UNAVAILABLE);
          const session = await prisma.session.findUnique({
            where: { id: socket.data.sessionId },
          });
          if (!session || session.expiresAt <= new Date())
            throw new AppError(RESPONSES.UNAUTHORIZED);
          const parsed = schema.safeParse(input);
          if (!parsed.success)
            throw new AppError(
              RESPONSES.VALIDATION,
              parsed.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
              })),
            );
          const data = await handler(parsed.data);
          reply(envelope(response, { data }));
        } catch (error) {
          const { response, errors } = errorResponse(error);
          reply(envelope(response, { errors }));
          if (response === RESPONSES.UNAUTHORIZED) socket.disconnect(true);
        }
      });
    }
    on(
      "room:watch",
      roomEventSchema,
      async ({ roomId }) => {
        const previous = [...socket.rooms].filter((room) =>
          room.startsWith("room:"),
        );
        await prisma.$transaction(async (tx) => {
          await lockRoom(tx, roomId);
          await requireMember(roomId, socket.data.user.id, tx);
          for (const room of previous) await socket.leave(room);
          await socket.join(`room:${roomId}`);
        });
        for (const room of previous)
          if (room !== `room:${roomId}`) await presence(room.slice(5));
        return presence(roomId);
      },
      RESPONSES.PRESENCE,
    );
    on(
      "message:send",
      sendEventSchema,
      ({ roomId, ...input }) =>
        messages.send(roomId, socket.data.user.id, input),
      RESPONSES.SENT,
    );
    on(
      "message:read",
      readEventSchema,
      ({ roomId, ...input }) =>
        messages.markRead(roomId, socket.data.user.id, input),
      RESPONSES.READ,
    );
    on(
      "typing:set",
      typingSchema,
      async ({ roomId, typing }) => {
        await requireMember(roomId, socket.data.user.id);
        if (!socket.rooms.has(`room:${roomId}`))
          throw new AppError(RESPONSES.FORBIDDEN);
        socket
          .to(`room:${roomId}`)
          .emit("typing:update", {
            roomId,
            user: socket.data.user,
            typing,
            expiresAt: Date.now() + 5000,
          });
        return { roomId, typing };
      },
      RESPONSES.TYPING,
    );
    socket.on("disconnecting", () => {
      if (!ready()) return;
      const rooms = [...socket.rooms].filter((room) =>
        room.startsWith("room:"),
      );
      for (const room of rooms)
        socket
          .to(room)
          .emit("typing:update", {
            roomId: room.slice(5),
            user: socket.data.user,
            typing: false,
            expiresAt: Date.now(),
          });
      setTimeout(() => {
        for (const room of rooms)
          presence(room.slice(5)).catch((error) =>
            console.error(error.message),
          );
      }, 30).unref();
    });
    socket.on("disconnect", () => clearTimeout(expiry));
  });
  const stopOutbox = startOutbox(io, ready);
  return {
    io,
    ready,
    presence,
    close: async () => {
      closing = true;
      await stopOutbox();
      await new Promise((resolve) => io.close(resolve));
      for (const client of [pub, sub]) if (client.isOpen) await client.quit();
    },
  };
}
