function notFound(req, res) {
  res.status(404).json({ error: { message: "Route not found", code: 404 } });
}

module.exports = notFound;
