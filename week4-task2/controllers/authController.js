const authService = require("../services/authService");
const emailQueue = require("../queues/emailQueue");

async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);
    let confirmationQueued = false;

    try {
      const job = await emailQueue.enqueueConfirmationEmail(user, req.id);
      confirmationQueued = Boolean(job);
      if (job) {
        req.log.info(
          { jobId: job.id, jobName: job.name },
          "Confirmation email job enqueued",
        );
      }
    } catch (queueError) {
      req.log.error(
        { err: queueError, userId: user.id },
        "User created but confirmation email could not be enqueued",
      );
    }

    res.status(201).json({ user, confirmationQueued });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);

    if (!result) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { login, register };
