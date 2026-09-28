# BullMQ background-job implementation

## Request and worker flow

1. `POST /register` validates and sanitizes the request.
2. `authService.register` hashes the password and commits the user to PostgreSQL.
3. `authController.register` adds a `send-confirmation-email` job to the `email-delivery` BullMQ queue.
4. The API returns `201` with `confirmationQueued: true`; no email-provider work runs in the HTTP process.
5. The independently started `workers/emailWorker.js` process reserves the job from Redis and calls `processors/emailProcessor.js`.
6. Completion and every failed attempt are emitted as structured Pino JSON logs with the original request ID.

Only the minimum delivery fields are placed in job data: user ID, name, email, and request ID. Passwords and tokens are never queued.

## Retry and retention policy

Every job has `attempts: 3` and exponential backoff beginning at 1,000 ms. This gives two retries after the first failure. Successful jobs are retained for at most one hour or 1,000 records. Failed jobs are retained for at most one day or 5,000 records for diagnosis.

The job ID is `confirmation-email-<userId>`, making the registration side effect idempotent if the producer repeats the same enqueue call.

## Live verification

Verified locally on 31 August 2026 with BullMQ 6.3.2, Redis 8.10.1, and separate producer/worker processes.

Successful job:

```text
jobId=confirmation-email-901 jobName=send-confirmation-email
Confirmation email delivered
Background job completed
```

Deliberate provider failure with `SIMULATE_EMAIL_FAILURE=true`:

```text
attemptsMade=1 maxAttempts=3 willRetry=true
attemptsMade=2 maxAttempts=3 willRetry=true
attemptsMade=3 maxAttempts=3 willRetry=false
```

The test used a temporary localhost Redis instance. Both the worker and Redis instance were stopped afterward.

## Operational commands

```bash
# Terminal 1
redis-server

# Terminal 2
npm run dev

# Terminal 3
npm run worker:email
```

To exercise retry logging without changing code:

```bash
SIMULATE_EMAIL_FAILURE=true npm run worker:email
```
