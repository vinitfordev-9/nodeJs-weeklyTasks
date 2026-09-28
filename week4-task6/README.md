# Week 4 Task 6 — Public cloud deployment

Copied from `week4-task5`. Deploy the Dockerized API, live order UI, and email worker
to Render with managed PostgreSQL and Redis-compatible Key Value storage.

Follow [DEPLOYMENT.md](DEPLOYMENT.md) for the step-by-step GitHub and Render setup,
endpoint verification, free-tier limits, and screenshots. Fill in
[DELIVERABLES.md](DELIVERABLES.md) after the public deployment succeeds.

The repository-root `render.yaml` configures the cloud resources and generated
secrets. The Dockerfile's final `cloud` stage runs migrations followed by both the
API and worker. Previous tasks remain unchanged.

Local checks:

```bash
npm ci
npm run lint
npm run test:ci
```

For local Compose, copy `.env.example` to `.env`, replace its credential placeholders,
then run `docker compose up --build -d`. Compose uses separate API and worker
containers; the cloud startup process is only used by the cloud Dockerfile target.

- [Live application UI](https://week4-task6-api.onrender.com/live/) — log in and view live order notifications.
- [API status endpoint](https://week4-task6-api.onrender.com/) — displays “E-commerce API is running...” to confirm the server responds.

Both links belong to the same deployed application.

Public GET `/` verified with HTTP 200 on 2026-09-28. See
[DELIVERABLES.md](DELIVERABLES.md) for the response and submission links.
