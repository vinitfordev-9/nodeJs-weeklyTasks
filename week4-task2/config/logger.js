const pino = require("pino");

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  serializers: {
    err: pino.stdSerializers.err,
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "request.headers.authorization",
      "request.headers.cookie",
    ],
    censor: "[REDACTED]",
  },
});

module.exports = logger;
