// Isolated demo: real HTTP/login/Socket.IO/browser, in-memory database fixture.
process.env.JWT_SECRET = "local-recording-only-secret";
process.env.LOG_LEVEL = "silent";
process.env.REDIS_CACHE_ENABLED = "false";
process.env.EMAIL_QUEUE_ENABLED = "false";
const path = require("path");
const fs = require("fs");
const { createServer } = require("http");
const { chromium } = require("playwright");
const bcrypt = require("bcrypt");
const fixture = require("../test/helpers/testDatabase");
const prismaPath = require.resolve("../config/prisma");
require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: fixture.prisma };
const app = require("../app");
const { attachRealtime } = require("../realtime/orderEvents");
async function main() {
  fixture.reset(await bcrypt.hash("demo-password", 10));
  const server = createServer(app);
  const realtime = attachRealtime(server);
  app.set("realtime", realtime);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  process.env.ALLOWED_ORIGINS = base;
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const context = await browser.newContext({ viewport: { width: 1000, height: 850 } });
    const page = await context.newPage();
    const errors = []; page.on("pageerror", (error) => errors.push(error.message));
    const output = path.join(__dirname, "../docs/demo-frames"); fs.mkdirSync(output, { recursive: true });
    let frame = 0;
    async function capture() { await page.screenshot({ path: path.join(output, `${String(frame++).padStart(2, "0")}.png`) }); }
    await page.goto(`${base}/live/`);
    await capture();
    await page.fill("#email", "user@example.com");
    await page.fill("#password", "demo-password");
    await page.click("form button");
    await page.waitForFunction(() => document.getElementById("status").textContent.startsWith("Connected"));
    await capture();
    const login = await fetch(`${base}/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "admin@example.com", password: "demo-password" }) });
    const { token } = await login.json();
    async function write(method, endpoint, body) {
      const response = await fetch(base + endpoint, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    }
    const body = { userId: 2, orderDate: new Date().toISOString(), status: "PENDING", totalAmount: 149 };
    const order = await write("POST", "/orders", body);
    await page.waitForFunction(() => document.getElementById("count").textContent === "1"); await capture();
    await write("PUT", `/orders/${order.id}`, { ...body, status: "SHIPPED" });
    await page.waitForFunction(() => document.getElementById("count").textContent === "2"); await capture();
    await write("POST", "/orders", { ...body, userId: 3 });
    await page.waitForTimeout(300);
    if (await page.textContent("#count") !== "2") throw new Error("Cross-account event leaked");
    await page.click("#disconnect"); await capture();
    await page.click("#reconnect");
    await page.waitForFunction(() => document.getElementById("status").textContent.startsWith("Connected")); await capture();
    await write("PUT", `/orders/${order.id}`, { ...body, status: "DELIVERED" });
    await page.waitForFunction(() => document.getElementById("count").textContent === "3"); await capture();
    await page.click("#logout"); await capture();
    if (errors.length) throw new Error(errors.join("\n"));
    console.log("Demo verified: create/update delivery, account isolation, disconnect/reconnect, logout; no browser errors.");
    await context.close();
  } finally { if (browser) await browser.close(); await realtime.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
