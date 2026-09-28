process.env.JWT_SECRET = "realtime-test-secret";
process.env.LOG_LEVEL = "silent";
process.env.ALLOWED_ORIGINS = "http://localhost:3000";
const { createServer } = require("http");
const { io: client } = require("socket.io-client");
const jwt = require("jsonwebtoken");
const { attachRealtime } = require("../realtime/orderEvents");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function once(socket, event) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out: ${event}`)), 3000);
    socket.once(event, (value) => { clearTimeout(timeout); resolve(value); });
  });
}
function token(id, expiresIn = 60) {
  return jwt.sign({ email: `${id}@example.com`, role: "USER" }, process.env.JWT_SECRET, { subject: String(id), expiresIn });
}
let realtime, url, clients;
beforeEach(async () => {
  const server = createServer();
  realtime = attachRealtime(server);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  url = `http://127.0.0.1:${server.address().port}`;
  clients = [];
});
afterEach(async () => {
  clients.forEach((socket) => { socket.removeAllListeners(); socket.disconnect(); });
  await realtime.close();
});
function open(authToken, options = {}) {
  const socket = client(url, { auth: { token: authToken }, reconnection: false, forceNew: true, ...options });
  clients.push(socket);
  return socket;
}
test("delivers only to the owner's tabs and removes rooms on disconnect", async () => {
  const a = open(token(1)), b = open(token(2)), tab = open(token(1));
  await Promise.all([once(a, "session:ready"), once(b, "session:ready"), once(tab, "session:ready")]);
  const other = jest.fn(); b.on("order:changed", other);
  // Client-supplied join requests cannot subscribe to another account.
  b.emit("join", "user:1");
  const received = Promise.all([once(a, "order:changed"), once(tab, "order:changed")]);
  realtime.publishOrder("created", { id: 9, userId: 1, status: "PENDING", totalAmount: 42, user: { password: "secret" } });
  const events = await received;
  expect(events[0]).toEqual(expect.objectContaining({ action: "created", orderId: 9 }));
  expect(events[0].user).toBeUndefined();
  await wait(100); expect(other).not.toHaveBeenCalled();
  a.disconnect(); tab.disconnect();
  await wait(50);
  expect(realtime.io.of("/").adapter.rooms.has("user:1")).toBe(false);
});
test.each([undefined, "invalid", token(1, -1)])("rejects missing, invalid or expired credentials (%s)", async (value) => {
  expect((await once(open(value), "connect_error")).message).toMatch(/invalid or expired/);
  expect(realtime.io.of("/").sockets.size).toBe(0);
});
test("rejects unlisted origins for WebSocket transport", async () => {
  const socket = open(token(1), { transports: ["websocket"], extraHeaders: { Origin: "http://evil.example" } });
  await once(socket, "connect_error");
  expect(realtime.io.of("/").sockets.size).toBe(0);
});
test("expires an active connection and cleans up its room", async () => {
  const socket = open(token(1, 2));
  await once(socket, "session:ready");
  expect(await once(socket, "disconnect")).toBe("io server disconnect");
  expect(realtime.io.of("/").adapter.rooms.has("user:1")).toBe(false);
});
test("reconnect receives one event without duplicate listeners", async () => {
  const socket = open(token(1), { reconnection: true, reconnectionDelay: 20 });
  await once(socket, "session:ready");
  const handler = jest.fn(); socket.on("order:changed", handler);
  const ready = once(socket, "session:ready");
  socket.io.engine.close();
  await ready;
  realtime.publishOrder("updated", { id: 9, userId: 1, status: "SHIPPED" });
  await wait(100);
  expect(handler).toHaveBeenCalledTimes(1);
});
test("server shutdown disconnects active clients", async () => {
  const socket = open(token(1)); await once(socket, "session:ready");
  const disconnected = once(socket, "disconnect");
  await realtime.close(); await disconnected;
  expect(realtime.io.of("/").sockets.size).toBe(0);
});
