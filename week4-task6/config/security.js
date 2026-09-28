const cors = require("cors");
const helmet = require("helmet");

function getAllowedOrigins() {
  return [process.env.ALLOWED_ORIGINS, process.env.RENDER_EXTERNAL_URL]
    .filter(Boolean).join(",")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const corsOptions = {
  origin(origin, callback) {
    // Requests without an Origin header include server-to-server and CLI clients.
    if (!origin || getAllowedOrigins().includes(origin)) {
      return callback(null, true);
    }

    const error = new Error("Origin is not allowed by CORS policy");
    error.status = 403;
    callback(error);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  maxAge: 86400,
};

const securityHeaders = helmet({
  crossOriginResourcePolicy: { policy: "same-site" },
  referrerPolicy: { policy: "no-referrer" },
});

const corsMiddleware = cors(corsOptions);

module.exports = {
  corsMiddleware,
  corsOptions,
  getAllowedOrigins,
  securityHeaders,
};
