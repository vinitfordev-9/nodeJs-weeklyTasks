const jwt = require("jsonwebtoken");

const { getJwtSecret } = require("../config/auth");

function authenticateToken(req, res, next) {
  const authorization = req.get("authorization");

  if (!authorization) {
    return res.status(401).json({ message: "Authentication token is required" });
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return res.status(401).json({
      message: "Authorization header must use the Bearer token scheme",
    });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });

    req.user = {
      id: Number(payload.sub),
      email: payload.email,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Authentication token has expired" });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Authentication token is invalid" });
    }

    next(error);
  }
}

module.exports = authenticateToken;
