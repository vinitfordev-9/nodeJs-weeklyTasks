import { ErrorRequestHandler } from "express";
import { QueryFailedError } from "typeorm";
import { HttpError } from "../errors/HttpError";

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  console.error(error);

  if (error instanceof HttpError) {
    res.status(error.status).json({ error: { message: error.message, code: error.status } });
    return;
  }

  if (error instanceof QueryFailedError) {
    const message = String((error as QueryFailedError & { driverError?: unknown }).driverError ?? error.message);
    const conflict = /unique|foreign key constraint/i.test(message);
    const status = conflict ? 409 : 400;
    res.status(status).json({
      error: {
        message: conflict ? "The operation conflicts with an existing record" : "Database validation failed",
        code: status,
      },
    });
    return;
  }

  const message = error instanceof Error ? error.message : "Internal Server Error";
  res.status(500).json({ error: { message, code: 500 } });
};
