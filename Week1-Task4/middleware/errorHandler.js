function errorHandler(err, req, res, next) {
  console.error(err);

  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
      code: err.status || 500,
    },
  });
}

module.exports = errorHandler;

//dont hardcode the erro-http packages we can use to show the error,read from constant file