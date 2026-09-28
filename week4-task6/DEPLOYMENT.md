# Week 4 Task 6: deploy on Render

## What this task does

Task 5 checked the app on GitHub. Task 6 runs it on a cloud host so somebody else
can open it using an HTTPS URL without your laptop or Docker Desktop running.

The root `render.yaml` requests three free resources in the same region:
- Docker web service: API, Socket.IO UI, and email worker in one container.
- Managed PostgreSQL: application database.
- Managed Key Value: Redis-compatible cache and job queue.

Render builds the last (`cloud`) Dockerfile stage. Startup applies Prisma migrations
before launching API and worker. A failed migration prevents startup; an unexpected
API/worker exit shuts down the other process and fails the container. This demo
retains development dependencies to make the Prisma migration CLI available.
Local Compose still explicitly uses the separate runtime/migrate targets.

The app accepts Render's supplied public URL for HTTP/WebSocket origins and listens
on `0.0.0.0` and Render's `PORT`. For an additional/custom domain, set
`ALLOWED_ORIGINS` to that exact HTTPS origin in Render's Environment settings.

## 1. Put Task 6 on GitHub

From the VS Code terminal at the repository root:

```bash
cd "/Users/apple/Desktop/Wekkly Tasks"
git switch -c deploy/week4-task6
git add render.yaml week4-task6
git commit --only -m "Prepare Task 6 cloud deployment" -- render.yaml week4-task6
git push -u origin deploy/week4-task6
```

This stages/commits only Task 6; earlier tasks may still be staged in your workspace.
Open a pull request from `deploy/week4-task6` to `main`, wait for checks, then merge.
The inherited Task 5 workflow checks Task 5; local Task 6 verification is separate.
Do not force-push or discard local work if Git reports a conflict; resolve it first.

## 2. Connect Render

1. Open https://dashboard.render.com/ and sign up/sign in using GitHub.
2. Choose **New → Blueprint** and connect `vinitfordev-9/nodeJs-weeklyTasks`.
3. Choose branch `main` and Blueprint path `render.yaml`.
4. Give the Blueprint a name such as `week4-task6`.
5. Review the three resources. Each explicitly requests the **Free** plan. If Render
   shows a charge, an unavailable region/plan, or a free-resource quota error, stop
   before accepting a paid plan and review the message. Change all resources to
   the same available region if necessary.
6. Click the create/deploy button and wait for provisioning, build, and startup.

The Blueprint injects DATABASE_URL and REDIS_URL from the managed resources and
creates a random JWT_SECRET on Render. No secrets need to be pasted into GitHub.
The queue automatically uses REDIS_URL when BULLMQ_REDIS_URL is unset.
No local `.env` was copied into Task 6; never upload an actual `.env` file.

## 3. Open the live application

Open `week4-task6-api` in Render. When its status is **Live**, copy the public
`https://...onrender.com` URL shown there. Its exact hostname is assigned by Render;
do not assume it will be `week4-task6-api.onrender.com`.

- Open `https://YOUR-HOST.onrender.com/`: expect `E-commerce API is running...`.
- Open `https://YOUR-HOST.onrender.com/live/`: expect the login/order notification UI.
- Render logs should show migrations completed, Server started, and Email worker started.

## 4. Verify a database-backed endpoint with Postman

Your cloud database starts empty. Local test accounts are not copied to it.
In Postman send **POST** `https://YOUR-HOST.onrender.com/register`, Body → raw → JSON:

```json
{
  "name": "Cloud Demo",
  "email": "cloud-demo@example.com",
  "password": "ChooseYourOwnDemoPassword123!"
}
```

Expect **201 Created**. Use your own demo password. If you already registered that
email, use the login endpoint instead; duplicate registration is expected to fail.
Send **POST** `/login` on the same live host with the email/password, expect **200**,
and use the returned token as a Bearer Token for **GET** `/products`.
An empty array with **200 OK** is valid for a new database.

Log in at `/live/` with that same cloud account. To see live events, create an order
through POST `/orders` with a Bearer Token, using that user's actual returned ID.

## 5. Submit evidence

- **Live URL:** the actual public URL from Render; `/live/` is useful for showing the UI.
- **Repo link:** https://github.com/vinitfordev-9/nodeJs-weeklyTasks/tree/main/week4-task6
- **Endpoint screenshot:** Postman showing the public request URL, method,
  successful HTTP status, and response. GET `/products` is a useful screenshot;
  keep Authorization/token fields hidden.
- Optional: Render's Live status and browser UI with the public address bar visible.
- Do not screenshot database connection URLs, passwords, JWT secrets, or tokens.

Record the actual verified URL and response in `DELIVERABLES.md` after deployment.
No live URL or successful cloud endpoint has been claimed during local preparation.

## Free-tier limits

Render's free PostgreSQL database expires after **30 days**. This deployment is a
short-lived coursework demo unless you later arrange continued database hosting.
A free web service sleeps after idle time, so the next request can take time to wake
it up. The worker shares that lifecycle and cannot process jobs while asleep.
Free Key Value storage is not durable across restarts; cached data/queued jobs can
be lost. Only one free PostgreSQL and one free Key Value instance are allowed per
workspace. The inherited email processor simulates delivery; it does not send mail.

Sources (checked during preparation):
- https://render.com/docs/free
- https://render.com/docs/blueprint-spec
- https://render.com/docs/environment-variables
- https://render.com/docs/infrastructure-as-code

## Local validation

ESLint passed, all 17 Jest suites / 145 tests passed, and the cloud Docker image
built successfully before deployment.
The tests use isolated fixtures/mocks, including cloud process lifecycle tests;
they do not replace the live endpoint check on your assigned Render URL.
