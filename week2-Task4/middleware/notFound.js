function notFound(req, res, next) {
  res.status(404).json({
    error: {
      message: "Route not found",
      code: 404,
    },
  });
}

module.exports = notFound;
