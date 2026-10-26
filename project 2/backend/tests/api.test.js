import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
import request from 'supertest';
dotenv.config({ path: '.env.test', override: true, quiet: true });
if (new URL(process.env.DATABASE_URL).pathname !== '/project_2_test_db') throw new Error('Tests may only use project_2_test_db.');
const { app } = await import('../src/app.js');
const { prisma } = await import('../src/config/database.js');
const api = request(app);
const pdf = readFileSync(new URL('../../postman/sample-resume.pdf', import.meta.url));
const users = {};
let jobId, applicationId;
const job = { title: 'Frontend Engineer', location: 'Bengaluru, India', description: 'Build accessible interfaces with a thoughtful engineering team.', requirements: 'JavaScript, React, and clear communication.', tags: ['react', 'typescript'], salaryMin: 1000000, salaryMax: 2000000, workMode: 'remote' };
const auth = token => ({ Authorization: `Bearer ${token}` });
function check(result, status, code) {
  assert.equal(result.status, status, JSON.stringify(result.body));
  assert.equal(result.body.code, code);
  assert.equal(result.body.success, status < 400);
  assert.deepEqual(Object.keys(result.body).sort(), ['code', 'data', 'errors', 'message', 'meta', 'success']);
  assert.equal(JSON.stringify(result.body).includes('passwordHash'), false);
  assert.equal(JSON.stringify(result.body).includes('resumeBytes'), false);
}
before(async () => { await prisma.application.deleteMany(); await prisma.job.deleteMany(); await prisma.user.deleteMany(); });
after(async () => { await prisma.application.deleteMany(); await prisma.job.deleteMany(); await prisma.user.deleteMany(); await prisma.$disconnect(); });
test('registers roles, validates profiles, normalizes emails, and signs in', async () => {
  for (const [key, role] of [['company', 'company'], ['otherCompany', 'company'], ['candidate', 'candidate'], ['otherCandidate', 'candidate']]) {
    const result = await api.post('/api/auth/register').send({ name: key, email: `${key}@test.dev`, password: 'TestingPass123!', role, ...(role === 'company' && { companyName: key }) });
    check(result, 201, 'ACCOUNT_CREATED'); users[key] = result.body.data;
  }
  check(await api.post('/api/auth/register').send({ name: 'Company', email: 'a@b.dev', password: 'TestingPass123!', role: 'company' }), 400, 'VALIDATION_ERROR');
  check(await api.post('/api/auth/register').send({ name: 'Candidate', email: 'CANDIDATE@test.dev', password: 'TestingPass123!', role: 'candidate' }), 409, 'EMAIL_IN_USE');
  check(await api.post('/api/auth/login').send({ email: 'candidate@test.dev', password: 'wrong' }), 401, 'INVALID_CREDENTIALS');
  check(await api.post('/api/auth/login').send({ email: 'CANDIDATE@test.dev', password: 'TestingPass123!' }), 200, 'LOGIN_SUCCESS');
  check(await api.get('/api/auth/me').set(auth(users.candidate.token)), 200, 'PROFILE_RETRIEVED');
});
test('company CRUD enforces authentication, ownership, and salary constraints', async () => {
  check(await api.post('/api/jobs').send(job), 401, 'AUTHENTICATION_REQUIRED');
  check(await api.post('/api/jobs').set(auth(users.candidate.token)).send(job), 403, 'ACCESS_DENIED');
  const result = await api.post('/api/jobs').set(auth(users.company.token)).send(job);
  check(result, 201, 'JOB_CREATED'); jobId = result.body.data.id;
  check(await api.get(`/api/jobs/${jobId}`), 200, 'JOB_RETRIEVED');
  check(await api.patch(`/api/jobs/${jobId}`).set(auth(users.otherCompany.token)).send({ title: 'Not allowed' }), 403, 'ACCESS_DENIED');
  check(await api.delete(`/api/jobs/${jobId}`).set(auth(users.otherCompany.token)), 403, 'ACCESS_DENIED');
  check(await api.patch(`/api/jobs/${jobId}`).set(auth(users.company.token)).send({ salaryMin: 3000000 }), 400, 'VALIDATION_ERROR');
  check(await api.patch(`/api/jobs/${jobId}`).set(auth(users.company.token)).send({ title: 'Senior Frontend Engineer' }), 200, 'JOB_UPDATED');
  check(await api.patch(`/api/jobs/${jobId}`).set(auth(users.company.token)).send({ companyId: users.otherCompany.user.id }), 400, 'VALIDATION_ERROR');
  check(await api.get('/api/company/jobs').set(auth(users.candidate.token)), 403, 'ACCESS_DENIED');
  const own = await api.get('/api/company/jobs').set(auth(users.otherCompany.token)); assert.equal(own.body.meta.total, 0);
});
test('search, case-insensitive location, all-tag filtering, pagination, and closed jobs', async () => {
  await api.post('/api/jobs').set(auth(users.company.token)).send({ ...job, title: 'Backend Engineer', tags: ['node.js'], location: 'Mumbai', salaryMax: 3000000 });
  await api.post('/api/jobs').set(auth(users.company.token)).send({ ...job, title: 'Closed Engineer', status: 'closed' });
  const result = await api.get('/api/jobs?q=FRONTEND&location=bengaluru&tags=React,typescript&workMode=remote&limit=1');
  check(result, 200, 'JOBS_RETRIEVED'); assert.equal(result.body.meta.total, 1); assert.equal(result.body.data[0].id, jobId);
  const page = await api.get('/api/jobs?limit=1&page=2&sortBy=salary'); assert.equal(page.body.meta.total, 2); assert.equal(page.body.data.length, 1);
  const sorted = await api.get('/api/jobs?sortBy=salary'); assert.equal(sorted.body.data[0].title, 'Backend Engineer');
  assert.equal((await api.get('/api/jobs?page=99')).body.data.length, 0);
  for (const query of ['page=0', 'limit=51', 'sortBy=bad', 'type=bad', 'q=x&q=y', 'extra=x']) check(await api.get(`/api/jobs?${query}`), 400, 'VALIDATION_ERROR');
});
test('PDF upload rejects missing, forged, oversized files and non-candidate users', async () => {
  const url = `/api/jobs/${jobId}/applications`;
  check(await api.post(url).set(auth(users.company.token)).attach('resume', pdf, 'resume.pdf'), 403, 'ACCESS_DENIED');
  check(await api.post(url).set(auth(users.candidate.token)).field('coverLetter', 'Hello'), 400, 'INVALID_RESUME');
  check(await api.post(url).set(auth(users.candidate.token)).attach('resume', Buffer.from('not a PDF'), 'fake.pdf'), 400, 'INVALID_RESUME');
  check(await api.post(url).set(auth(users.candidate.token)).attach('resume', Buffer.alloc(5 * 1024 * 1024 + 1), 'large.pdf'), 413, 'PAYLOAD_TOO_LARGE');
  check(await api.post(url).set(auth(users.candidate.token)).attach('other', pdf, 'resume.pdf'), 400, 'INVALID_RESUME');
  assert.equal(await prisma.application.count(), 0);
});
test('application submission, concurrent duplicate prevention, private resume, and statuses', async () => {
  const submit = () => api.post(`/api/jobs/${jobId}/applications`).set(auth(users.candidate.token)).field('coverLetter', 'I enjoy building accessible products.').attach('resume', pdf, 'resume.pdf');
  const results = await Promise.all([submit(), submit()]);
  assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
  const success = results.find(result => result.status === 201); check(success, 201, 'APPLICATION_SUBMITTED'); applicationId = success.body.data.id;
  check(results.find(result => result.status === 409), 409, 'ALREADY_APPLIED');
  assert.equal(await prisma.application.count(), 1);
  check(await api.get(`/api/jobs/${jobId}/applications`).set(auth(users.otherCompany.token)), 403, 'ACCESS_DENIED');
  const applicants = await api.get(`/api/jobs/${jobId}/applications`).set(auth(users.company.token)); check(applicants, 200, 'APPLICATIONS_RETRIEVED'); assert.equal(applicants.body.data[0].candidate.email, 'candidate@test.dev');
  check(await api.get(`/api/applications/${applicationId}/resume`).set(auth(users.otherCandidate.token)), 403, 'ACCESS_DENIED');
  check(await api.get(`/api/applications/${applicationId}/resume`).set(auth(users.otherCompany.token)), 403, 'ACCESS_DENIED');
  for (const user of [users.company, users.candidate]) {
    const download = await api.get(`/api/applications/${applicationId}/resume`).set(auth(user.token)); assert.equal(download.status, 200); assert.match(download.headers['content-type'], /application\/pdf/); assert.deepEqual(download.body, pdf);
  }
  check(await api.patch(`/api/applications/${applicationId}/status`).set(auth(users.otherCompany.token)).send({ status: 'shortlisted' }), 403, 'ACCESS_DENIED');
  check(await api.patch(`/api/applications/${applicationId}/status`).set(auth(users.company.token)).send({ status: 'shortlisted' }), 200, 'APPLICATION_UPDATED');
  const mine = await api.get('/api/applications/me').set(auth(users.candidate.token)); assert.equal(mine.body.data[0].status, 'shortlisted');
  assert.equal((await api.get('/api/applications/me').set(auth(users.otherCandidate.token))).body.meta.total, 0);
});
test('closed job refuses applications; deleting job removes dependent resumes', async () => {
  check(await api.patch(`/api/jobs/${jobId}`).set(auth(users.company.token)).send({ status: 'closed' }), 200, 'JOB_UPDATED');
  check(await api.post(`/api/jobs/${jobId}/applications`).set(auth(users.otherCandidate.token)).attach('resume', pdf, 'resume.pdf'), 409, 'JOB_CLOSED');
  check(await api.delete(`/api/jobs/${jobId}`).set(auth(users.company.token)), 200, 'JOB_DELETED');
  assert.equal(await prisma.application.count({ where: { jobId } }), 0);
  check(await api.get(`/api/jobs/${jobId}`), 404, 'RESOURCE_NOT_FOUND');
});
test('uniform errors, frontend serving, health, and revoked/expired sessions', async () => {
  check(await api.get('/api/jobs/2'), 400, 'VALIDATION_ERROR');
  check(await api.get(`/api/jobs/${randomUUID()}`), 404, 'RESOURCE_NOT_FOUND');
  check(await api.get('/api/missing'), 404, 'ROUTE_NOT_FOUND');
  check(await api.post('/api/auth/login').set('Content-Type', 'application/json').send('{oops'), 400, 'INVALID_JSON');
  check(await api.post('/api/auth/login').set('Content-Type', 'text/plain').send('oops'), 415, 'UNSUPPORTED_MEDIA_TYPE');
  check(await api.get('/health'), 200, 'SERVICE_HEALTHY');
  assert.match((await api.get('/')).text, /Role &amp; Co\.|Role & Co\./);
  check(await api.post('/api/auth/logout').set(auth(users.candidate.token)), 200, 'LOGOUT_SUCCESS');
  check(await api.get('/api/auth/me').set(auth(users.candidate.token)), 401, 'AUTHENTICATION_REQUIRED');
  await prisma.session.updateMany({ where: { userId: users.company.user.id }, data: { expiresAt: new Date(0) } });
  check(await api.get('/api/auth/me').set(auth(users.company.token)), 401, 'AUTHENTICATION_REQUIRED');
});
