require("dotenv").config({ quiet: true });

const { Worker } = require("bullmq");

const { getBullMqConnection } = require("../config/bullmq");
const logger = require("../config/logger");
const { EMAIL_QUEUE_NAME } = require("../queues/emailQueue");
const { processEmailJob } = require("../processors/emailProcessor");

const worker = new Worker(EMAIL_QUEUE_NAME, processEmailJob, {
  connection: getBullMqConnection(),
  concurrency: Number(process.env.EMAIL_WORKER_CONCURRENCY) || 5,
});

worker.on("completed", (job, result) => {
  logger.info(
    {
      jobId: job.id,
      jobName: job.name,
      requestId: job.data.requestId,
      result,
    },
    "Background job completed",
  );
});

worker.on("failed", (job, err) => {
  const maxAttempts = job?.opts.attempts || 1;
  logger.error(
    {
      err,
      jobId: job?.id,
      jobName: job?.name,
      requestId: job?.data.requestId,
      attemptsMade: job?.attemptsMade,
      maxAttempts,
      willRetry: Boolean(job && job.attemptsMade < maxAttempts),
    },
    "Background job attempt failed",
  );
});

worker.on("error", (err) => {
  logger.error({ err }, "Email worker error");
});

logger.info(
  { queue: EMAIL_QUEUE_NAME, concurrency: worker.opts.concurrency },
  "Email worker started",
);

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "Email worker shutting down");
  await worker.close();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
