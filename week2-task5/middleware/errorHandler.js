const {
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError,
} = require("sequelize");

function errorHandler(error, req, res, next) {
  console.error(error);

  if (error instanceof UniqueConstraintError) {
    return res.status(409).json({
      error: { message: "A record with that unique value already exists", code: 409 },
    });
  }

  if (error instanceof ForeignKeyConstraintError) {
    return res.status(409).json({
      error: { message: "The record is referenced by another record", code: 409 },
    });
  }

  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: { message: error.errors.map((item) => item.message).join(", "), code: 400 },
    });
  }

  const status = error.status || 500;
  return res.status(status).json({
    error: { message: error.message || "Internal Server Error", code: status },
  });
}

module.exports = errorHandler;
