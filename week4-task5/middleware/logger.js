const { randomUUID } = require("node:crypto");
const pinoHttp = require("pino-http");
const rootLogger = require("../config/logger");

const requestLogger = pinoHttp({
  logger: rootLogger,
  genReqId(_req, res) {
    const requestId = randomUUID();
    res.setHeader("X-Request-Id", requestId);
    return requestId;
  },
  quietReqLogger: true,
  customAttributeKeys: {
    reqId: "requestId",
    responseTime: "responseTimeMs",
  },
  customProps(req) {
    return { requestId: req.id };
  },
  customLogLevel(_req, res, err) {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage(req) {
    return `${req.method} ${req.originalUrl} completed`;
  },
  customErrorMessage(req) {
    return `${req.method} ${req.originalUrl} failed`;
  },
});

module.exports = requestLogger;
