import { RequestHandler } from "express";

export const logger: RequestHandler = (req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${Date.now() - startedAt}ms`);
  });
  next();
};
