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

    const userId = Number(payload.sub);
    const validRoles = ["USER", "ADMIN"];

    if (
      !Number.isInteger(userId) ||
      userId <= 0 ||
      typeof payload.email !== "string" ||
      !validRoles.includes(payload.role)
    ) {
      throw new jwt.JsonWebTokenError("JWT user claims are invalid");
    }

    req.user = {
      id: userId,
      email: payload.email,
      role: payload.role,
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
