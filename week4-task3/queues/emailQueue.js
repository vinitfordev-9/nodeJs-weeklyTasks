const { Queue } = require("bullmq");

const { getBullMqConnection } = require("../config/bullmq");

const EMAIL_QUEUE_NAME = "email-delivery";
const SEND_CONFIRMATION_EMAIL_JOB = "send-confirmation-email";
let emailQueue;

function isEnabled() {
  if (process.env.EMAIL_QUEUE_ENABLED !== undefined) {
    return process.env.EMAIL_QUEUE_ENABLED !== "false";
  }
  return process.env.NODE_ENV !== "test";
}

function getQueue() {
  if (!emailQueue) {
    emailQueue = new Queue(EMAIL_QUEUE_NAME, {
      connection: getBullMqConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: { age: 3600, count: 1000 },
        removeOnFail: { age: 86400, count: 5000 },
      },
    });
  }
  return emailQueue;
}

async function enqueueConfirmationEmail(user, requestId) {
  if (!isEnabled()) return null;

  return getQueue().add(
    SEND_CONFIRMATION_EMAIL_JOB,
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      requestId,
    },
    { jobId: `confirmation-email-${user.id}` },
  );
}

async function close() {
  if (emailQueue) await emailQueue.close();
}

module.exports = {
  EMAIL_QUEUE_NAME,
  SEND_CONFIRMATION_EMAIL_JOB,
  close,
  enqueueConfirmationEmail,
};
