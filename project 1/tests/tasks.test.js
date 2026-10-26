import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
import request from 'supertest';

dotenv.config({ path: '.env.test', override: true, quiet: true });
const databaseUrl = new URL(process.env.DATABASE_URL);
if (databaseUrl.pathname !== '/project_1_test_db') throw new Error('Tests must use project_1_test_db.');
const { app } = await import('../src/app.js');
const { prisma } = await import('../src/config/database.js');
const api = request(app);
before(async () => { await prisma.task.deleteMany(); });
after(async () => { await prisma.task.deleteMany(); await prisma.$disconnect(); });

function envelope(response, status, code) {
  assert.equal(response.status, status);
  assert.equal(response.body.code, code);
  assert.equal(response.body.success, status < 400);
  assert.deepEqual(Object.keys(response.body).sort(), ['code', 'data', 'errors', 'message', 'meta', 'success']);
}

test('CRUD persists records, maps status, clears nullable fields, and handles deletion', async () => {
  const created = await api.post('/api/tasks').send({ title: '  Learn Prisma  ', dueDate: '2026-12-01T10:00:00+05:30', priority: 'high' });
  envelope(created, 201, 'TASK_CREATED');
  const id = created.body.data.id;
  assert.equal(created.body.data.title, 'Learn Prisma');
  assert.equal(created.body.data.status, 'todo');
  assert.equal(created.body.data.dueDate, '2026-12-01T04:30:00.000Z');
  assert.equal((await prisma.task.findUnique({ where: { id } })).title, 'Learn Prisma');
  envelope(await api.get(`/api/tasks/${id}`), 200, 'TASK_RETRIEVED');
  const updated = await api.patch(`/api/tasks/${id}`).send({ status: 'in-progress', dueDate: null, description: null });
  envelope(updated, 200, 'TASK_UPDATED');
  assert.equal(updated.body.data.status, 'in-progress');
  assert.equal(updated.body.data.dueDate, null);
  assert.equal(updated.body.data.title, 'Learn Prisma');
  envelope(await api.delete(`/api/tasks/${id}`), 200, 'TASK_DELETED');
  envelope(await api.get(`/api/tasks/${id}`), 404, 'TASK_NOT_FOUND');
  envelope(await api.patch(`/api/tasks/${id}`).send({ status: 'done' }), 404, 'TASK_NOT_FOUND');
  envelope(await api.delete(`/api/tasks/${id}`), 404, 'TASK_NOT_FOUND');
});

test('filters combine, pagination counts match, and priority/due-date sorting work', async () => {
  for (const [title, priority, status, dueDate] of [
    ['A', 'low', 'todo', null], ['B', 'high', 'todo', '2026-12-02T00:00:00Z'],
    ['C', 'high', 'todo', '2026-12-01T00:00:00Z'], ['D', 'medium', 'in-progress', null],
  ]) envelope(await api.post('/api/tasks').send({ title, priority, status, dueDate }), 201, 'TASK_CREATED');
  const filtered = await api.get('/api/tasks?status=todo&priority=high&limit=1&page=2&sortBy=dueDate&sortOrder=asc');
  envelope(filtered, 200, 'TASKS_RETRIEVED');
  assert.equal(filtered.body.data[0].title, 'B');
  assert.equal(filtered.body.meta.total, 2);
  assert.equal(filtered.body.meta.totalPages, 2);
  assert.equal(filtered.body.meta.hasNextPage, false);
  const sorted = await api.get('/api/tasks?sortBy=priority&sortOrder=desc');
  assert.deepEqual(sorted.body.data.map(task => task.priority), ['high', 'high', 'medium', 'low']);
  const dueDates = await api.get('/api/tasks?sortBy=dueDate&sortOrder=asc');
  assert.deepEqual(dueDates.body.data.slice(0, 2).map(task => task.title), ['C', 'B']);
  assert.equal(dueDates.body.data[3].dueDate, null);
  const progress = await api.get('/api/tasks?status=in-progress');
  assert.equal(progress.body.data[0].status, 'in-progress');
  assert.deepEqual((await api.get('/api/tasks?page=99')).body.data, []);
});

test('invalid bodies, IDs, and query parameters return consistent validation errors', async () => {
  for (const body of [{}, { title: ' ' }, { title: 5 }, { title: 'A', priority: 'urgent' }, { title: 'A', status: 'in_progress' }, { title: 'A', dueDate: '2026-02-30T00:00:00Z' }, { title: 'A', extra: true }, []]) {
    const result = await api.post('/api/tasks').send(body);
    envelope(result, 400, 'VALIDATION_ERROR');
    assert.ok(result.body.errors.length);
  }
  envelope(await api.patch(`/api/tasks/${randomUUID()}`).send({}), 400, 'VALIDATION_ERROR');
  for (const query of ['page=0', 'limit=101', 'page=1.2', 'page=abc', 'sortBy=title', 'status=bad', 'priority=urgent', 'page=1&page=2', 'unknown=x']) {
    envelope(await api.get(`/api/tasks?${query}`), 400, 'VALIDATION_ERROR');
  }
  envelope(await api.get('/api/tasks/invalid'), 400, 'VALIDATION_ERROR');
});

test('malformed JSON, unsupported content, oversized payloads, unknown routes, and health', async () => {
  envelope(await api.post('/api/tasks').set('Content-Type', 'application/json').send('{bad'), 400, 'INVALID_JSON');
  envelope(await api.post('/api/tasks').set('Content-Type', 'text/plain').send('hello'), 415, 'UNSUPPORTED_MEDIA_TYPE');
  envelope(await api.post('/api/tasks').send({ title: 'A', description: 'a'.repeat(40000) }), 413, 'PAYLOAD_TOO_LARGE');
  envelope(await api.get('/missing'), 404, 'ROUTE_NOT_FOUND');
  envelope(await api.get('/health'), 200, 'SERVICE_HEALTHY');
});
