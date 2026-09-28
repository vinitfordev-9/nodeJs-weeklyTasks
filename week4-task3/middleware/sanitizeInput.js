const sanitizeHtml = require("sanitize-html");

const SENSITIVE_KEYS = new Set(["password", "token"]);
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function sanitizeString(value) {
  return sanitizeHtml(value.replaceAll("\0", ""), {
    allowedTags: [],
    allowedAttributes: {},
  });
}

function sanitizeValue(value, key) {
  if (typeof value === "string") {
    return SENSITIVE_KEYS.has(key) ? value : sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === "object") {
    for (const childKey of Object.keys(value)) {
      if (UNSAFE_KEYS.has(childKey)) {
        delete value[childKey];
      } else {
        value[childKey] = sanitizeValue(value[childKey], childKey);
      }
    }
  }

  return value;
}

function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }

  next();
}

module.exports = { sanitizeInput, sanitizeValue };
