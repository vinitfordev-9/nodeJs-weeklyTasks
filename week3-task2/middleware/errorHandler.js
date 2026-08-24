function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === "P2002") {
    return res.status(409).json({
      error: {
        message: "A record with that unique value already exists",
        code: err.code,
      },
    });
  }

  if (err.code === "P2003") {
    return res.status(409).json({
      error: {
        message: "This record is still referenced by another record",
        code: err.code,
      },
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      error: {
        message: "Record not found",
        code: err.code,
      },
    });
  }

  return res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
      code: err.status || 500,
    },
  });
}

module.exports = errorHandler;
