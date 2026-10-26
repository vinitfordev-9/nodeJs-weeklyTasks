import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { io } from 'socket.io-client';
import { start, clear, prisma } from './helpers.js';
let first, second, api, api2, a, b, outsider, sa, sb, roomId, messageId, sequence;
const clients = [];
const auth = data => ({ Authorization: `Bearer ${data.token}` });
const ack = (socket, event, payload) => new Promise((resolve, reject) => socket.timeout(5000).emit(event, payload, (error, data) => error ? reject(error) : resolve(data)));
const event = (socket, name, filter = () => true) => new Promise((resolve, reject) => { const timer = setTimeout(() => { socket.off(name, handler); reject(new Error(`Timed out: ${name}`)); }, 7000); const handler = data => { if (filter(data)) { clearTimeout(timer); socket.off(name, handler); resolve(data); } }; socket.on(name, handler); });
async function connect(url, token) { const client = io(url, { transports: ['websocket'], auth: { token }, reconnection: false }); clients.push(client); await new Promise((resolve, reject) => { client.once('connect', resolve); client.once('connect_error', reject); }); return client; }
function check(result, status, code) { assert.equal(result.status, status, JSON.stringify(result.body)); assert.equal(result.body.code, code); assert.equal(result.body.success, status < 400); assert.deepEqual(Object.keys(result.body).sort(), ['code','data','errors','message','meta','success']); }
before(async () => { await clear(); first = await start(); second = await start(); api = request(first.app); api2 = request(second.app); });
after(async () => { clients.forEach(client => client.disconnect()); await first?.close(); await second?.close(); await clear(); await prisma.$disconnect(); });
test('registers users and creates authenticated sockets; rejects bad credentials', async () => {
  const register = async handle => { const result = await api.post('/api/auth/register').send({ name: `${handle} Person`, handle, email: `${handle}@test.dev`, password: 'TestingPass123!' }); check(result, 201, 'ACCOUNT_CREATED'); assert.equal('passwordHash' in result.body.data.user, false); return result.body.data; };
  a = await register('alice'); b = await register('bruno'); outsider = await register('outsider');
  check(await api.post('/api/auth/login').send({ email: 'alice@test.dev', password: 'wrong' }), 401, 'INVALID_CREDENTIALS');
  sa = await connect(first.url, a.token); sb = await connect(second.url, b.token);
  const bad = io(first.url, { transports: ['websocket'], auth: { token: 'bad' }, reconnection: false }); clients.push(bad);
  const failure = await new Promise(resolve => bad.once('connect_error', resolve)); assert.equal(failure.data.code, 'AUTHENTICATION_REQUIRED');
});
test('membership protects rooms, live watches, and message history', async () => {
  check(await api.get('/api/rooms'), 401, 'AUTHENTICATION_REQUIRED');
  const result = await api.post('/api/rooms').set(auth(a)).send({ name: 'integration-room', description: 'The test room for conversations.' }); check(result, 201, 'ROOM_CREATED'); roomId = result.body.data.id;
  check(await api.get(`/api/rooms/${roomId}/messages`).set(auth(b)), 403, 'ROOM_ACCESS_DENIED');
  assert.equal((await ack(sb, 'room:watch', { roomId })).code, 'ROOM_ACCESS_DENIED');
  check(await api.post(`/api/rooms/${roomId}/join`).set(auth(b)), 200, 'ROOM_JOINED');
  assert.equal((await ack(sa, 'room:watch', { roomId })).success, true);
  const watched = await ack(sb, 'room:watch', { roomId }); assert.equal(watched.data.users.length, 2); assert.equal('email' in watched.data.users[0], false);
});
test('persists before acknowledgement, broadcasts across Redis nodes, and deduplicates retries', async () => {
  const incoming = event(sb, 'message:new'); const input = { roomId, content: 'Hello @bruno, this persists before broadcast.', clientMessageId: randomUUID() };
  const [one, two] = await Promise.all([ack(sa, 'message:send', input), api2.post(`/api/rooms/${roomId}/messages`).set(auth(a)).send({ content: input.content, clientMessageId: input.clientMessageId })]);
  assert.equal(one.success, true); check(two, 201, 'MESSAGE_SAVED'); assert.equal(one.data.id, two.body.data.id); messageId = one.data.id; sequence = one.data.sequence;
  assert.ok(await prisma.message.findUnique({ where: { id: messageId } })); assert.equal(await prisma.message.count(), 1);
  assert.equal((await incoming).id, messageId);
  assert.equal((await ack(sa, 'message:send', { ...input, content: 'Different content' })).code, 'RESOURCE_CONFLICT');
  assert.equal((await api.get('/api/notifications').set(auth(b))).body.data.length, 1);
});
test('typing, durable receipts, private mentions, and room mismatch rejection', async () => {
  const typing = event(sb, 'typing:update'); assert.equal((await ack(sa, 'typing:set', { roomId, typing: true })).success, true); assert.equal((await typing).user.id, a.user.id);
  const read = event(sa, 'message:read'); const result = await ack(sb, 'message:read', { roomId, messageIds: [messageId] }); assert.equal(result.success, true); assert.equal((await read).receipts[0].user.id, b.user.id);
  const history = await api.get(`/api/rooms/${roomId}/messages`).set(auth(a)); assert.equal(history.body.data[0].receipts[0].user.id, b.user.id);
  const notification = (await api.get('/api/notifications').set(auth(b))).body.data[0];
  check(await api.patch(`/api/notifications/${notification.id}/read`).set(auth(a)), 404, 'RESOURCE_NOT_FOUND');
  check(await api.patch(`/api/notifications/${notification.id}/read`).set(auth(b)), 200, 'NOTIFICATION_READ');
  assert.equal((await ack(sa, 'message:read', { roomId, messageIds: [randomUUID()] })).code, 'RESOURCE_NOT_FOUND');
});
test('cursor pagination and reconnect recover missed messages without duplicates', async () => {
  sb.disconnect();
  for (let index = 0; index < 5; index++) check(await api.post(`/api/rooms/${roomId}/messages`).set(auth(a)).send({ content: `Offline message ${index}`, clientMessageId: randomUUID() }), 201, 'MESSAGE_SAVED');
  sb = await connect(second.url, b.token); await ack(sb, 'room:watch', { roomId });
  let cursor = sequence; const found = [];
  do { const result = await api.get(`/api/rooms/${roomId}/messages?after=${cursor}&limit=2`).set(auth(b)); check(result, 200, 'MESSAGES_RETRIEVED'); found.push(...result.body.data); cursor = result.body.meta.nextCursor; if (!result.body.meta.hasMore) break; } while (true);
  assert.equal(found.length, 5); assert.equal(new Set(found.map(message => message.id)).size, 5);
  const latest = await api.get(`/api/rooms/${roomId}/messages?limit=2`).set(auth(a)); assert.equal(latest.body.data.length, 2);
  const older = await api.get(`/api/rooms/${roomId}/messages?before=${latest.body.meta.nextCursor}&limit=2`).set(auth(a)); assert.ok(BigInt(older.body.data.at(-1).sequence) < BigInt(latest.body.data[0].sequence));
});
test('leaving evicts all tabs across nodes, and logout revokes sockets', async () => {
  const tab = await connect(first.url, b.token); await ack(tab, 'room:watch', { roomId });
  const left = event(sb, 'room:left'); check(await api.post(`/api/rooms/${roomId}/leave`).set(auth(b)), 200, 'ROOM_LEFT'); await left;
  assert.equal((await ack(sb, 'message:send', { roomId, content: 'Not allowed', clientMessageId: randomUUID() })).code, 'ROOM_ACCESS_DENIED');
  const watchers = await first.realtime.io.in(`room:${roomId}`).fetchSockets(); assert.equal(watchers.filter(socket => socket.data.user.id === b.user.id).length, 0);
  check(await api.get(`/api/rooms/${roomId}/messages`).set(auth(b)), 403, 'ROOM_ACCESS_DENIED');
  const disconnected = event(sa, 'disconnect'); check(await api.post('/api/auth/logout').set(auth(a)), 200, 'LOGOUT_SUCCESS'); await disconnected;
  check(await api.get('/api/auth/me').set(auth(a)), 401, 'AUTHENTICATION_REQUIRED');
});
test('validation and health return consistent responses', async () => {
  check(await api.get('/health'), 200, 'SERVICE_HEALTHY');
  check(await api.get('/api/missing'), 404, 'ROUTE_NOT_FOUND');
  check(await api.get('/api/rooms/2/messages').set(auth(outsider)), 400, 'VALIDATION_ERROR');
  check(await api.get(`/api/rooms/${roomId}/messages?limit=0`).set(auth(outsider)), 400, 'VALIDATION_ERROR');
  check(await api.get(`/api/rooms/${roomId}/messages?before=1&after=2`).set(auth(outsider)), 400, 'VALIDATION_ERROR');
  check(await api.post('/api/auth/login').set('Content-Type', 'application/json').send('{oops'), 400, 'INVALID_JSON');
  assert.equal((await ack(sb, 'message:send', { roomId, content: ' ', clientMessageId: randomUUID() })).code, 'VALIDATION_ERROR');
});
