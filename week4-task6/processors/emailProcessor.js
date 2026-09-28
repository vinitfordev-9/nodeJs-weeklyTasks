const logger = require("../config/logger");
const { SEND_CONFIRMATION_EMAIL_JOB } = require("../queues/emailQueue");

async function sendConfirmationEmail(job) {
  const delay = Number(process.env.EMAIL_DELIVERY_DELAY_MS) || 250;
  await new Promise((resolve) => setTimeout(resolve, delay));

  if (process.env.SIMULATE_EMAIL_FAILURE === "true") {
    throw new Error("Simulated email provider failure");
  }

  logger.info(
    {
      jobId: job.id,
      requestId: job.data.requestId,
      userId: job.data.userId,
      recipient: job.data.email,
    },
    "Confirmation email delivered",
  );

  return { delivered: true, deliveredAt: new Date().toISOString() };
}

async function processEmailJob(job) {
  if (job.name === SEND_CONFIRMATION_EMAIL_JOB) {
    return sendConfirmationEmail(job);
  }

  throw new Error(`Unsupported email job type: ${job.name}`);
}

module.exports = { processEmailJob, sendConfirmationEmail };
