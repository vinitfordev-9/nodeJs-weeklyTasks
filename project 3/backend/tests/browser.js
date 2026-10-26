import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { start, clear, prisma } from './helpers.js';
const server = await start(); await clear();
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const contextA = await browser.newContext({ viewport: { width: 1440, height: 1000 } }); const contextB = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const a = await contextA.newPage(); const b = await contextB.newPage(); const errors = [];
for (const page of [a,b]) { page.setDefaultTimeout(15000); page.on('pageerror', error => errors.push(error.message)); }
await mkdir('test-results', { recursive: true });
async function register(page, name, handle) {
  await page.goto(server.url); await page.getByRole('button', { name: 'Create an account', exact: true }).click();
  await page.getByLabel('Your name', { exact: true }).fill(name); await page.getByLabel('Your handle').fill(handle); await page.getByLabel('Email address').fill(`${handle}@test.dev`); await page.getByLabel('Password', { exact: true }).fill('TestingPass123!'); await page.getByRole('button', { name: 'Create your account' }).click(); await page.getByRole('button', { name: 'Find your room' }).waitFor();
}
try {
  await a.goto(server.url); await a.screenshot({ path: 'test-results/sign-in.png', fullPage: true });
  await register(a, 'Alex Lee', 'alex');
  await a.getByRole('button', { name: 'Create room', exact: true }).click();
  await a.getByLabel('Room name').fill('the-common-room'); await a.getByLabel('What’s this room about?').fill('Small wins, big ideas, and the everyday in between.'); await a.getByRole('button', { name: 'Create room →' }).click();
  await a.getByRole('textbox', { name: 'Message the-common-room', exact: true }).waitFor();
  await register(b, 'Mara Kim', 'mara'); await b.getByRole('button', { name: 'Find your room' }).click(); await b.getByRole('button', { name: 'Join', exact: true }).click();
  await b.getByText('2 online', { exact: true }).waitFor();
  await a.getByRole('textbox', { name: 'Message the-common-room', exact: true }).fill('Hello @mara! This arrived live.'); await a.getByRole('button', { name: 'Send message', exact: true }).click();
  await b.locator('.message-content').filter({ hasText: 'This arrived live.' }).waitFor();
  await b.bringToFront(); await b.getByRole('textbox', { name: 'Message the-common-room', exact: true }).fill('Lovely to be here. Let’s build something together.');
  await a.locator('.typing-line').filter({ hasText: 'Mara' }).waitFor();
  await a.locator('.receipt').filter({ hasText: 'Seen by Mara' }).waitFor();
  await b.getByRole('button', { name: 'Send message', exact: true }).click(); await a.locator('.message-content').filter({ hasText: 'Lovely to be here.' }).waitFor();
  await b.getByRole('button', { name: 'Mentions', exact: true }).click(); await b.getByText('Alex Lee mentioned you').waitFor(); await b.getByRole('button', { name: 'Close dialog' }).click();
  await a.screenshot({ path: 'test-results/chat-desktop.png', fullPage: true });
  await a.setViewportSize({ width: 390, height: 844 }); assert.ok(await a.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await a.screenshot({ path: 'test-results/chat-mobile.png', fullPage: true });
  await b.reload(); await b.locator('.message-content').filter({ hasText: 'This arrived live.' }).waitFor();
  await b.getByRole('button', { name: 'Leave room', exact: true }).click(); await b.getByRole('button', { name: 'Leave room', exact: true }).last().click(); await b.getByRole('button', { name: 'Find your room' }).waitFor();
  assert.deepEqual(errors, []); console.log('Browser passed: registration, room creation/join/leave, two-user live delivery, typing, mentions, reload persistence, desktop/mobile layout.');
} catch (error) { await a.screenshot({ path: 'test-results/failure-a.png', fullPage: true }); await b.screenshot({ path: 'test-results/failure-b.png', fullPage: true }); throw error; }
finally { await browser.close(); await server.close(); await clear(); await prisma.$disconnect(); }
